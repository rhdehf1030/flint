import type { BenchmarkResult, DiffRunResult, ScenarioResult } from '@flint/core';

import type { Reporter } from './index.js';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isScenarioResult(r: ScenarioResult | BenchmarkResult | DiffRunResult): r is ScenarioResult {
  return 'steps' in r && 'scenarioName' in r;
}

export class JUnitReporter implements Reporter {
  report(result: ScenarioResult | BenchmarkResult | DiffRunResult): void {
    if (!isScenarioResult(result)) {
      console.log('<!-- JUnit reporter only supports ScenarioResult -->');
      return;
    }

    const failures = result.steps.filter((s) => !s.passed).length;
    const lines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<testsuite name="${escapeXml(result.scenarioName)}" tests="${result.steps.length}" failures="${failures}" time="${result.totalDurationMs / 1000}">`,
    ];

    for (const step of result.steps) {
      const time = step.durationMs / 1000;
      lines.push(`  <testcase name="${escapeXml(step.operationId)}" time="${time}">`);

      if (!step.passed) {
        const failedAssertions = step.assertions.filter((a) => !a.passed);
        const message = failedAssertions.map((a) => a.message).join('; ');
        lines.push(`    <failure message="${escapeXml(message)}">${escapeXml(failedAssertions.map((a) => a.diff?.formattedDiff ?? a.message).join('\n'))}</failure>`);
      }

      lines.push('  </testcase>');
    }

    lines.push('</testsuite>');
    console.log(lines.join('\n'));
  }
}
