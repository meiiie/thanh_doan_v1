#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="${1:-/etc/neko-doan/neko-doan.env}"
BACKUP_DIR="${NEKO_BACKUP_DIR:-/var/backups/neko-doan}"
RETENTION_DAYS="${NEKO_BACKUP_RETENTION_DAYS:-14}"

[[ "$BACKUP_DIR" = /* && "$BACKUP_DIR" != "/" ]] || { printf 'Unsafe backup directory.\n' >&2; exit 1; }
[[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]] || { printf 'Retention days must be a non-negative integer.\n' >&2; exit 1; }
[[ -r "$ENV_FILE" ]] || { printf 'Cannot read %s\n' "$ENV_FILE" >&2; exit 1; }
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

install -d -m 0700 "$BACKUP_DIR"
exec 9>"$BACKUP_DIR/.backup.lock"
flock -n 9 || { printf 'Another backup is already running.\n' >&2; exit 1; }

compose=(docker compose --env-file "$ENV_FILE" -f "$PROJECT_ROOT/compose.yaml" -f "$PROJECT_ROOT/compose.vps.yaml")
export POSTGRES_PASSWORD=compose-interpolation-placeholder
timestamp="$(date -u +'%Y%m%dT%H%M%SZ')"
archive="$BACKUP_DIR/neko-doan-${timestamp}.dump"
partial="$(mktemp "$BACKUP_DIR/.neko-doan-${timestamp}.XXXXXX.partial")"
trap 'rm -f -- "$partial"' EXIT

# Variables in this command are intentionally expanded inside the container.
# shellcheck disable=SC2016
"${compose[@]}" exec -T database sh -c \
  'exec pg_dump --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --format=custom' >"$partial"
"${compose[@]}" exec -T database pg_restore --list <"$partial" >/dev/null
mv -- "$partial" "$archive"
sha256sum "$archive" >"$archive.sha256"

# Variables in this command are intentionally expanded inside the container.
# shellcheck disable=SC2016
migration_version="$("${compose[@]}" exec -T database sh -c \
  'psql --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --tuples-only --no-align --command="select max(version) from flyway_schema_history where success = true"')"
{
  printf 'created_at=%s\n' "$timestamp"
  printf 'database=%s\n' "${POSTGRES_DB:-campaign}"
  printf 'migration_version=%s\n' "$migration_version"
  printf 'postgres_image=%s\n' "$POSTGRES_IMAGE"
  printf 'sha256=%s\n' "$(cut -d' ' -f1 "$archive.sha256")"
} >"$archive.meta"

find "$BACKUP_DIR" -maxdepth 1 -type f \
  \( -name 'neko-doan-*.dump' -o -name 'neko-doan-*.dump.sha256' -o -name 'neko-doan-*.dump.meta' \) \
  -mtime "+$RETENTION_DAYS" -print -delete

printf 'Backup created: %s\n' "$archive"
printf 'This local backup is not complete protection until an encrypted off-host copy is verified.\n'
