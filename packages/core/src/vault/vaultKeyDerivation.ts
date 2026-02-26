import { pbkdf2Sync, randomBytes } from 'node:crypto';

const ITERATIONS = 100_000;
const KEY_LENGTH = 32; // 256 bits for AES-256
const DIGEST = 'sha256';

export function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return pbkdf2Sync(passphrase, salt, ITERATIONS, KEY_LENGTH, DIGEST);
}

export function generateSalt(): Buffer {
  return randomBytes(16);
}
