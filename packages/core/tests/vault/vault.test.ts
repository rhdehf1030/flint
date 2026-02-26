import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { encryptEnvFile, VaultError } from '../../src/vault/vaultEncryptor.js';
import { decryptVault, decryptEnvFile } from '../../src/vault/vaultDecryptor.js';

describe('vault round-trip', () => {
  let tmpDir: string;
  let envPath: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `flint-vault-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
    envPath = join(tmpDir, 'test.env');
    writeFileSync(envPath, 'SECRET_KEY=my-super-secret\nAPI_TOKEN=abc123\nPLAIN=value');
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('encrypts and decrypts successfully', () => {
    const vault = encryptEnvFile(envPath, 'my-passphrase');
    const decrypted = decryptVault(vault, 'my-passphrase');
    expect(decrypted).toEqual({
      SECRET_KEY: 'my-super-secret',
      API_TOKEN: 'abc123',
      PLAIN: 'value',
    });
  });

  it('keys remain as-is (plaintext)', () => {
    const vault = encryptEnvFile(envPath, 'passphrase');
    expect(Object.keys(vault.entries)).toContain('SECRET_KEY');
    expect(Object.keys(vault.entries)).toContain('API_TOKEN');
  });

  it('ciphertext differs from plaintext', () => {
    const vault = encryptEnvFile(envPath, 'passphrase');
    expect(vault.entries['SECRET_KEY'].ciphertext).not.toBe('my-super-secret');
  });

  it('throws VaultError with wrong passphrase', () => {
    const vault = encryptEnvFile(envPath, 'correct-passphrase');
    expect(() => decryptVault(vault, 'wrong-passphrase')).toThrow(VaultError);
  });

  it('throws VaultError with corrupted ciphertext', () => {
    const vault = encryptEnvFile(envPath, 'passphrase');
    vault.entries['SECRET_KEY'].ciphertext = 'corrupted!!';
    expect(() => decryptVault(vault, 'passphrase')).toThrow(VaultError);
  });

  it('throws VaultError when reading non-existent vault file', () => {
    expect(() => decryptEnvFile('/nonexistent/vault.json', 'pass')).toThrow(VaultError);
  });

  it('different passphrases produce different ciphertexts', () => {
    const vault1 = encryptEnvFile(envPath, 'pass1');
    const vault2 = encryptEnvFile(envPath, 'pass2');
    expect(vault1.entries['SECRET_KEY'].ciphertext).not.toBe(
      vault2.entries['SECRET_KEY'].ciphertext,
    );
  });
});
