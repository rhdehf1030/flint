import { resolve } from 'node:path';

import type { Command } from 'commander';
import { encryptEnvFile, decryptEnvFile } from '@flint/core';

export function registerVaultCommand(program: Command): void {
  const vault = program
    .command('vault')
    .description('Encrypt or decrypt environment vault files');

  vault
    .command('encrypt <env-file>')
    .description('Encrypt an .env file into a vault file')
    .option('-k, --vault-key <key>', 'vault passphrase (or set FLINT_VAULT_KEY env var)')
    .option('-o, --output <file>', 'output vault file path')
    .action(async (envFile: string, opts: { vaultKey?: string; output?: string }) => {
      const passphrase = opts.vaultKey ?? process.env['FLINT_VAULT_KEY'];
      if (!passphrase) {
        console.error('Vault passphrase required. Use --vault-key or set FLINT_VAULT_KEY environment variable.');
        process.exit(1);
      }

      const absPath = resolve(envFile);
      const outputPath = opts.output ? resolve(opts.output) : absPath.replace(/\.env$/, '.vault.json');

      const encrypted = await encryptEnvFile(absPath, passphrase);

      const { writeFileSync } = await import('node:fs');
      writeFileSync(outputPath, JSON.stringify(encrypted, null, 2), 'utf8');
      console.log(`\x1b[32m✓\x1b[0m Encrypted: ${outputPath}`);
    });

  vault
    .command('decrypt <vault-file>')
    .description('Decrypt a vault file and print env variables')
    .option('-k, --vault-key <key>', 'vault passphrase (or set FLINT_VAULT_KEY env var)')
    .option('-o, --output <file>', 'output .env file path (prints to stdout if omitted)')
    .action(async (vaultFile: string, opts: { vaultKey?: string; output?: string }) => {
      const passphrase = opts.vaultKey ?? process.env['FLINT_VAULT_KEY'];
      if (!passphrase) {
        console.error('Vault passphrase required. Use --vault-key or set FLINT_VAULT_KEY environment variable.');
        process.exit(1);
      }

      const absPath = resolve(vaultFile);
      const envMap = await decryptEnvFile(absPath, passphrase);

      const lines = Object.entries(envMap).map(([k, v]) => `${k}=${v}`).join('\n');

      if (opts.output) {
        const { writeFileSync } = await import('node:fs');
        writeFileSync(resolve(opts.output), lines, 'utf8');
        console.log(`\x1b[32m✓\x1b[0m Decrypted: ${opts.output}`);
      } else {
        console.log(lines);
      }
    });
}
