import { describe, expect, it } from "bun:test"
import type { ShowcaseEntry } from "../src/showcase/types.js"
import { sortLaunchBoardEntries } from "../src/ui/launch-board-sort.js"

const entry = (
  id: string,
  input: {
    readonly createdAt: string
    readonly upvotes: number
    readonly comments: number
  },
): ShowcaseEntry => ({
  id,
  appName: id,
  appUrl: `https://${id}.example/`,
  tagline: "A launch board entry for sorting.",
  category: "AI Tools",
  stack: [],
  score: 90,
  grade: "A",
  risk: "Low",
  upvotes: input.upvotes,
  comments: Array.from({ length: input.comments }, (_, index) => ({
    id: `${id}-${index}`,
    authorName: "Myles",
    body: "Useful launch.",
    createdAt: input.createdAt,
  })),
  createdAt: input.createdAt,
  lastScannedAt: input.createdAt,
})

describe("launch board sorting", () => {
  it("orders hot launches by activity and freshness", () => {
    // Given: one older app with more votes and one fresher app with active comments.
    const now = new Date("2026-06-08T12:00:00.000Z")
    const olderPopular = entry("older-popular", {
      createdAt: "2026-06-04T12:00:00.000Z",
      upvotes: 4,
      comments: 0,
    })
    const freshDiscussed = entry("fresh-discussed", {
      createdAt: "2026-06-08T10:00:00.000Z",
      upvotes: 2,
      comments: 3,
    })

    // When: the board sorts by hot.
    const sorted = sortLaunchBoardEntries([olderPopular, freshDiscussed], "hot", now)

    // Then: the more active current discussion appears first.
    expect(sorted.map((item) => item.id)).toEqual(["fresh-discussed", "older-popular"])
  })

  it("orders popular launches by upvotes before comments", () => {
    // Given: launch board entries with different vote totals.
    const entries = [
      entry("commented", {
        createdAt: "2026-06-08T10:00:00.000Z",
        upvotes: 1,
        comments: 9,
      }),
      entry("voted", {
        createdAt: "2026-06-08T09:00:00.000Z",
        upvotes: 3,
        comments: 0,
      }),
    ] as const

    // When: the board sorts by popular.
    const sorted = sortLaunchBoardEntries(entries, "popular")

    // Then: vote count wins over comment count.
    expect(sorted.map((item) => item.id)).toEqual(["voted", "commented"])
  })

  it("orders latest launches by publish time", () => {
    // Given: launch board entries with different publish times.
    const entries = [
      entry("old", {
        createdAt: "2026-06-07T10:00:00.000Z",
        upvotes: 10,
        comments: 10,
      }),
      entry("new", {
        createdAt: "2026-06-08T10:00:00.000Z",
        upvotes: 0,
        comments: 0,
      }),
    ] as const

    // When: the board sorts by latest.
    const sorted = sortLaunchBoardEntries(entries, "latest")

    // Then: the newest launch appears first.
    expect(sorted.map((item) => item.id)).toEqual(["new", "old"])
  })
})
