#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

ENV_FILE="${1:-/etc/neko-doan/neko-doan.env}"
BACKUP="${2:-}"
[[ -r "$ENV_FILE" ]] || { printf 'Cannot read %s\n' "$ENV_FILE" >&2; exit 1; }
[[ -n "$BACKUP" && -f "$BACKUP" && "$BACKUP" == *.dump ]] || {
  printf 'Usage: %s ENV_FILE BACKUP.dump\n' "$0" >&2
  exit 1
}
[[ -f "$BACKUP.sha256" ]] || { printf 'Checksum sidecar is required.\n' >&2; exit 1; }
(cd -- "$(dirname -- "$BACKUP")" && sha256sum --check "$(basename -- "$BACKUP.sha256")")

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

container="neko-doan-restore-drill-$(date +%s)-$$"
password="$(openssl rand -base64 36)"
report="${BACKUP%.dump}-restore-drill-$(date -u +'%Y%m%dT%H%M%SZ').txt"
cleanup() { docker rm -f "$container" >/dev/null 2>&1 || true; }
trap cleanup EXIT

docker run -d --name "$container" \
  --security-opt no-new-privileges:true \
  --cpus 1 \
  --memory 1g \
  --pids-limit 256 \
  --tmpfs /tmp:rw,noexec,nosuid,size=128m \
  -e POSTGRES_DB=neko_doan_restore \
  -e POSTGRES_USER=neko_doan_restore \
  -e POSTGRES_PASSWORD="$password" \
  "$POSTGRES_IMAGE" >/dev/null

ready=0
for _ in $(seq 1 60); do
  if docker exec "$container" pg_isready -U neko_doan_restore -d neko_doan_restore >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done
[[ "$ready" == 1 ]] || { printf 'Restore drill database did not become ready.\n' >&2; exit 1; }

docker cp "$BACKUP" "$container:/tmp/restore.dump"
docker exec "$container" pg_restore --username=neko_doan_restore --dbname=neko_doan_restore \
  --no-owner --single-transaction /tmp/restore.dump

line_count="$(docker exec "$container" psql -U neko_doan_restore -d neko_doan_restore -tA \
  -c 'select count(*) from scorecard_line')"
migration_version="$(docker exec "$container" psql -U neko_doan_restore -d neko_doan_restore -tA \
  -c 'select max(version) from flyway_schema_history where success = true')"
[[ "$line_count" == 55 ]] || { printf 'Expected 55 scorecard lines, found %s.\n' "$line_count" >&2; exit 1; }
(( migration_version >= 8 )) || { printf 'Expected Flyway version >= 8, found %s.\n' "$migration_version" >&2; exit 1; }

{
  printf 'outcome=PASSED\n'
  printf 'exercised_at=%s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
  printf 'backup=%s\n' "$BACKUP"
  printf 'scorecard_lines=%s\n' "$line_count"
  printf 'migration_version=%s\n' "$migration_version"
  printf 'postgres_image=%s\n' "$POSTGRES_IMAGE"
} >"$report"
printf 'Restore drill passed: %s\n' "$report"
