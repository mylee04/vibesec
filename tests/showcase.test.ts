import { describe, expect, it } from "bun:test"
import type { ScanReport } from "../src/scanner/types.js"
import { createShowcaseEntry, listShowcaseEntries } from "../src/server/showcase-handler.js"
import { createMemoryShowcaseStore } from "../src/server/showcase-store.js"

const reportWithScore = (score: number): ScanReport => ({
  targetUrl: "https://listed.example/",
  scannedAt: "2026-06-06T00:00:00.000Z",
  score,
  grade: score >= 90 ? "A" : "B",
  risk: "Low",
  summary: "Baseline launch posture looks healthy",
  issues: [],
  checks: [],
  fixes: [],
  detected: ["Vercel"],
})

const validPayload = {
  appName: "Listed App",
  appUrl: "https://listed.example",
  tagline: "A secure AI launch worth sharing.",
  category: "AI Tools",
  stack: ["Vercel", "OpenAI"],
  accessCode: "paid-code",
}

describe("showcase entries", () => {
  it("publishes only safe public fields after rescanning the submitted app", async () => {
    // Given: a paid showcase submission and a scanner that returns a high score.
    const store = createMemoryShowcaseStore()
    const scanner = { scanTarget: () => reportWithScore(97) }

    // When: the submission is created and then listed.
    const created = await createShowcaseEntry(validPayload, {
      store,
      scanner,
      accessCode: "paid-code",
    })
    const listed = await listShowcaseEntries(store)

    // Then: the public entry contains promotional fields and no raw issue evidence.
    expect(created.status).toBe(201)
    expect(listed.body).toEqual({
      entries: [
        {
          id: "listed-app-listed-example",
          appName: "Listed App",
          appUrl: "https://listed.example/",
          tagline: "A secure AI launch worth sharing.",
          category: "AI Tools",
          stack: ["Vercel", "OpenAI"],
          score: 97,
          grade: "A",
          risk: "Low",
          createdAt: expect.any(String),
          lastScannedAt: "2026-06-06T00:00:00.000Z",
        },
      ],
    })
  })

  it("rejects showcase submissions without the paid access code", async () => {
    // Given: a paid showcase gate.
    const store = createMemoryShowcaseStore()

    // When: a submission uses the wrong access code.
    const result = await createShowcaseEntry(
      { ...validPayload, accessCode: "wrong" },
      {
        store,
        scanner: { scanTarget: () => reportWithScore(97) },
        accessCode: "paid-code",
      },
    )

    // Then: the app is not listed.
    expect(result.status).toBe(402)
    expect(await store.listEntries()).toEqual([])
  })

  it("rejects low scoring apps from public showcase listing", async () => {
    // Given: a submission that can be scanned but does not meet the public score bar.
    const store = createMemoryShowcaseStore()

    // When: the verified scan returns a low score.
    const result = await createShowcaseEntry(validPayload, {
      store,
      scanner: { scanTarget: () => reportWithScore(54) },
      accessCode: "paid-code",
    })

    // Then: the public listing is denied.
    expect(result.status).toBe(422)
    expect(await store.listEntries()).toEqual([])
  })
})
