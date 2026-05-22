#!/bin/sh
# ============================================================
# enable-https.sh — switch Nginx from HTTP-only to HTTPS+redirect
#
# Run from the project root AFTER Let's Encrypt cert is issued.
# Idempotent — safe to re-run.
# ============================================================
set -e

cd "$(dirname "$0")/../conf.d"

if [ ! -f "balibestholiday-https.conf.disabled" ] && [ -f "balibestholiday-https.conf" ]; then
  echo "[enable-https] Already enabled. Reloading Nginx..."
  cd / && docker compose -f /root/balibestholiday/docker-compose.yml exec nginx nginx -s reload 2>/dev/null \
    || (cd /root/balibestholiday && docker compose exec nginx nginx -s reload)
  exit 0
fi

echo "[enable-https] Activating HTTPS config..."

# Activate HTTPS config
mv balibestholiday-https.conf.disabled balibestholiday-https.conf

# Replace the full HTTP config with the redirect-only stub
mv balibestholiday.conf balibestholiday.conf.original.bak
mv balibestholiday-http-redirect.conf.disabled balibestholiday.conf

echo "[enable-https] Files:"
ls -la *.conf *.bak *.disabled 2>/dev/null || true

echo "[enable-https] Reloading Nginx..."
cd /root/balibestholiday
docker compose exec nginx nginx -t
docker compose exec nginx nginx -s reload

echo "[enable-https] ✅ HTTPS is now active. Test: curl -I https://balibestholiday.com"
