import { request as undiciRequest } from 'undici';

import type { GraphQLRequest, GraphQLResponse, RequestHeaders } from '../types/index.js';

export async function executeGraphQL(
  endpoint: string,
  graphqlRequest: GraphQLRequest,
  headers: RequestHeaders,
): Promise<GraphQLResponse> {
  const body = JSON.stringify({
    query: graphqlRequest.query,
    variables: graphqlRequest.variables,
    operationName: graphqlRequest.operationName,
  });

  const response = await undiciRequest(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      ...headers,
    },
    body,
  });

  const json = await response.body.json() as GraphQLResponse;
  return json;
}
