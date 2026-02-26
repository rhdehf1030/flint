export interface ExtractMap {
  [variableName: string]: string;
}

export interface StepAssertion {
  [key: string]: unknown;
}

export interface ScenarioStep {
  operationId: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: unknown;
  extract?: ExtractMap;
  assertions?: StepAssertion[];
  auth?: string;
}

export interface ScenarioFile {
  'x-flint-scenario': {
    name: string;
    version: string;
    environments?: string[];
    steps: ScenarioStep[];
  };
}
