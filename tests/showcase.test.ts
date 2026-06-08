import { describe, expect, it } from "bun:test"
import {
  addShowcaseComment,
  createShowcaseEntry,
  listShowcaseEntries,
  upvoteShowcaseEntry,
} from "../src/server/showcase-handler.js"
import { createMemoryShowcaseStore } from "../src/server/showcase-store.js"

const validPayload = {
  appName: "Listed App",
  appUrl: "listed.example",
  tagline: "A secure AI launch worth sharing with a useful community post.",
  category: "AI Tools",
  stack: ["Vercel", "OpenAI"],
}

describe("showcase entries", () => {
  it("publishes community posts without requiring a scan score", async () => {
    // Given: a free community submission with a schemeless app URL.
    const store = createMemoryShowcaseStore()

    // When: the submission is created and then listed.
    const created = await createShowcaseEntry(validPayload, { store })
    const listed = await listShowcaseEntries(store)

    // Then: the public entry contains the post fields and no scan evidence is required.
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
          score: 0,
          grade: "Post",
          risk: "Community",
          upvotes: 0,
          comments: [],
          createdAt: expect.any(String),
          lastScannedAt: expect.any(String),
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

  it("keeps Korean post titles readable in public URLs", async () => {
    // Given: a Korean community post title.
    const store = createMemoryShowcaseStore()

    // When: the post is published.
    const result = await createShowcaseEntry(
      {
        ...validPayload,
        appName: "테스트 AI 랜딩페이지 빌더",
      },
      { store },
    )

    // Then: the public id keeps the readable Korean title.
    expect(result.status).toBe(201)
    expect((await store.listEntries())[0]?.id).toBe("테스트-ai-랜딩페이지-빌더-listed-example")
  })

  it("increments public launch board upvotes", async () => {
    // Given: a published launch board entry.
    const store = createMemoryShowcaseStore()
    await createShowcaseEntry(validPayload, { store })

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
    await createShowcaseEntry(validPayload, { store })

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
