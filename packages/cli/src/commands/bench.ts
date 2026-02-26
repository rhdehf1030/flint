import { resolve, dirname } from 'node:path';

import type { Command } from 'commander';
import {
  parseScenarioFile,
  buildCollectionIndex,
  resolveEnvChain,
  runBenchmark,
} from '@flint/core';

import { getReporter } from '../reporters/index.js';

export function registerBenchCommand(program: Command): void {
  program
    .command('bench <scenario>')
    .description('Run benchmark against a scenario')
    .option('-e, --env <name>', 'environment name', 'base')
    .option('-c, --collections <dir>', 'collections directory', './collections')
    .option('--concurrent <n>', 'number of concurrent requests', '10')
    .option('--duration <s>', 'benchmark duration in seconds')
    .option('--max-requests <n>', 'maximum number of requests')
    .option('--ramp-up <s>', 'ramp-up time in seconds', '0')
    .option('-r, --reporter <format>', 'output format (pretty|json)', 'pretty')
    .action(async (scenarioPath: string, opts: {
      env: string;
      collections: string;
      concurrent: string;
      duration?: string;
      maxRequests?: string;
      rampUp: string;
      reporter: string;
    }) => {
      const absScenario = resolve(scenarioPath);
      const workspaceRoot = dirname(absScenario);
      const collectionsDir = resolve(opts.collections);
      const envDir = resolve(workspaceRoot, '..', 'environments');

      const scenario = parseScenarioFile(absScenario);
      const index = buildCollectionIndex(collectionsDir);
      const env = resolveEnvChain(envDir, opts.env);

      const concurrent = parseInt(opts.concurrent, 10);
      const rampUpSeconds = parseFloat(opts.rampUp);
      const hasDuration = opts.duration !== undefined;
      const hasMaxRequests = opts.maxRequests !== undefined;

      const benchOpts = {
        concurrent,
        ...(hasDuration ? { duration: parseFloat(opts.duration as string) } : {}),
        ...(hasMaxRequests ? { maxRequests: parseInt(opts.maxRequests as string, 10) } : {}),
        ...(rampUpSeconds > 0 ? { rampUpSeconds } : {}),
        // Default to 10s if neither duration nor maxRequests specified
        ...(!hasDuration && !hasMaxRequests ? { duration: 10 } : {}),
      };

      const reporter = getReporter(opts.reporter);
      console.log(`Running benchmark (concurrent=${benchOpts.concurrent})...`);

      const result = await runBenchmark(scenario, index, env, benchOpts);
      reporter.report(result);
    });
}
