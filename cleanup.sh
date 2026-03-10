#!/bin/bash

echo "--- СТАРТ УБОРКИ: $(date) ---"

docker system prune -f

docker image prune -a -f --filter "until=168h"

apt-get clean

journalctl --vacuum-time=7d

rm -rf ~/.vscode-server/data/CachedExtensions/*

echo "--- УБОРКА ЗАВЕРШЕНА: $(date) ---"
echo ""