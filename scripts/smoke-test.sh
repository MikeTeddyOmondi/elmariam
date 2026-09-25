#!/usr/bin/env bash
# Post-deploy smoke test for the El'Mariam stack.
#
# Checks the surface that actually exists after the gateway was removed:
# the issuer, the three SvelteKit apps, mongo and rabbitmq.
#
# Usage: just up && sh scripts/smoke-test.sh

set -u

OPENAUTH_URL="${OPENAUTH_URL:-http://localhost:3100}"
ADMIN_URL="${ADMIN_URL:-http://localhost:3000}"
STAFF_URL="${STAFF_URL:-http://localhost:3001}"
WEBSITE_URL="${WEBSITE_URL:-http://localhost:3002}"
MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_PORT="${MONGO_PORT:-27017}"
RABBIT_HOST="${RABBIT_HOST:-localhost}"
RABBIT_PORT="${RABBIT_PORT:-5672}"

PASS=0
FAIL=0

ok()   { printf '  ok    %s\n' "$1"; PASS=$((PASS + 1)); }
bad()  { printf '  FAIL  %s (%s)\n' "$1" "$2"; FAIL=$((FAIL + 1)); }

# Expect a given HTTP status from a URL.
http_is() {
  label=$1; url=$2; want=$3
  got=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$url" 2>/dev/null)
  if [ "$got" = "$want" ]; then ok "$label"; else bad "$label" "want $want, got $got"; fi
}

# Expect a TCP port to accept a connection.
port_open() {
  label=$1; host=$2; port=$3
  if nc -z -w 5 "$host" "$port" 2>/dev/null; then ok "$label"; else bad "$label" "$host:$port closed"; fi
}

echo "Infrastructure"
port_open "mongo reachable"     "$MONGO_HOST"  "$MONGO_PORT"
port_open "rabbitmq reachable"  "$RABBIT_HOST" "$RABBIT_PORT"

echo "OpenAuth"
http_is "health endpoint"            "$OPENAUTH_URL/health" 200
http_is "oauth metadata published"   "$OPENAUTH_URL/.well-known/oauth-authorization-server" 200

echo "Apps"
# Unauthenticated roots redirect to /login. The website is public, so it is 200.
http_is "admin redirects to login"   "$ADMIN_URL/"   302
http_is "staff redirects to login"   "$STAFF_URL/"   302
http_is "website home"               "$WEBSITE_URL/" 200
http_is "website rooms"              "$WEBSITE_URL/rooms"      200
http_is "website restaurant"         "$WEBSITE_URL/restaurant" 200

echo "Guards"
# Remote functions are their own endpoints and must reject anonymous callers.
http_is "admin users page guarded"   "$ADMIN_URL/users"        302
http_is "staff barista guarded"      "$STAFF_URL/barista"      302
http_is "portal guarded"             "$WEBSITE_URL/portal"     302

echo
printf '%d passed, %d failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
