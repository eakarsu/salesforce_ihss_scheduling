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
ui_port="${FRONTEND_PORT:-3000}"
for port in "${app_port}" "${ui_port}"; do
  if [[ ! "${port}" =~ ^[0-9]+$ ]] || (( port < 1024 || port > 65535 )); then echo 'Runtime ports must be unprivileged TCP ports.' >&2; exit 2; fi
  if lsof -nP -iTCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1; then echo "Port ${port} is occupied; refusing to stop another process." >&2; exit 2; fi
done

node backend/db/migrate.js --check
export FRONTEND_DIST="${FRONTEND_DIST:-${project_dir}/frontend/dist}"

cleanup() {
  kill -TERM "${api_pid:-}" "${ui_pid:-}" 2>/dev/null || true
  wait "${api_pid:-}" "${ui_pid:-}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

node backend/server.js & api_pid=$!
npm --prefix frontend run preview -- --host "${FRONTEND_HOST:-127.0.0.1}" --port "${ui_port}" --strictPort & ui_pid=$!
while kill -0 "${api_pid}" 2>/dev/null && kill -0 "${ui_pid}" 2>/dev/null; do sleep 1; done
exit 1
