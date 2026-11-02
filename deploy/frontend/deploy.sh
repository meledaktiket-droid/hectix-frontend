#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
git pull --ff-only

# Build satu per satu (sequential) agar aman di instance 2 vCPU / 2 GB RAM (t3.small).
# Jika argumen diberikan (mis. ./deploy.sh web), hanya build & jalankan app tersebut + caddy.
APPS=("${@:-web organizer admin}")
if [[ $# -eq 0 ]]; then
  APPS=(web organizer admin)
else
  APPS=("$@")
fi

for app in "${APPS[@]}"; do
  echo "==> Building $app..."
  docker compose build "$app"
done

docker compose up -d --remove-orphans "${APPS[@]}" caddy
docker image prune -f >/dev/null
docker compose ps
