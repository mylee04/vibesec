#!/usr/bin/env bash
set -euo pipefail

DEPLOY_HOST="${VIBESEC_DEPLOY_HOST:-157.137.191.201}"
DEPLOY_USER="${VIBESEC_DEPLOY_USER:-ubuntu}"
DEPLOY_KEY="${VIBESEC_DEPLOY_KEY:-$HOME/.ssh/id_rsa}"
APP_DIR="${VIBESEC_APP_DIR:-/srv/vibesec/app}"

bun install --frozen-lockfile
bun run lint
bun run typecheck
bun test
bun run build

ssh -i "$DEPLOY_KEY" "$DEPLOY_USER@$DEPLOY_HOST" "sudo mkdir -p '$APP_DIR' && sudo chown -R '$DEPLOY_USER:$DEPLOY_USER' /srv/vibesec"
rsync -az --delete \
  --exclude .git \
  --exclude node_modules \
  --exclude dist \
  --exclude .env \
  --exclude '.env.*' \
  -e "ssh -i $DEPLOY_KEY" \
  ./ "$DEPLOY_USER@$DEPLOY_HOST:$APP_DIR/"

ssh -i "$DEPLOY_KEY" "$DEPLOY_USER@$DEPLOY_HOST" "sudo cp '$APP_DIR/deploy/oracle/vibesec.service' /etc/systemd/system/vibesec.service && sudo cp '$APP_DIR/deploy/oracle/nginx-vibesec.conf' /etc/nginx/sites-available/vibesec.conf && sudo ln -sf /etc/nginx/sites-available/vibesec.conf /etc/nginx/sites-enabled/vibesec.conf && sudo nginx -t && sudo systemctl reload-or-restart nginx && sudo systemctl daemon-reload && sudo chown -R vibesec:vibesec /srv/vibesec && sudo -u vibesec bash -lc 'export BUN_INSTALL=/home/vibesec/.bun; export PATH=\$BUN_INSTALL/bin:\$PATH; cd $APP_DIR && bun install --frozen-lockfile && bun run build' && sudo systemctl enable --now vibesec.service && sudo systemctl restart vibesec.service"
