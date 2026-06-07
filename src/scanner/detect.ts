import type { PassiveResponse } from "./http.js"
import type { SecurityIssue } from "./types.js"

const providerPatterns: Readonly<Record<string, readonly RegExp[]>> = {
  Vercel: [/x-vercel-id/i, /\bvercel\b/i, /_vercel/i],
  Supabase: [/supabase/i, /supabase\.co/i, /SUPABASE_/i],
  Firebase: [/firebaseConfig/i, /firebaseapp\.com/i, /firestore/i],
  OpenAI: [/OPENAI_API_KEY/i, /api\.openai\.com/i, /sk-[A-Za-z0-9_-]{8,}/i],
}

export const detectProviderHints = (responses: readonly PassiveResponse[]): readonly string[] => {
  const hints = new Set<string>()
  for (const response of responses) {
    const headerText = Array.from(response.headers.entries())
      .map(([name, value]) => `${name}: ${value}`)
      .join("\n")
    const combined = `${headerText}\n${response.body}`
    for (const [provider, patterns] of Object.entries(providerPatterns)) {
      if (patterns.some((pattern) => pattern.test(combined))) {
        hints.add(provider)
      }
    }
  }
  return Array.from(hints)
}

export const providerIssue = (hints: readonly string[]): SecurityIssue | undefined => {
  if (hints.length === 0) {
    return undefined
  }
  return {
    id: "provider-hints",
    title: "Cloud and AI provider fingerprints are visible",
    severity: "Nice to fix",
    evidence: `Detected ${hints.join(", ")} in public responses`,
    recommendation: "Verify each detected service has least-privilege configuration.",
    penalty: 3,
  }
}
