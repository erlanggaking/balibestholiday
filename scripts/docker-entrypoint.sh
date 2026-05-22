#!/bin/sh
# ------------------------------------------------------------
# Bali Best Holiday — container entrypoint
# Runs Prisma migrations against the live DB before starting Next.js.
# Set SKIP_MIGRATE=1 to bypass (e.g., in restart loops or read-only replicas).
# ------------------------------------------------------------
set -e

if [ "${SKIP_MIGRATE:-0}" != "1" ]; then
  echo "[entrypoint] Running prisma migrate deploy..."
  npx --no-install prisma migrate deploy || {
    echo "[entrypoint] Migrate failed — continuing boot anyway. Check DB connectivity." >&2
  }
else
  echo "[entrypoint] SKIP_MIGRATE=1 set — skipping prisma migrate deploy"
fi

echo "[entrypoint] Starting Next.js on :${PORT:-3000}"
exec "$@"
