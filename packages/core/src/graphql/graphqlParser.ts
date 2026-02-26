import yaml from 'js-yaml';

import type { GraphQLRequest } from '../types/index.js';

export class GraphQLParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GraphQLParseError';
  }
}

export function parseGraphQLCollection(content: string): GraphQLRequest {
  let doc: unknown;
  try {
    doc = yaml.load(content);
  } catch (err) {
    throw new GraphQLParseError(`Invalid YAML: ${(err as Error).message}`);
  }

  if (typeof doc !== 'object' || doc === null) {
    throw new GraphQLParseError('Not a valid YAML object');
  }

  const obj = doc as Record<string, unknown>;

  // Navigate to x-flint.protocol = graphql operation
  const paths = obj['paths'] as Record<string, Record<string, unknown>> | undefined;
  if (!paths) {
    throw new GraphQLParseError('Missing paths field');
  }

  for (const methods of Object.values(paths)) {
    for (const operation of Object.values(methods)) {
      const op = operation as Record<string, unknown>;
      const xFlint = op['x-flint'] as Record<string, unknown> | undefined;
      if (xFlint?.['protocol'] === 'graphql') {
        const gql = xFlint['graphql'] as Record<string, unknown> | undefined;
        if (!gql?.['query']) {
          throw new GraphQLParseError('Missing x-flint.graphql.query field');
        }
        const result: import('../types/index.js').GraphQLRequest = {
          operationType: (gql['operationType'] as 'query' | 'mutation' | 'subscription') ?? 'query',
          query: gql['query'] as string,
        };
        const vars = gql['variables'] as Record<string, unknown> | undefined;
        if (vars !== undefined) result.variables = vars;
        const opName = gql['operationName'] as string | undefined;
        if (opName !== undefined) result.operationName = opName;
        return result;
      }
    }
  }

  throw new GraphQLParseError('No GraphQL operation found in collection (missing x-flint.protocol: graphql)');
}
