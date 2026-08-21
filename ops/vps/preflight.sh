#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="${1:-/etc/neko-doan/neko-doan.env}"
COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$PROJECT_ROOT/compose.yaml" -f "$PROJECT_ROOT/compose.vps.yaml")

fail() {
  printf 'PRECHECK FAILED: %s\n' "$*" >&2
  exit 1
}

command -v docker >/dev/null 2>&1 || fail 'Docker is not installed.'
docker info >/dev/null 2>&1 || fail 'Docker daemon is unavailable to the deployment user.'
docker compose version >/dev/null 2>&1 || fail 'Docker Compose v2 is required.'
command -v python3 >/dev/null 2>&1 || fail 'python3 is required for manifest validation.'
command -v getent >/dev/null 2>&1 || fail 'getent is required for DNS validation.'

[[ -r "$ENV_FILE" ]] || fail "Cannot read environment file: $ENV_FILE"
env_mode="$(stat -c '%a' "$ENV_FILE")"
if (( (8#$env_mode & 8#037) != 0 )); then
  fail "$ENV_FILE must be read-only to its group and inaccessible to others (expected 0640 or 0600)."
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

required=(APP_DOMAIN ACME_EMAIL NEKO_SECRETS_DIR POSTGRES_IMAGE EDGE_IMAGE BACKEND_IMAGE FRONTEND_IMAGE)
for name in "${required[@]}"; do
  [[ -n "${!name:-}" ]] || fail "$name is missing from $ENV_FILE"
done

[[ "$APP_DOMAIN" != *example* && "$APP_DOMAIN" == *.* ]] || fail 'APP_DOMAIN must be a real public DNS name.'
[[ "$ACME_EMAIL" == *@*.* ]] || fail 'ACME_EMAIL is not valid.'
resolved_ips="$(getent ahosts "$APP_DOMAIN" 2>/dev/null | awk '{print $1}' | sort -u)"
[[ -n "$resolved_ips" ]] || fail "APP_DOMAIN does not resolve: $APP_DOMAIN"
export NEKO_RESOLVED_IPS="$resolved_ips"
python3 - <<'PY'
import ipaddress
import os

addresses = [ipaddress.ip_address(value) for value in os.environ["NEKO_RESOLVED_IPS"].split()]
if not any(address.is_global for address in addresses):
    raise SystemExit("APP_DOMAIN must resolve to at least one public IP address")
PY
unset NEKO_RESOLVED_IPS

check_image() {
  local name="$1" value="$2"
  [[ "$value" =~ @sha256:[0-9a-f]{64}$ ]] || fail "$name must use an immutable sha256 digest, not a mutable tag."
}
check_image POSTGRES_IMAGE "$POSTGRES_IMAGE"
check_image EDGE_IMAGE "$EDGE_IMAGE"
check_image BACKEND_IMAGE "$BACKEND_IMAGE"
check_image FRONTEND_IMAGE "$FRONTEND_IMAGE"

[[ "$NEKO_SECRETS_DIR" = /* && "$NEKO_SECRETS_DIR" != "/" ]] || fail 'NEKO_SECRETS_DIR must be a safe absolute directory.'
for secret_name in CAMPAIGN_DB_PASSWORD APP_BOOTSTRAP_PASSWORD; do
  secret_path="$NEKO_SECRETS_DIR/$secret_name"
  [[ -s "$secret_path" ]] || fail "Secret is missing or empty: $secret_path"
  secret_mode="$(stat -c '%a' "$secret_path")"
  if (( (8#$secret_mode & 8#077) != 0 )); then
    fail "$secret_path must have mode 0600 or stricter."
  fi
done

bootstrap_enabled="${APP_BOOTSTRAP_ENABLED:-false}"
bootstrap_enabled="${bootstrap_enabled,,}"
[[ "$bootstrap_enabled" == "true" || "$bootstrap_enabled" == "false" ]] ||
  fail 'APP_BOOTSTRAP_ENABLED must be true or false.'
if [[ "$bootstrap_enabled" == "true" && "${NEKO_ALLOW_BOOTSTRAP:-0}" != "1" ]]; then
  fail 'Bootstrap is enabled. Re-run only with NEKO_ALLOW_BOOTSTRAP=1 during the controlled first startup.'
fi
if [[ "$bootstrap_enabled" == "true" ]]; then
  bootstrap_length="$(wc -c <"$NEKO_SECRETS_DIR/APP_BOOTSTRAP_PASSWORD")"
  (( bootstrap_length >= 15 && bootstrap_length <= 72 )) ||
    fail 'APP_BOOTSTRAP_PASSWORD must contain 15 to 72 bytes during the first startup.'
fi

config_json="$(POSTGRES_PASSWORD=compose-interpolation-placeholder "${COMPOSE[@]}" config --format json)" ||
  fail 'Docker Compose configuration is invalid.'
export NEKO_COMPOSE_JSON="$config_json"
python3 - <<'PY'
import json
import os

config = json.loads(os.environ["NEKO_COMPOSE_JSON"])
services = config["services"]
errors = []
for name in ("database", "backend", "frontend"):
    if services[name].get("ports"):
        errors.append(f"{name} must not publish host ports")
for name in ("backend", "frontend"):
    if services[name].get("build"):
        errors.append(f"{name} must use a release image, not build on the VPS")
if not config.get("networks", {}).get("application", {}).get("internal"):
    errors.append("application network must remain internal")
edge_ports = {
    (str(item.get("published")), item.get("protocol", "tcp"))
    for item in services["edge"].get("ports", [])
}
expected = {("80", "tcp"), ("443", "tcp"), ("443", "udp")}
if edge_ports != expected:
    errors.append(f"edge must be the only public surface on 80/tcp and 443/tcp+udp; got {sorted(edge_ports)}")
if errors:
    raise SystemExit("; ".join(errors))
PY
unset NEKO_COMPOSE_JSON

printf 'Preflight passed for %s (%s).\n' "$APP_DOMAIN" "$ENV_FILE"
