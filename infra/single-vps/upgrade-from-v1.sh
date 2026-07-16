#!/usr/bin/env sh
set -eu

echo "This script must be run from /opt/muse-nav/infra/single-vps after git pull."
echo "It intentionally does not delete legacy volumes; follow UPGRADE-V2.md after checking the backup."

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env. Set the admin password and session secret, then run this script again."
  exit 1
fi

docker compose build muse
docker compose up -d --remove-orphans
docker compose ps
curl -fsS "https://${SITE_DOMAIN:-musedaohang.com}/health"
echo "Muse v2 is running. Open /studio and verify your data before removing legacy volumes."
