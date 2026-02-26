import { resolve, dirname } from 'node:path';

import type { Command } from 'commander';
import {
  parseScenarioFile,
  buildCollectionIndex,
  resolveEnvChain,
  runScenario,
  runDiffScenario,
} from '@flint/core';

import { getReporter } from '../reporters/index.js';

export function registerRunCommand(program: Command): void {
  program
    .command('run <scenario>')
    .description('Run a scenario file')
    .option('-e, --env <name>', 'environment name', 'base')
    .option('-r, --reporter <format>', 'output format (pretty|json|junit|github-actions)', 'pretty')
    .option('-c, --collections <dir>', 'collections directory', './collections')
    .option('--compare <envA> <envB>', 'compare two environments')
    .action(async (scenarioPath: string, opts: {
      env: string;
      reporter: string;
      collections: string;
      compare?: string[];
    }) => {
      const absScenario = resolve(scenarioPath);
      const workspaceRoot = dirname(absScenario);
      const collectionsDir = resolve(opts.collections);
      const envDir = resolve(workspaceRoot, '..', 'environments');

      const scenario = parseScenarioFile(absScenario);
      const index = buildCollectionIndex(collectionsDir);
      const reporter = getReporter(opts.reporter);

      if (opts.compare && opts.compare.length >= 2) {
        const envA = resolveEnvChain(envDir, opts.compare[0]);
        const envB = resolveEnvChain(envDir, opts.compare[1]);
        const result = await runDiffScenario(scenario, index, envA, envB);
        reporter.report(result);
        process.exit(result.hasDiff ? 1 : 0);
      } else {
        const env = resolveEnvChain(envDir, opts.env);
        const result = await runScenario(scenario, index, env);
        result.scenarioPath = absScenario;
        result.env = opts.env;
        reporter.report(result);
        process.exit(result.passed ? 0 : 1);
      }
    });
}
