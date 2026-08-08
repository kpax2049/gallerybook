#!/usr/bin/env bash
set -euo pipefail

HOST="${GALLERYBOOK_HOST:-${1:-}}"
APP_DIR="${GALLERYBOOK_APP_DIR:-/opt/gallerybook/source}"
ENV_FILE="${GALLERYBOOK_ENV_FILE:-/opt/gallerybook/env/production.env}"
COMPOSE_FILE="${GALLERYBOOK_COMPOSE_FILE:-deploy/docker-compose.prod.yml}"
DEPLOY_TIMEOUT_SECONDS="${GALLERYBOOK_DEPLOY_TIMEOUT_SECONDS:-180}"

if [[ -z "${HOST}" ]]; then
  echo "Usage: GALLERYBOOK_HOST=user@host $0"
  echo "   or: $0 user@host"
  exit 2
fi

echo "Updating Gallerybook on ${HOST}"

ssh "${HOST}" \
  APP_DIR="${APP_DIR}" \
  ENV_FILE="${ENV_FILE}" \
  COMPOSE_FILE="${COMPOSE_FILE}" \
  DEPLOY_TIMEOUT_SECONDS="${DEPLOY_TIMEOUT_SECONDS}" \
  'bash -seuo pipefail' <<'REMOTE'
cd "${APP_DIR}"

compose() {
  docker compose \
    -f "${COMPOSE_FILE}" \
    --env-file "${ENV_FILE}" \
    "$@"
}

echo "Pulling latest code..."
git pull --ff-only

echo "Building and restarting containers..."
if ! compose up -d --build --remove-orphans --wait \
  --wait-timeout "${DEPLOY_TIMEOUT_SECONDS}"; then
  echo "Deployment failed: services did not become healthy within ${DEPLOY_TIMEOUT_SECONDS}s." >&2
  compose ps --all || true
  compose logs --tail=200 \
    gallerybook-postgres gallerybook-backend gallerybook-frontend || true
  exit 1
fi

echo "Current service status:"
compose ps
REMOTE
