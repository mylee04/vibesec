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
- Paid-code gated showcase publishing
- Public app showcase for teams that want to advertise their web app
- Optional Redis-backed rate limiting and cache through Upstash or Vercel KV-compatible variables

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

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `VIBESEC_ALERT_WEBHOOK_URL`

Without Redis variables, VibeSec falls back to in-memory rate limiting and showcase storage.
