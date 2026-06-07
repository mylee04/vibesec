# VibeSec

VibeSec is a launch security checker for AI-built web apps. Paste a deployed URL and get a passive security score, launch-readiness report, and practical fixes for common web app risks.

## What It Checks

- HTTPS and security headers
- CORS and cookie posture
- Public sourcemaps and sensitive files
- Common admin, debug, and staging exposure
- Provider hints for Vercel, Supabase, Firebase, and AI API apps
- Public showcase pages for opted-in apps

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
- `VIBESEC_SHOWCASE_ACCESS_CODE`
- `VIBESEC_ALERT_WEBHOOK_URL`

Without Redis variables, VibeSec falls back to in-memory rate limiting and showcase storage.
