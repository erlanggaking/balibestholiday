#!/bin/sh
# ------------------------------------------------------------
# Bali Best Holiday — container entrypoint
# Runs Prisma migrations against the live DB before starting Next.js.
# Set SKIP_MIGRATE=1 to bypass (e.g., in restart loops or read-only replicas).
# ------------------------------------------------------------
set -e

if [ "${SKIP_MIGRATE:-0}" != "1" ]; then
  # If a migrations folder exists, use migrate deploy (idempotent, history-tracked).
  # Otherwise fall back to db push — safe for additive changes only (new tables/indexes).
  if [ -d "/app/prisma/migrations" ] && [ "$(ls -A /app/prisma/migrations 2>/dev/null)" ]; then
    echo "[entrypoint] Running prisma migrate deploy..."
    npx --no-install prisma migrate deploy || {
      echo "[entrypoint] Migrate failed — continuing boot anyway. Check DB connectivity." >&2
    }
  else
    echo "[entrypoint] No migrations folder, running prisma db push (additive only)..."
    npx --no-install prisma db push --skip-generate --accept-data-loss=false || {
      echo "[entrypoint] db push failed — continuing boot anyway." >&2
    }
  fi
else
  echo "[entrypoint] SKIP_MIGRATE=1 set — skipping schema sync"
fi

echo "[entrypoint] Starting Next.js on :${PORT:-3000}"
exec "$@"
