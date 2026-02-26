import { resolve, dirname } from 'node:path';

import type { Command } from 'commander';
import chokidar from 'chokidar';
import {
  parseScenarioFile,
  buildCollectionIndex,
  resolveEnvChain,
  runScenario,
} from '@flint/core';

import { getReporter } from '../reporters/index.js';

export function registerWatchCommand(program: Command): void {
  program
    .command('watch')
    .description('Watch scenarios and collections for changes, re-run on change')
    .option('-e, --env <name>', 'environment name', 'base')
    .option('-r, --reporter <format>', 'output format (pretty|json)', 'pretty')
    .option('-c, --collections <dir>', 'collections directory', './collections')
    .option('-s, --scenarios <dir>', 'scenarios directory', './scenarios')
    .action(async (opts: { env: string; reporter: string; collections: string; scenarios: string }) => {
      const collectionsDir = resolve(opts.collections);
      const scenariosDir = resolve(opts.scenarios);
      const envDir = resolve('./environments');
      const reporter = getReporter(opts.reporter);

      let debounceTimer: ReturnType<typeof setTimeout> | null = null;
      const pendingScenarios = new Set<string>();
      // Track all known scenario paths
      const knownScenarios = new Set<string>();

      const runPending = async (): Promise<void> => {
        const toRun = [...pendingScenarios];
        pendingScenarios.clear();

        const index = buildCollectionIndex(collectionsDir);
        const env = resolveEnvChain(envDir, opts.env);

        for (const scenarioPath of toRun) {
          try {
            console.log(`\n[watch] Running: ${scenarioPath}`);
            const scenario = parseScenarioFile(scenarioPath);
            const result = await runScenario(scenario, index, env);
            result.scenarioPath = scenarioPath;
            result.env = opts.env;
            reporter.report(result);
          } catch (err) {
            console.error(`[watch] Error running ${scenarioPath}: ${(err as Error).message}`);
          }
        }
      };

      const scheduleRun = (changedPath?: string): void => {
        if (changedPath) {
          // If a scenario file changed, re-run just that one
          pendingScenarios.add(changedPath);
        } else {
          // Collection changed — re-run all known scenarios
          for (const s of knownScenarios) pendingScenarios.add(s);
        }
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => { void runPending(); }, 300);
      };

      const watcher = chokidar.watch(
        [
          `${scenariosDir}/**/*.yaml`,
          `${collectionsDir}/**/*.yaml`,
        ],
        { ignoreInitial: false, persistent: true },
      );

      watcher
        .on('add', (filePath: string) => {
          const normalized = filePath.replace(/\\/g, '/');
          const isScenario = normalized.includes(scenariosDir.replace(/\\/g, '/'));
          if (isScenario) {
            knownScenarios.add(filePath);
            scheduleRun(filePath);
          }
        })
        .on('change', (filePath: string) => {
          const normalized = filePath.replace(/\\/g, '/');
          const isScenario = normalized.includes(scenariosDir.replace(/\\/g, '/'));
          if (isScenario) {
            scheduleRun(filePath);
          } else {
            // collection changed
            scheduleRun();
          }
        });

      console.log(`[watch] Watching ${scenariosDir} and ${collectionsDir} ...`);
      console.log('[watch] Press Ctrl+C to stop.');

      process.on('SIGINT', async () => {
        await watcher.close();
        process.exit(0);
      });
    });
}
