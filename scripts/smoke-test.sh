#!/usr/bin/env bash
# Smoke test for the El'Mariam stack
# Run after: docker compose up -d
# Usage: ./scripts/smoke-test.sh

set -euo pipefail

GATEWAY_URL="${GATEWAY_URL:-http://localhost:8009}"
OPENAUTH_URL="${OPENAUTH_URL:-http://localhost:3100}"
ADMIN_URL="${ADMIN_URL:-http://localhost:3000}"
STAFF_URL="${STAFF_URL:-http://localhost:3001}"
WEBSITE_URL="${WEBSITE_URL:-http://localhost:3002}"

PASS=0
FAIL=0

green()  { echo -e "\033[32m✓ $*\033[0m"; }
red()    { echo -e "\033[31m✗ $*\033[0m"; }
header() { echo -e "\n\033[1m=== $* ===\033[0m"; }

check() {
  local label="$1"
  local cmd="$2"
  if eval "$cmd" &>/dev/null; then
    green "$label"
    PASS=$((PASS + 1))
  else
    red "$label"
    FAIL=$((FAIL + 1))
  fi
}

check_status() {
  local label="$1"
  local url="$2"
  local expected="${3:-200}"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  if [ "$status" = "$expected" ]; then
    green "$label (HTTP $status)"
    PASS=$((PASS + 1))
  else
    red "$label (expected HTTP $expected, got $status)"
    FAIL=$((FAIL + 1))
  fi
}

check_json_field() {
  local label="$1"
  local url="$2"
  local field="$3"
  local body
  body=$(curl -s "$url" 2>/dev/null || echo "{}")
  if echo "$body" | grep -q "\"$field\""; then
    green "$label"
    PASS=$((PASS + 1))
  else
    red "$label (field '$field' not found in response)"
    FAIL=$((FAIL + 1))
  fi
}

# ── 1. Service health ──────────────────────────────────────────────────────────
header "Service Reachability"

check_status "Gateway (KrakenD) reachable"      "$GATEWAY_URL/__health"
check_status "OpenAuth reachable"               "$OPENAUTH_URL/.well-known/openid-configuration"
check_status "Admin app reachable"              "$ADMIN_URL"
check_status "Staff app reachable"              "$STAFF_URL"
check_status "Website app reachable"            "$WEBSITE_URL"

# ── 2. Public endpoints (no auth) ─────────────────────────────────────────────
header "Public Endpoints (no auth required)"

check_json_field "GET /api/public/roomtypes → success field" \
  "$GATEWAY_URL/api/public/roomtypes" "success"

check_json_field "GET /api/public/menu → success field" \
  "$GATEWAY_URL/api/public/menu" "success"

# ── 3. Protected endpoints reject unauthenticated requests ────────────────────
header "Auth Guard (should return 401 without token)"

check_status "GET /api/hotel/customers without token → 401" \
  "$GATEWAY_URL/api/hotel/customers" "401"

check_status "GET /api/bar/drinks without token → 401" \
  "$GATEWAY_URL/api/bar/drinks" "401"

check_status "GET /api/restaurant/orders without token → 401" \
  "$GATEWAY_URL/api/restaurant/orders" "401"

# ── 4. OpenAuth token issuance ────────────────────────────────────────────────
header "OpenAuth Token Issuance"

TEST_EMAIL="${SMOKE_TEST_EMAIL:-smoketest@elmariam.local}"
TEST_PASSWORD="${SMOKE_TEST_PASSWORD:-SmokeTest1234!}"

echo "  Using test credentials: $TEST_EMAIL"

# Register test user (may fail if already exists — that's fine)
curl -s -X POST "$OPENAUTH_URL/password/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"client_id\":\"smoke\"}" \
  &>/dev/null || true

# Attempt token exchange via authorization_code is complex in a script,
# so we test the PKCE discovery endpoint instead
check_json_field "OpenAuth JWKS endpoint has keys" \
  "$OPENAUTH_URL/.well-known/jwks.json" "keys"

check_json_field "OpenAuth OIDC config has token_endpoint" \
  "$OPENAUTH_URL/.well-known/openid-configuration" "token_endpoint"

# ── 5. End-to-end flow (requires management token) ───────────────────────────
header "End-to-End Flow (skipped — requires manual login token)"
echo "  To run a full e2e flow:"
echo "  1. Log in at $ADMIN_URL as a management user"
echo "  2. Extract the auth_token cookie"
echo "  3. Run:"
echo "     TOKEN=<auth_token>"
echo "     curl -H \"Authorization: Bearer \$TOKEN\" $GATEWAY_URL/api/hotel/customers"
echo "     curl -X POST -H \"Authorization: Bearer \$TOKEN\" \\"
echo "       -H \"Content-Type: application/json\" \\"
echo "       -d '{\"firstname\":\"Test\",\"lastname\":\"User\",\"id_number\":\"ID123\",\"email\":\"t@t.com\"}' \\"
echo "       $GATEWAY_URL/api/hotel/customers"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Results: $PASS passed, $FAIL failed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
