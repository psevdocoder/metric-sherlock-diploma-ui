const requestCase: 'snake' | 'camel' =
  import.meta.env.VITE_API_REQUEST_CASE === 'camel' ? 'camel' : 'snake';

export const env = {
  api_base_url: import.meta.env.VITE_API_BASE_URL?.trim() ?? '',
  api_request_case: requestCase,
  keycloak_url: import.meta.env.VITE_KEYCLOAK_URL?.trim() || 'http://localhost:8080',
  keycloak_realm: import.meta.env.VITE_KEYCLOAK_REALM?.trim() || 'staging',
  keycloak_client_id: import.meta.env.VITE_KEYCLOAK_CLIENT_ID?.trim() || 'metric-sherlock-ui',
};
