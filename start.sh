#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")" && pwd)"
cd "${project_dir}"
env_file="${ENV_FILE:-.env}"
if [[ -f "${env_file}" ]]; then set -a; source "${env_file}"; set +a; fi

if [[ "${NODE_ENV:-production}" == "test" ]]; then
  CORS_ORIGINS="${CORS_ORIGINS:-http://127.0.0.1:${FRONTEND_PORT:-3000}}"
  export CORS_ORIGINS
fi

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${JWT_SECRET:?JWT_SECRET is required}"
: "${CORS_ORIGINS:?CORS_ORIGINS is required}"
if [[ ${#JWT_SECRET} -lt 32 ]]; then echo 'JWT_SECRET must contain at least 32 characters.' >&2; exit 2; fi
if [[ ! -d backend/node_modules || ! -f frontend/dist/index.html ]]; then echo 'Install dependencies and create the production frontend build before startup.' >&2; exit 2; fi

app_port="${BACKEND_PORT:-4003}"
if [[ ! "${app_port}" =~ ^[0-9]+$ ]] || (( app_port < 1024 || app_port > 65535 )); then
  echo 'BACKEND_PORT must be an unprivileged TCP port.' >&2
  exit 2
fi
if lsof -nP -iTCP:"${app_port}" -sTCP:LISTEN >/dev/null 2>&1; then echo "Port ${app_port} is occupied; refusing to stop another process." >&2; exit 2; fi

node backend/db/migrate.js --check
export FRONTEND_DIST="${FRONTEND_DIST:-${project_dir}/frontend/dist}"
exec node backend/server.js
