#!/usr/bin/env node
import { program } from 'commander';

import { registerRunCommand } from './commands/run.js';
import { registerWatchCommand } from './commands/watch.js';
import { registerValidateCommand } from './commands/validate.js';
import { registerImportCommand } from './commands/import.js';
import { registerExportCommand } from './commands/export.js';
import { registerBenchCommand } from './commands/bench.js';
import { registerMockCommand } from './commands/mock.js';
import { registerVaultCommand } from './commands/vault.js';
import { registerDocsCommand } from './commands/docs.js';
import { registerHookCommand } from './commands/hookInstall.js';

program
  .name('flint')
  .description('Flint — Open-source API client. Postman alternative.')
  .version('0.0.0');

registerRunCommand(program);
registerWatchCommand(program);
registerValidateCommand(program);
registerImportCommand(program);
registerExportCommand(program);
registerBenchCommand(program);
registerMockCommand(program);
registerVaultCommand(program);
registerDocsCommand(program);
registerHookCommand(program);

program.parseAsync(process.argv).catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
