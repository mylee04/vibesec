import type { ShowcaseEntry } from "../showcase/types.js"

export const fallbackShowcaseEntries = [
  {
    id: "vibesec-vibesec-bymyleslee-com",
    appName: "VibeSec",
    appUrl: "https://vibesec.bymyleslee.com/",
    tagline: "Launch security checker for AI-built web apps.",
    category: "Security",
    stack: ["Vercel", "Redis-ready"],
    score: 97,
    grade: "A",
    risk: "Low",
    upvotes: 0,
    comments: [],
    createdAt: "2026-06-06T22:47:24.414Z",
    lastScannedAt: "2026-06-06T22:47:24.413Z",
  },
] as const satisfies readonly ShowcaseEntry[]

export const selectHomeShowcaseEntries = (
  entries: readonly ShowcaseEntry[],
): readonly ShowcaseEntry[] => {
  return withFallbackShowcaseEntries(entries).slice(0, 3)
}

export const withFallbackShowcaseEntries = (
  entries: readonly ShowcaseEntry[],
): readonly ShowcaseEntry[] => {
  const entryIds = new Set(entries.map((entry) => entry.id))
  const missingFallbackEntries = fallbackShowcaseEntries.filter((entry) => !entryIds.has(entry.id))
  return [...missingFallbackEntries, ...entries]
}

export const formatShowcaseHost = (appUrl: string): string => {
  try {
    return new URL(appUrl).hostname.replace(/^www\./u, "")
  } catch (error: unknown) {
    if (error instanceof TypeError) {
      return appUrl
    }
    throw error
  }
}
