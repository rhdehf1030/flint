import type { GraphQLField, GraphQLSchema, RequestHeaders } from '../types/index.js';

import { executeGraphQL } from './graphqlClient.js';

const INTROSPECTION_QUERY = `
  query IntrospectionQuery {
    __schema {
      queryType { name }
      mutationType { name }
      subscriptionType { name }
      types {
        name
        kind
        fields {
          name
          type { name kind ofType { name kind } }
          args { name type { name kind ofType { name kind } } }
        }
      }
    }
  }
`;

export async function fetchSchema(
  endpoint: string,
  headers: RequestHeaders,
): Promise<GraphQLSchema> {
  const response = await executeGraphQL(
    endpoint,
    { operationType: 'query', query: INTROSPECTION_QUERY },
    headers,
  );

  if (response.errors?.length) {
    throw new Error(`Introspection failed: ${response.errors[0].message}`);
  }

  const schema = response.data?.['__schema'] as Record<string, unknown> | undefined;
  if (!schema) {
    throw new Error('Introspection response missing __schema');
  }

  const types: GraphQLSchema['types'] = {};
  const rawTypes = (schema['types'] as Array<Record<string, unknown>>) ?? [];

  for (const type of rawTypes) {
    if (
      typeof type['name'] !== 'string' ||
      type['name'].startsWith('__') ||
      type['kind'] !== 'OBJECT'
    ) {
      continue;
    }

    const fields: GraphQLField[] = [];
    for (const field of (type['fields'] as Array<Record<string, unknown>>) ?? []) {
      const typeObj = field['type'] as Record<string, unknown>;
      const ofType = typeObj['ofType'] as Record<string, unknown> | null | undefined;
      const typeName = (typeObj['name'] as string | null) ?? (ofType?.['name'] as string | undefined) ?? 'Unknown';
      fields.push({
        name: field['name'] as string,
        type: typeName,
        nullable: typeObj['kind'] !== 'NON_NULL',
      });
    }

    types[type['name']] = { fields };
  }

  return {
    types,
    queryType: (schema['queryType'] as Record<string, unknown> | undefined)?.['name'] as string,
    mutationType: (schema['mutationType'] as Record<string, unknown> | undefined)?.['name'] as string,
    subscriptionType: (schema['subscriptionType'] as Record<string, unknown> | undefined)?.['name'] as string,
  };
}
