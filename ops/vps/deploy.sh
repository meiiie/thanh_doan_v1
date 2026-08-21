#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="${1:-/etc/neko-doan/neko-doan.env}"
shift || true
if [[ "${1:-}" == "--allow-bootstrap" ]]; then
  export NEKO_ALLOW_BOOTSTRAP=1
fi

bash "$SCRIPT_DIR/preflight.sh" "$ENV_FILE"
compose=(docker compose --env-file "$ENV_FILE" -f "$PROJECT_ROOT/compose.yaml" -f "$PROJECT_ROOT/compose.vps.yaml")
export POSTGRES_PASSWORD=compose-interpolation-placeholder

state_dir="${NEKO_RELEASE_STATE_DIR:-/var/lib/neko-doan/releases}"
install -d -m 0700 "$state_dir"
timestamp="$(date -u +'%Y%m%dT%H%M%SZ')"
"${compose[@]}" images --format json >"$state_dir/${timestamp}-before.json" 2>/dev/null || true

"${compose[@]}" pull
"${compose[@]}" run --rm --no-deps edge caddy validate --config /etc/caddy/Caddyfile
"${compose[@]}" up -d --remove-orphans --wait --wait-timeout 180
bash "$SCRIPT_DIR/smoke.sh" "$ENV_FILE"
"${compose[@]}" ps

{
  printf 'deployed_at=%s\n' "$timestamp"
  printf 'git_commit=%s\n' "$(git -C "$PROJECT_ROOT" rev-parse HEAD 2>/dev/null || printf unknown)"
  printf 'compose_sha256=%s\n' "$(sha256sum "$PROJECT_ROOT/compose.yaml" "$PROJECT_ROOT/compose.vps.yaml" | sha256sum | cut -d' ' -f1)"
  "${compose[@]}" images --format json
} >"$state_dir/${timestamp}-deployed.txt"
chmod 0600 "$state_dir/${timestamp}-deployed.txt"

printf 'Deployment completed. Bootstrap must now be disabled if it was used.\n'
