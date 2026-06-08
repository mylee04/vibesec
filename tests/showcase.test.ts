import { describe, expect, it } from "bun:test"
import { ScanFailedError } from "../src/scanner/scan.js"
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
  appUrl: "listed.example",
  tagline: "A secure AI launch worth sharing with a useful community post.",
  category: "AI Tools",
  stack: ["Vercel", "OpenAI"],
}

describe("showcase entries", () => {
  it("publishes community posts only after a successful scan", async () => {
    // Given: a free community submission with a schemeless app URL.
    const store = createMemoryShowcaseStore()
    const scanner = { scanTarget: () => reportWithScore(97) }

    // When: the submission is created and then listed.
    const created = await createShowcaseEntry(validPayload, { store, scanner })
    const listed = await listShowcaseEntries(store)

    // Then: the public entry contains the post fields and scan summary.
    expect(created.status).toBe(201)
    expect(listed.body).toEqual({
      entries: [
        {
          id: "listed-app-listed-example",
          appName: "Listed App",
          appUrl: "https://listed.example/",
          tagline: "A secure AI launch worth sharing with a useful community post.",
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

  it("rejects invalid community post urls", async () => {
    // Given: a free community submission with an invalid URL.
    const store = createMemoryShowcaseStore()

    // When: the user tries to publish it.
    const result = await createShowcaseEntry(
      {
        ...validPayload,
        appUrl: "not a valid url",
      },
      { store },
    )

    // Then: the post is rejected before it reaches storage.
    expect(result.status).toBe(400)
    expect(await store.listEntries()).toHaveLength(0)
  })

  it("does not publish when the required scan fails", async () => {
    // Given: a community submission whose URL cannot be scanned.
    const store = createMemoryShowcaseStore()
    const scanner = {
      scanTarget: () => {
        throw new ScanFailedError("Could not scan target")
      },
    }

    // When: the user tries to publish it.
    const result = await createShowcaseEntry(validPayload, { store, scanner })

    // Then: no community entry is stored.
    expect(result.status).toBe(502)
    expect(await store.listEntries()).toHaveLength(0)
  })

  it("blocks gambling adult and nightlife submissions before scanning", async () => {
    // Given: prohibited community submissions.
    const store = createMemoryShowcaseStore()
    let scanCalls = 0
    const scanner = {
      scanTarget: () => {
        scanCalls += 1
        return reportWithScore(91)
      },
    }

    // When: users try to publish prohibited links or copy.
    const gamblingResult = await createShowcaseEntry(
      {
        ...validPayload,
        appName: "Best casino bonus",
      },
      { store, scanner },
    )
    const adultResult = await createShowcaseEntry(
      {
        ...validPayload,
        appUrl: "adult-example.com",
      },
      { store, scanner },
    )
    const nightlifeResult = await createShowcaseEntry(
      {
        ...validPayload,
        tagline: "서울 유흥 정보를 모아 보여주는 서비스입니다.",
      },
      { store, scanner },
    )

    // Then: none are scanned or stored.
    expect(gamblingResult.status).toBe(403)
    expect(adultResult.status).toBe(403)
    expect(nightlifeResult.status).toBe(403)
    expect(scanCalls).toBe(0)
    expect(await store.listEntries()).toHaveLength(0)
  })

  it("keeps Korean post titles readable in public URLs", async () => {
    // Given: a Korean community post title.
    const store = createMemoryShowcaseStore()
    const scanner = { scanTarget: () => reportWithScore(91) }

    // When: the post is published.
    const result = await createShowcaseEntry(
      {
        ...validPayload,
        appName: "테스트 AI 랜딩페이지 빌더",
      },
      { store, scanner },
    )

    // Then: the public id keeps the readable Korean title.
    expect(result.status).toBe(201)
    expect((await store.listEntries())[0]?.id).toBe("테스트-ai-랜딩페이지-빌더-listed-example")
  })

  it("increments public launch board upvotes once per visitor", async () => {
    // Given: a published launch board entry.
    const store = createMemoryShowcaseStore()
    await createShowcaseEntry(validPayload, {
      store,
      scanner: { scanTarget: () => reportWithScore(91) },
    })

    // When: one visitor upvotes the same app twice.
    const firstResult = await upvoteShowcaseEntry(
      { entryId: "listed-app-listed-example" },
      { store, visitorId: "visitor-one" },
    )
    const duplicateResult = await upvoteShowcaseEntry(
      { entryId: "listed-app-listed-example" },
      { store, visitorId: "visitor-one" },
    )

    // Then: the public counter is updated only once for that visitor.
    expect(firstResult.status).toBe(200)
    expect(duplicateResult.status).toBe(200)
    expect(duplicateResult.body).toMatchObject({
      entry: {
        id: "listed-app-listed-example",
        upvotes: 1,
      },
    })
  })

  it("increments public launch board upvotes for different visitors", async () => {
    // Given: a published launch board entry.
    const store = createMemoryShowcaseStore()
    await createShowcaseEntry(validPayload, {
      store,
      scanner: { scanTarget: () => reportWithScore(91) },
    })

    // When: two different visitors upvote the same app.
    await upvoteShowcaseEntry(
      { entryId: "listed-app-listed-example" },
      { store, visitorId: "visitor-one" },
    )
    const secondResult = await upvoteShowcaseEntry(
      { entryId: "listed-app-listed-example" },
      { store, visitorId: "visitor-two" },
    )

    // Then: both visitors count.
    expect(secondResult.status).toBe(200)
    expect(secondResult.body).toMatchObject({
      entry: {
        id: "listed-app-listed-example",
        upvotes: 2,
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
