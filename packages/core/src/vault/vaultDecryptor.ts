import { createDecipheriv } from 'node:crypto';
import { readFileSync } from 'node:fs';

import type { EncryptedEnvFile, EncryptedValue, EnvMap } from '../types/index.js';

import { VaultError } from './vaultEncryptor.js';
import { deriveKey } from './vaultKeyDerivation.js';

function decryptValue(encrypted: EncryptedValue, key: Buffer): string {
  const iv = Buffer.from(encrypted.iv, 'base64');
  const authTag = Buffer.from(encrypted.authTag, 'base64');
  const ciphertext = Buffer.from(encrypted.ciphertext, 'base64');

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  try {
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString('utf-8');
  } catch {
    throw new VaultError('Decryption failed: invalid key or corrupted data');
  }
}

/**
 * Decrypt an EncryptedEnvFile object and return the plaintext EnvMap.
 */
export function decryptVault(vault: EncryptedEnvFile, passphrase: string): EnvMap {
  const salt = Buffer.from(vault.metadata.salt, 'base64');
  const key = deriveKey(passphrase, salt);

  const result: EnvMap = {};
  for (const [k, encrypted] of Object.entries(vault.entries)) {
    result[k] = decryptValue(encrypted, key);
  }
  return result;
}

/**
 * Read a vault file from disk and decrypt it.
 */
export function decryptEnvFile(vaultPath: string, passphrase: string): EnvMap {
  let vault: EncryptedEnvFile;
  try {
    const content = readFileSync(vaultPath, 'utf-8');
    vault = JSON.parse(content) as EncryptedEnvFile;
  } catch (err) {
    if (err instanceof VaultError) throw err;
    throw new VaultError(`Failed to read vault file: ${vaultPath} — ${(err as Error).message}`);
  }
  return decryptVault(vault, passphrase);
}
