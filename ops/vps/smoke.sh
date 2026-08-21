#!/usr/bin/env bash
set -Eeuo pipefail

ENV_FILE="${1:-/etc/neko-doan/neko-doan.env}"
[[ -r "$ENV_FILE" ]] || { printf 'Cannot read %s\n' "$ENV_FILE" >&2; exit 1; }
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

base_url="https://${APP_DOMAIN:?APP_DOMAIN is required}"
tmp_dir="$(mktemp -d)"
trap 'rm -rf -- "$tmp_dir"' EXIT

ready=0
for _ in $(seq 1 60); do
  if curl --fail --silent --show-error --max-time 10 "$base_url/readyz" >"$tmp_dir/health" 2>/dev/null &&
     grep -q '"status":"UP"' "$tmp_dir/health"; then
    ready=1
    break
  fi
  sleep 2
done
[[ "$ready" == 1 ]] || { printf 'HTTPS health check did not become ready: %s\n' "$base_url" >&2; exit 1; }

curl --fail --silent --show-error --max-time 15 -D "$tmp_dir/headers" -o "$tmp_dir/login" "$base_url/login"
grep -q 'name="neko-doan-app"' "$tmp_dir/login"
grep -qi '^strict-transport-security:' "$tmp_dir/headers"
grep -qi '^content-security-policy:' "$tmp_dir/headers"
grep -qi '^x-content-type-options: nosniff' "$tmp_dir/headers"
grep -qi '^x-robots-tag: noindex' "$tmp_dir/headers"

curl --fail --silent --show-error --max-time 15 "$base_url/api/auth/csrf" >"$tmp_dir/csrf.json"
grep -q '"token"' "$tmp_dir/csrf.json"

read -r redirect_code redirect_url < <(
  curl --silent --show-error --max-time 10 -o /dev/null \
    -w '%{http_code} %{redirect_url}' "http://${APP_DOMAIN}/login"
)
if [[ ! "$redirect_code" =~ ^30[178]$ || "$redirect_url" != "https://${APP_DOMAIN}/"* ]]; then
  printf 'HTTP does not redirect to HTTPS as expected: %s %s\n' "$redirect_code" "$redirect_url" >&2
  exit 1
fi

printf 'Smoke passed: %s\n' "$base_url"
