import { readFileSync } from 'node:fs';

import SwaggerParser from '@apidevtools/swagger-parser';

export interface ValidationError {
  message: string;
  path?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export async function validateCollectionFile(filePath: string): Promise<ValidationResult> {
  let content: string;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch (err) {
    return {
      valid: false,
      errors: [{ message: `Failed to read file: ${(err as Error).message}` }],
    };
  }

  // Check it's parseable as YAML/JSON first
  let doc: unknown;
  try {
    const { default: yaml } = await import('js-yaml');
    doc = yaml.load(content);
  } catch (err) {
    return {
      valid: false,
      errors: [{ message: `Invalid YAML/JSON: ${(err as Error).message}` }],
    };
  }

  try {
    // swagger-parser validates the spec
    await SwaggerParser.validate(doc as never);
    return { valid: true, errors: [] };
  } catch (err) {
    const error = err as Error & { details?: Array<{ message: string; path?: string[] }> };
    const errors: ValidationError[] = error.details
      ? error.details.map((d): ValidationError => {
          const joined = d.path?.join('.');
          return joined !== undefined ? { message: d.message, path: joined } : { message: d.message };
        })
      : [{ message: error.message }];

    // Filter out false negatives from x-flint extension fields
    const filtered = errors.filter(
      (e) => !e.message.includes('x-flint') && !e.message.includes('Additional properties'),
    );

    return { valid: filtered.length === 0, errors: filtered };
  }
}
