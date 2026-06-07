import type { FixPanel } from "./types.js"

export const buildFixPanels = (detected: readonly string[]): readonly FixPanel[] => [
  {
    provider: "Next.js / Vercel",
    title: "Add launch security headers",
    note: "Use this as a starting point, then tune CSP domains for your real app.",
    code: `export async function headers() {
  return [{
    source: "/(.*)",
    headers: [
      { key: "Content-Security-Policy", value: "default-src 'self'; frame-ancestors 'none'" },
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
    ]
  }]
}`,
  },
  {
    provider: "Supabase",
    title: "Verify RLS before launch",
    note: detected.includes("Supabase")
      ? "Supabase patterns were detected. The anon key is normal, but RLS must be enabled."
      : "Use this when your app connects to Supabase from the browser.",
    code: `alter table public.your_table enable row level security;
create policy "Users can read their rows"
on public.your_table for select
using (auth.uid() = user_id);`,
  },
  {
    provider: "Firebase",
    title: "Restrict public database and storage rules",
    note: "Firebase config can be public, but database and storage rules must not be open.",
    code: `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`,
  },
  {
    provider: "AI API",
    title: "Rate limit LLM endpoints",
    note: "Protect chat, generate, upload, and webhook routes from runaway usage.",
    code: `const key = \`\${userId}:\${new URL(req.url).pathname}\`
const allowed = await limiter.limit(key)
if (!allowed) return new Response("Rate limited", { status: 429 })`,
  },
]
