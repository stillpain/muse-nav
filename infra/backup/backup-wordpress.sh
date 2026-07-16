#!/bin/sh
set -eu

: "${RESTIC_REPOSITORY:?required}"
: "${RESTIC_PASSWORD_FILE:?required}"
: "${BLOG_COMPOSE_DIR:?required}"
: "${DB_ROOT_PASSWORD:?required}"
: "${DB_NAME:=wordpress}"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TMPDIR="${TMPDIR:-/tmp}/twilight-backup-$STAMP"
mkdir -p "$TMPDIR"
trap 'rm -rf "$TMPDIR"' EXIT

cd "$BLOG_COMPOSE_DIR"
docker compose exec -T db mariadb-dump -u root -p"$DB_ROOT_PASSWORD" --single-transaction --quick "$DB_NAME" > "$TMPDIR/wordpress.sql"
docker compose exec -T wordpress tar -czf - -C /var/www/html wp-content > "$TMPDIR/wp-content.tar.gz"
restic backup "$TMPDIR" --tag wordpress
restic forget --keep-daily 7 --keep-weekly 4 --keep-monthly 6 --prune
