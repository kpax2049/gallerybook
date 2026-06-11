#!/usr/bin/env bash
set -euo pipefail

HOST="${GALLERYBOOK_HOST:-${1:-}}"
APP_DIR="${GALLERYBOOK_APP_DIR:-/opt/gallerybook/source}"
ENV_FILE="${GALLERYBOOK_ENV_FILE:-/opt/gallerybook/env/production.env}"
COMPOSE_FILE="${GALLERYBOOK_COMPOSE_FILE:-deploy/docker-compose.prod.yml}"

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
  'bash -seuo pipefail' <<'REMOTE'
cd "${APP_DIR}"

echo "Pulling latest code..."
git pull --ff-only

echo "Building and restarting containers..."
docker compose \
  -f "${COMPOSE_FILE}" \
  --env-file "${ENV_FILE}" \
  up -d --build --remove-orphans

echo "Current service status:"
docker compose \
  -f "${COMPOSE_FILE}" \
  --env-file "${ENV_FILE}" \
  ps
REMOTE
