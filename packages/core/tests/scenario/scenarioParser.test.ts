import { describe, it, expect } from 'vitest';

import {
  parseScenarioContent,
  ScenarioParseError,
} from '../../src/scenario/scenarioParser.js';

const VALID_SCENARIO = `
x-flint-scenario:
  name: User Login Flow
  version: "1.0"
  steps:
    - operationId: authLogin
      body:
        username: test
        password: secret
      extract:
        TOKEN: body.token
    - operationId: getProfile
      headers:
        Authorization: "Bearer {{TOKEN}}"
      assertions:
        - status: 200
`;

describe('parseScenarioContent', () => {
  it('parses a valid scenario', () => {
    const result = parseScenarioContent(VALID_SCENARIO);
    expect(result['x-flint-scenario'].name).toBe('User Login Flow');
    expect(result['x-flint-scenario'].steps).toHaveLength(2);
  });

  it('parses step operationIds', () => {
    const result = parseScenarioContent(VALID_SCENARIO);
    expect(result['x-flint-scenario'].steps[0].operationId).toBe('authLogin');
    expect(result['x-flint-scenario'].steps[1].operationId).toBe('getProfile');
  });

  it('parses extract map', () => {
    const result = parseScenarioContent(VALID_SCENARIO);
    expect(result['x-flint-scenario'].steps[0].extract).toEqual({ TOKEN: 'body.token' });
  });

  it('throws ScenarioParseError for missing x-flint-scenario key', () => {
    expect(() => parseScenarioContent('name: test\nsteps: []')).toThrow(ScenarioParseError);
  });

  it('throws ScenarioParseError for step missing operationId', () => {
    const content = `
x-flint-scenario:
  name: Test
  version: "1.0"
  steps:
    - headers:
        X-Foo: bar
`;
    expect(() => parseScenarioContent(content)).toThrow(ScenarioParseError);
  });

  it('throws ScenarioParseError for empty steps array', () => {
    const content = `
x-flint-scenario:
  name: Test
  version: "1.0"
  steps: []
`;
    expect(() => parseScenarioContent(content)).toThrow(ScenarioParseError);
  });

  it('throws ScenarioParseError for invalid YAML', () => {
    expect(() => parseScenarioContent('{ invalid yaml ]')).toThrow(ScenarioParseError);
  });

  it('throws ScenarioParseError for missing name', () => {
    const content = `
x-flint-scenario:
  version: "1.0"
  steps:
    - operationId: test
`;
    expect(() => parseScenarioContent(content)).toThrow(ScenarioParseError);
  });
});
