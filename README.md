# VibeSec

VibeSec is a passive launch security checker for AI-built web apps, vibe-coded products, and fast-moving SaaS prototypes.

Paste a deployed URL and get a simple security score, launch-readiness report, public showcase card, and practical fixes for common web app risks before sharing your app with users.

Live site: https://vibesec.bymyleslee.com  
Repository: https://github.com/mylee04/vibesec

## Why VibeSec Exists

AI coding tools make it easy to ship web apps quickly, but many launches still miss basic security hygiene:

- Missing security headers
- Overly permissive CORS
- Public sourcemaps and debug files
- Exposed admin or staging routes
- Weak cookie posture
- Unchecked provider configuration for Vercel, Supabase, Firebase, and AI API apps

VibeSec focuses on safe, passive checks and clear next steps instead of exploit payloads or aggressive scanning.

## What It Checks

- HTTPS and security header posture
- CORS and cookie configuration
- Public sourcemaps, `.env`, `.git`, and sensitive file exposure
- Common admin, debug, upload, webhook, staging, and test route exposure
- Framework and provider hints
- Public opt-in showcase pages for apps that want promotion
- Multi-language UI: English, Spanish, Japanese, Korean, and Russian

## Product Surface

- URL scanner with 0-100 security score
- Launch-readiness report
- Prioritized findings grouped by severity
- Copy-paste fixes for common launch issues
- Free launch board posts after a successful passive scan
- Public app community board with upvotes, comments, and post pages
- Redis-backed rate limiting, scan cache, launch board storage, and vote dedupe

## Safety Model

VibeSec is designed as a pre-launch checkup, not an offensive security tool.

- No credential guessing
- No brute-force discovery
- No exploit payloads
- No SQL injection or XSS attack attempts
- No private network targets
- Sensitive findings stay out of public showcase pages

## Local Development

```bash
bun install
bun run dev
```

## Validation

```bash
bun run lint
bun run typecheck
bun test
bun run build
```

## Environment Variables

Do not commit real secrets. Configure these only in the deployment environment when needed:

- `REDIS_URL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `VIBESEC_ALERT_WEBHOOK_URL`

On the Oracle VPS, prefer local Redis:

```bash
REDIS_URL=redis://127.0.0.1:6379
```

`REDIS_URL` takes priority over Upstash-compatible variables. Without Redis variables, VibeSec falls back to in-memory rate limiting and launch board storage.

## Oracle VPS Deployment

VibeSec can run without Vercel as a Bun service behind nginx on an ARM64 Ubuntu VPS.

Deployment assets live in [`deploy/oracle`](deploy/oracle):

- `vibesec.service` for systemd
- `nginx-vibesec.conf` for nginx reverse proxy
- `vibesec.env.example` for server-only environment variables
- `scripts/deploy-oracle.sh` for validated rsync deployment
