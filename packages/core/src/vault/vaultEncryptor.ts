import { createCipheriv, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

import type { EncryptedEnvFile, EncryptedValue } from '../types/index.js';
import { parseEnvContent } from '../env/envLoader.js';

import { deriveKey, generateSalt } from './vaultKeyDerivation.js';

export class VaultError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VaultError';
  }
}

function encryptValue(plaintext: string, key: Buffer): EncryptedValue {
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
}

/**
 * Encrypt each VALUE in an .env file individually.
 * KEYs remain in plaintext for Git searchability.
 */
export function encryptEnvFile(envPath: string, passphrase: string): EncryptedEnvFile {
  let content: string;
  try {
    content = readFileSync(envPath, 'utf-8');
  } catch (err) {
    throw new VaultError(`Failed to read env file: ${envPath} — ${(err as Error).message}`);
  }

  const envMap = parseEnvContent(content);
  const salt = generateSalt();
  const key = deriveKey(passphrase, salt);

  const entries: Record<string, EncryptedValue> = {};
  for (const [k, v] of Object.entries(envMap)) {
    entries[k] = encryptValue(v, key);
  }

  return {
    metadata: {
      version: 1,
      algorithm: 'aes-256-gcm',
      iterations: 100_000,
      salt: salt.toString('base64'),
      createdAt: new Date().toISOString(),
    },
    entries,
  };
}

/**
 * Write an EncryptedEnvFile to disk as JSON.
 */
export function writeVaultFile(vaultPath: string, vault: EncryptedEnvFile): void {
  writeFileSync(vaultPath, JSON.stringify(vault, null, 2), 'utf-8');
}
