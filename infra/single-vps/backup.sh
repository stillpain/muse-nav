#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")"
BACKUP_DIR=${BACKUP_DIR:-/opt/muse-backups}
STAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p "$BACKUP_DIR"

echo "Stopping Muse briefly for a consistent SQLite backup..."
docker compose stop muse
trap 'docker compose start muse >/dev/null 2>&1 || true' EXIT
docker run --rm -v muse_data:/data:ro -v "$BACKUP_DIR":/backup alpine:3.22 \
  tar -czf "/backup/muse-$STAMP.tar.gz" -C /data .
docker compose start muse
trap - EXIT

find "$BACKUP_DIR" -type f -name 'muse-*.tar.gz' -mtime +30 -delete
echo "Backup written to $BACKUP_DIR/muse-$STAMP.tar.gz"
