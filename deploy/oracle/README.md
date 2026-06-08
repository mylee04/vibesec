# Oracle VPS Deployment

This deployment path is for the OCI ARM64 server. It runs VibeSec as a Bun service behind nginx and uses local Redis for scan cache, rate limits, launch board posts, comments, and vote dedupe.

## Server Setup

Run on the OCI server:

```bash
sudo apt update
sudo apt install -y nginx redis-server unzip
sudo systemctl enable --now nginx redis-server
sudo redis-cli CONFIG SET appendonly yes
sudo redis-cli CONFIG REWRITE
```

Create the app user and directories:

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin vibesec
sudo mkdir -p /srv/vibesec/app /etc/vibesec
sudo chown -R vibesec:vibesec /srv/vibesec
```

Install Bun for the `vibesec` user:

```bash
sudo -u vibesec bash -lc 'curl -fsSL https://bun.sh/install | bash'
```

Copy `deploy/oracle/vibesec.env.example` to `/etc/vibesec/vibesec.env` and keep real values out of git:

```bash
sudo cp deploy/oracle/vibesec.env.example /etc/vibesec/vibesec.env
sudo chmod 600 /etc/vibesec/vibesec.env
```

Install systemd and nginx config:

```bash
sudo cp deploy/oracle/vibesec.service /etc/systemd/system/vibesec.service
sudo cp deploy/oracle/nginx-vibesec.conf /etc/nginx/sites-available/vibesec.conf
sudo ln -sf /etc/nginx/sites-available/vibesec.conf /etc/nginx/sites-enabled/vibesec.conf
sudo nginx -t
sudo systemctl daemon-reload
```

## App Release

From `/srv/vibesec/app` on the server:

```bash
bun install --frozen-lockfile
bun run build
sudo systemctl enable --now vibesec.service
```

After DNS points `vibesec.bymyleslee.com` to the OCI public IP, issue SSL:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d vibesec.bymyleslee.com
```

## Operations

```bash
sudo systemctl status vibesec.service
sudo journalctl -u vibesec.service -f
redis-cli ping
```
