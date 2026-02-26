import { readFileSync } from 'node:fs';

import yaml from 'js-yaml';

import type { ScenarioFile } from '../types/index.js';

export class ScenarioParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScenarioParseError';
  }
}

function validateScenario(doc: unknown, source: string): ScenarioFile {
  if (typeof doc !== 'object' || doc === null) {
    throw new ScenarioParseError(`${source}: not a valid YAML object`);
  }

  const obj = doc as Record<string, unknown>;
  const scenario = obj['x-flint-scenario'];

  if (!scenario || typeof scenario !== 'object') {
    throw new ScenarioParseError(`${source}: missing "x-flint-scenario" root key`);
  }

  const s = scenario as Record<string, unknown>;

  if (!s['name'] || typeof s['name'] !== 'string') {
    throw new ScenarioParseError(`${source}: x-flint-scenario.name is required`);
  }

  if (!s['version'] || typeof s['version'] !== 'string') {
    throw new ScenarioParseError(`${source}: x-flint-scenario.version is required`);
  }

  if (!Array.isArray(s['steps'])) {
    throw new ScenarioParseError(`${source}: x-flint-scenario.steps must be an array`);
  }

  const steps = s['steps'] as unknown[];
  if (steps.length === 0) {
    throw new ScenarioParseError(`${source}: x-flint-scenario.steps cannot be empty`);
  }

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (typeof step !== 'object' || step === null) {
      throw new ScenarioParseError(`${source}: step[${i}] is not an object`);
    }
    const stepObj = step as Record<string, unknown>;
    if (!stepObj['operationId'] || typeof stepObj['operationId'] !== 'string') {
      throw new ScenarioParseError(`${source}: step[${i}] is missing operationId`);
    }
  }

  return doc as ScenarioFile;
}

export function parseScenarioContent(content: string): ScenarioFile {
  let doc: unknown;
  try {
    doc = yaml.load(content);
  } catch (err) {
    throw new ScenarioParseError(`Invalid YAML: ${(err as Error).message}`);
  }
  return validateScenario(doc, '<content>');
}

export function parseScenarioFile(filePath: string): ScenarioFile {
  let content: string;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch (err) {
    throw new ScenarioParseError(
      `Failed to read scenario file: ${filePath} — ${(err as Error).message}`,
    );
  }

  let doc: unknown;
  try {
    doc = yaml.load(content);
  } catch (err) {
    throw new ScenarioParseError(`Invalid YAML in ${filePath}: ${(err as Error).message}`);
  }

  return validateScenario(doc, filePath);
}
