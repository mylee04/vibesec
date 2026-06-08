import { describe, expect, it } from "bun:test"
import type { ScanReport } from "../src/scanner/types.js"
import {
  addShowcaseComment,
  createShowcaseEntry,
  listShowcaseEntries,
  upvoteShowcaseEntry,
} from "../src/server/showcase-handler.js"
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
}

describe("showcase entries", () => {
  it("publishes only safe public fields after rescanning the submitted app", async () => {
    // Given: a free showcase submission and a scanner that returns a high score.
    const store = createMemoryShowcaseStore()
    const scanner = { scanTarget: () => reportWithScore(97) }

    // When: the submission is created and then listed.
    const created = await createShowcaseEntry(validPayload, {
      store,
      scanner,
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
          upvotes: 0,
          comments: [],
          createdAt: expect.any(String),
          lastScannedAt: "2026-06-06T00:00:00.000Z",
        },
      ],
    })
  })

  it("publishes low scoring apps to the free showcase", async () => {
    // Given: a free showcase submission with a low scan score.
    const store = createMemoryShowcaseStore()

    // When: the verified scan returns a low score.
    const result = await createShowcaseEntry(validPayload, {
      store,
      scanner: { scanTarget: () => reportWithScore(54) },
    })

    // Then: the public listing is still created.
    expect(result.status).toBe(201)
    expect(await store.listEntries()).toHaveLength(1)
  })

  it("increments public launch board upvotes", async () => {
    // Given: a published launch board entry.
    const store = createMemoryShowcaseStore()
    await createShowcaseEntry(validPayload, {
      store,
      scanner: { scanTarget: () => reportWithScore(91) },
    })

    // When: a visitor upvotes the app.
    const result = await upvoteShowcaseEntry({ entryId: "listed-app-listed-example" }, store)

    // Then: the public counter is updated on the entry.
    expect(result.status).toBe(200)
    expect(result.body).toMatchObject({
      entry: {
        id: "listed-app-listed-example",
        upvotes: 1,
      },
    })
  })

  it("adds public launch board comments", async () => {
    // Given: a published launch board entry.
    const store = createMemoryShowcaseStore()
    await createShowcaseEntry(validPayload, {
      store,
      scanner: { scanTarget: () => reportWithScore(91) },
    })

    // When: a visitor comments on the app.
    const result = await addShowcaseComment(
      {
        entryId: "listed-app-listed-example",
        authorName: "Myles",
        body: "Clean launch page and useful checklist.",
      },
      store,
    )

    // Then: the comment is attached to the public listing.
    expect(result.status).toBe(200)
    expect(result.body).toMatchObject({
      entry: {
        id: "listed-app-listed-example",
        comments: [
          {
            authorName: "Myles",
            body: "Clean launch page and useful checklist.",
            createdAt: expect.any(String),
            id: expect.any(String),
          },
        ],
      },
    })
  })
})
