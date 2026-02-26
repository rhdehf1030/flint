import type { EnvMap } from '../types/index.js';

export class InterpolationError extends Error {
  constructor(public readonly varName: string) {
    super(`Undefined variable: {{${varName}}}`);
    this.name = 'InterpolationError';
  }
}

/**
 * Replace {{VAR_NAME}} tokens in a template string with values from vars.
 * In strict mode, throws InterpolationError for undefined variables.
 * In lenient mode, leaves the token as-is.
 */
export function interpolate(template: string, vars: EnvMap, strict = false): string {
  return template.replace(/\{\{([^{}]+)\}\}/g, (match, varName: string) => {
    const key = varName.trim();
    if (Object.prototype.hasOwnProperty.call(vars, key)) {
      return vars[key];
    }
    if (strict) {
      throw new InterpolationError(key);
    }
    return match;
  });
}
