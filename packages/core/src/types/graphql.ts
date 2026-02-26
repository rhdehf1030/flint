export type GraphQLOperationType = 'query' | 'mutation' | 'subscription';

export interface GraphQLRequest {
  operationType: GraphQLOperationType;
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string;
}

export interface GraphQLResponse {
  data?: Record<string, unknown>;
  errors?: Array<{ message: string; locations?: unknown; path?: unknown }>;
}

export interface GraphQLField {
  name: string;
  type: string;
  nullable: boolean;
  args?: GraphQLField[];
}

export interface GraphQLSchema {
  types: Record<string, { fields: GraphQLField[] }>;
  queryType?: string;
  mutationType?: string;
  subscriptionType?: string;
}

export interface GraphQLVariable {
  name: string;
  value: unknown;
}
