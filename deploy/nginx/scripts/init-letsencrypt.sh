#!/bin/sh
# ------------------------------------------------------------
# Initial Let's Encrypt certificate issuance.
# Run once per domain. Idempotent — safe to re-run.
#
# Usage (host):
#   DOMAIN=balibestholiday.com EMAIL=you@example.com \
#     docker compose run --rm certbot \
#       sh -c "certbot certonly --webroot -w /var/www/certbot \
#         -d $DOMAIN -d www.$DOMAIN \
#         --email $EMAIL --agree-tos --no-eff-email"
# ------------------------------------------------------------
set -e

DOMAIN="${DOMAIN:-balibestholiday.com}"
EMAIL="${EMAIL:?Set EMAIL=you@example.com}"
STAGING="${STAGING:-0}"

if [ "$STAGING" = "1" ]; then
  STAGING_FLAG="--staging"
else
  STAGING_FLAG=""
fi

echo "Requesting cert for: $DOMAIN, www.$DOMAIN  (email: $EMAIL)"

certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$DOMAIN" -d "www.$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos --no-eff-email \
  $STAGING_FLAG

echo "Done. Reload nginx:"
echo "  docker compose exec nginx nginx -s reload"
