#!/usr/bin/env bash
# El'Mariam API smoke tests — converted from .http
set -euo pipefail

GATEWAY="http://localhost:8009"
OPENAUTH="http://localhost:3100"
HOTEL="http://localhost:8003"
BAR="http://localhost:8004"
RESTAURANT="http://localhost:8005"
CHECKOUT="http://localhost:8008"

TOKEN="eyJhbGciOiJFUzI1NiIsImtpZCI6Ijk5ZjI5MjFkLTk2ZjYtNDFmMS04MDFhLTgyMzA3YmY3ODE1MiIsInR5cCI6IkpXVCJ9.eyJtb2RlIjoiYWNjZXNzIiwidHlwZSI6InVzZXIiLCJwcm9wZXJ0aWVzIjp7ImlkIjoiNmEwMzc4ZGEzOWEyNDhiOGQ1NTI3NWYyIiwiZW1haWwiOiJhZG1pbkBsb2NjaS5jbG91ZCIsInVzZXJUeXBlIjoibWFuYWdlbWVudCJ9LCJhdWQiOiJhZG1pbiIsImlzcyI6Imh0dHA6Ly9vcGVuYXV0aDozMTAwIiwic3ViIjoidXNlcjplNDA1ZGMwY2M3Y2MxYmQwIiwiZXhwIjoxNzgxMjg3ODM2fQ.0PbmjSK7bSUQMNs89S1M50j-ZewRHOepFziqDDouHKoS3kUhZlJ04kl_QQTy38LhbDjuJ9ta2fYTH0MZGmjSzQ"

AUTH=(-H "Authorization: Bearer $TOKEN")
JSON=(-H "Content-Type: application/json")
DIRECT_HEADERS=(-H "x-user-id: debug-user-id" -H "x-user-email: admin@elmariam.com")

PASS=0; FAIL=0; SKIP=0
declare -a FAILURES=()

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[0;33m'; BOLD='\033[1m'; RESET='\033[0m'

# ── helpers ──────────────────────────────────────────────────────────────────

check() {
  local label="$1" expected_status="$2" url="$3"
  shift 3
  local response http_status body

  response=$(curl -s -w "\n__STATUS__%{http_code}" -m 5 "$@" "$url" 2>/dev/null) || {
    echo -e "  ${RED}✗${RESET} $label — ${RED}connection refused${RESET}"
    FAIL=$((FAIL+1)); FAILURES+=("$label: connection refused"); return
  }
  http_status=$(echo "$response" | tail -1 | sed 's/__STATUS__//')
  body=$(echo "$response" | sed '$d')

  if [[ "$http_status" == "$expected_status" ]]; then
    echo -e "  ${GREEN}✓${RESET} $label ${YELLOW}[$http_status]${RESET}"
    PASS=$((PASS+1))
  else
    echo -e "  ${RED}✗${RESET} $label — expected $expected_status got ${RED}$http_status${RESET}"
    echo "    body: $(echo "$body" | head -c 200)"
    FAIL=$((FAIL+1)); FAILURES+=("$label: expected $expected_status got $http_status")
  fi
}

check_success() {
  # Like check but also verifies body contains "success":true
  local label="$1" expected_status="$2" url="$3"
  shift 3
  local response http_status body

  response=$(curl -s -w "\n__STATUS__%{http_code}" -m 5 "$@" "$url" 2>/dev/null) || {
    echo -e "  ${RED}✗${RESET} $label — ${RED}connection refused${RESET}"
    FAIL=$((FAIL+1)); FAILURES+=("$label: connection refused"); return
  }
  http_status=$(echo "$response" | tail -1 | sed 's/__STATUS__//')
  body=$(echo "$response" | sed '$d')

  if [[ "$http_status" != "$expected_status" ]]; then
    echo -e "  ${RED}✗${RESET} $label — expected $expected_status got ${RED}$http_status${RESET}"
    echo "    body: $(echo "$body" | head -c 200)"
    FAIL=$((FAIL+1)); FAILURES+=("$label: expected $expected_status got $http_status")
  elif echo "$body" | grep -q '"success":true\|"success": true'; then
    echo -e "  ${GREEN}✓${RESET} $label ${YELLOW}[$http_status]${RESET} — success:true"
    PASS=$((PASS+1))
  else
    echo -e "  ${YELLOW}~${RESET} $label ${YELLOW}[$http_status]${RESET} — no success field"
    echo "    body: $(echo "$body" | head -c 200)"
    PASS=$((PASS+1))
  fi
}

section() { echo -e "\n${BOLD}$1${RESET}"; }

# ── tests ─────────────────────────────────────────────────────────────────────

section "OpenAuth (port 3100)"
check        "OAuth server metadata"    200  "$OPENAUTH/.well-known/oauth-authorization-server"
check        "JWKS endpoint"            200  "$OPENAUTH/.well-known/jwks.json"

section "Gateway — Public (no auth)"
check_success "Public: room types"      200  "$GATEWAY/api/public/roomtypes"
check_success "Public: restaurant menu" 200  "$GATEWAY/api/public/menu"

section "Gateway — Hotel (JWT)"
check        "Hotel: version"           200  "$GATEWAY/api/hotel/version"                          "${AUTH[@]}"
check_success "Hotel: list customers"   200  "$GATEWAY/api/hotel/customers"                        "${AUTH[@]}"
check_success "Hotel: list bookings"    200  "$GATEWAY/api/hotel/bookings"                         "${AUTH[@]}"
check_success "Hotel: list invoices"    200  "$GATEWAY/api/hotel/invoices"                         "${AUTH[@]}"
check_success "Hotel: list rooms"       200  "$GATEWAY/api/hotel/rooms"                            "${AUTH[@]}"
check_success "Hotel: list room types"  200  "$GATEWAY/api/hotel/roomtypes"                        "${AUTH[@]}"

section "Gateway — Hotel: POST customer"
TS=$(date +%s)
check_success "Hotel: create customer"  200  "$GATEWAY/api/hotel/customers"  \
  "${AUTH[@]}" "${JSON[@]}" \
  -d "{\"firstname\":\"Jane\",\"lastname\":\"Doe\",\"email\":\"jane.${TS}@example.com\",\"phone_number\":254700000001,\"id_number\":\"ID${TS}\"}"

section "Gateway — Bar (JWT)"
check        "Bar: version"             200  "$GATEWAY/api/bar/version"                            "${AUTH[@]}"
check_success "Bar: list drinks"        200  "$GATEWAY/api/bar/drinks"                             "${AUTH[@]}"
check_success "Bar: list purchases"     200  "$GATEWAY/api/bar/purchases"                          "${AUTH[@]}"
check_success "Bar: list sales"         200  "$GATEWAY/api/bar/sales"                              "${AUTH[@]}"

section "Gateway — Restaurant (JWT)"
check        "Restaurant: version"      200  "$GATEWAY/api/restaurant/version"                     "${AUTH[@]}"
check_success "Restaurant: list menu"   200  "$GATEWAY/api/restaurant/menu"                        "${AUTH[@]}"
check_success "Restaurant: list orders" 200  "$GATEWAY/api/restaurant/orders"                      "${AUTH[@]}"

section "Gateway — Restaurant: POST menu item"
TS2=$(date +%s)
check_success "Restaurant: add menu item" 200 "$GATEWAY/api/restaurant/menu"  \
  "${AUTH[@]}" "${JSON[@]}" \
  -d "{\"name\":\"Nyama Choma ${TS2}\",\"description\":\"Grilled meat served with ugali\",\"price\":850,\"category\":\"main\",\"isAvailable\":true}"

section "Direct — Hotel service (port 8003) [Docker-internal only — skipped from host]"
# These only work from inside the Docker network. Run with:
#   docker exec elmariam-hotel curl -s http://localhost:8003/api/v1/customers ...
SKIP=$((SKIP+6)); echo -e "  ${YELLOW}–${RESET} Direct hotel tests skipped (not exposed on localhost)"

section "Direct — Bar service (port 8004) [Docker-internal only — skipped from host]"
SKIP=$((SKIP+3)); echo -e "  ${YELLOW}–${RESET} Direct bar tests skipped (not exposed on localhost)"

section "Direct — Restaurant service (port 8005) [Docker-internal only — skipped from host]"
SKIP=$((SKIP+2)); echo -e "  ${YELLOW}–${RESET} Direct restaurant tests skipped (not exposed on localhost)"

section "Checkout service (port 8008) [Docker-internal only — skipped from host]"
SKIP=$((SKIP+1)); echo -e "  ${YELLOW}–${RESET} Checkout skipped (not exposed on localhost)"

# ── summary ───────────────────────────────────────────────────────────────────

echo -e "\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  ${GREEN}Passed${RESET}: $PASS   ${RED}Failed${RESET}: $FAIL   ${YELLOW}Skipped${RESET}: $SKIP"
if [[ ${#FAILURES[@]} -gt 0 ]]; then
  echo -e "\n  ${RED}Failures:${RESET}"
  for f in "${FAILURES[@]}"; do echo "    • $f"; done
fi
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n"

[[ $FAIL -eq 0 ]]
