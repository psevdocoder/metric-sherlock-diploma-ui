type RequestCase = 'snake' | 'camel';

const runtimeConfig = window.__APP_CONFIG__;

function readConfigValue(runtimeValue: string | undefined, buildValue: string | undefined) {
  return runtimeValue?.trim() ?? buildValue?.trim() ?? '';
}

const requestCase = (readConfigValue(runtimeConfig?.VITE_API_REQUEST_CASE, import.meta.env.VITE_API_REQUEST_CASE) === 'camel'
  ? 'camel'
  : 'snake') as RequestCase;

export const env = {
  api_base_url: readConfigValue(runtimeConfig?.VITE_API_BASE_URL, import.meta.env.VITE_API_BASE_URL),
  api_request_case: requestCase,
  keycloak_url: readConfigValue(runtimeConfig?.VITE_KEYCLOAK_URL, import.meta.env.VITE_KEYCLOAK_URL) || 'http://localhost:8080',
  keycloak_realm: readConfigValue(runtimeConfig?.VITE_KEYCLOAK_REALM, import.meta.env.VITE_KEYCLOAK_REALM) || 'staging',
  keycloak_client_id:
    readConfigValue(runtimeConfig?.VITE_KEYCLOAK_CLIENT_ID, import.meta.env.VITE_KEYCLOAK_CLIENT_ID) || 'metric-sherlock-ui',
};
