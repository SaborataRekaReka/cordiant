#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="${SERVICE_NAME:-cordiant-backend}"
APP_DIR="${APP_DIR:-/var/www/cordiant.autogoda.ru/data}"
APP_USER="${APP_USER:-bitrix}"
APP_GROUP="${APP_GROUP:-bitrix}"
NODE_BIN="${NODE_BIN:-/home/bitrix/.local/node-v16.20.2-linux-x64/bin/node}"
ENV_PATH="${ENV_PATH:-$APP_DIR/config/.env}"
STORAGE_DIR="${STORAGE_DIR:-$APP_DIR/storage}"
UNIT_PATH="/etc/systemd/system/${SERVICE_NAME}.service"

if [[ "$EUID" -ne 0 ]]; then
  echo "Run this script as root (for example: sudo bash scripts/systemd/install-systemd.sh)."
  exit 1
fi

if [[ ! -d "$APP_DIR" ]]; then
  echo "APP_DIR does not exist: $APP_DIR"
  exit 1
fi

if [[ ! -x "$NODE_BIN" ]]; then
  echo "NODE_BIN is not executable: $NODE_BIN"
  exit 1
fi

mkdir -p "$STORAGE_DIR"
chown "$APP_USER:$APP_GROUP" "$STORAGE_DIR"

cat > "$UNIT_PATH" <<EOF
[Unit]
Description=Cordiant backend service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_GROUP
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
Environment=CORDIANT_ENV_PATH=$ENV_PATH
Environment=STORAGE_DIR=$STORAGE_DIR
ExecStart=$NODE_BIN $APP_DIR/server/server.js
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

chmod 644 "$UNIT_PATH"
systemctl daemon-reload
systemctl enable --now "$SERVICE_NAME"

echo "Service installed: $UNIT_PATH"
systemctl --no-pager --full status "$SERVICE_NAME" || true