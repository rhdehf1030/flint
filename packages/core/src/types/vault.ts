export interface VaultOptions {
  iterations?: number;
  algorithm?: string;
}

export interface VaultMetadata {
  version: number;
  algorithm: string;
  iterations: number;
  salt: string;
  createdAt: string;
}

export interface EncryptedEnvFile {
  metadata: VaultMetadata;
  entries: Record<string, EncryptedValue>;
}

export interface EncryptedValue {
  iv: string;
  authTag: string;
  ciphertext: string;
}
