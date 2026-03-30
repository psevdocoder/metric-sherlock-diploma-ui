#!/bin/sh
set -eu

escape_js() {
  printf '%s' "${1:-}" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

cat > /usr/share/nginx/html/runtime-config.js <<EOF
window.__APP_CONFIG__ = {
  VITE_API_BASE_URL: "$(escape_js "${VITE_API_BASE_URL:-}")",
  VITE_API_REQUEST_CASE: "$(escape_js "${VITE_API_REQUEST_CASE:-snake}")",
  VITE_KEYCLOAK_URL: "$(escape_js "${VITE_KEYCLOAK_URL:-http://localhost:8080}")",
  VITE_KEYCLOAK_REALM: "$(escape_js "${VITE_KEYCLOAK_REALM:-staging}")",
  VITE_KEYCLOAK_CLIENT_ID: "$(escape_js "${VITE_KEYCLOAK_CLIENT_ID:-metric-sherlock-ui}")"
};
EOF
