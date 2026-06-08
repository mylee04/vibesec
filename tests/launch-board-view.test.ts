import { describe, expect, it } from "bun:test"
import type { ShowcaseEntry } from "../src/showcase/types.js"
import { buildLaunchBoardPage } from "../src/ui/launch-board-view.js"

const entry = (index: number, input: Partial<ShowcaseEntry> = {}): ShowcaseEntry => ({
  id: `entry-${index}`,
  appName: `Launch ${index}`,
  appUrl: `https://launch-${index}.example/`,
  tagline: "A launch board service.",
  category: "AI Tools",
  stack: ["Vercel"],
  score: 90,
  grade: "A",
  risk: "Low",
  upvotes: 0,
  comments: [],
  createdAt: `2026-06-08T12:${String(index).padStart(2, "0")}:00.000Z`,
  lastScannedAt: "2026-06-08T12:00:00.000Z",
  ...input,
})

describe("buildLaunchBoardPage", () => {
  it("returns 25 entries by default and keeps page counts explicit", () => {
    // Given: more than one default page of launch board entries.
    const entries = Array.from({ length: 30 }, (_, index) => entry(index))

    // When: the board builds its first page with default controls.
    const page = buildLaunchBoardPage(entries, { page: 1, pageSize: 25, query: "" })

    // Then: only the first 25 rows are shown and navigation metadata is available.
    expect(page.entries).toHaveLength(25)
    expect(page.totalEntries).toBe(30)
    expect(page.totalPages).toBe(2)
    expect(page.page).toBe(1)
  })

  it("supports 50 and 100 row page sizes", () => {
    // Given: a larger launch board.
    const entries = Array.from({ length: 80 }, (_, index) => entry(index))

    // When: users choose larger page sizes.
    const page50 = buildLaunchBoardPage(entries, { page: 1, pageSize: 50, query: "" })
    const page100 = buildLaunchBoardPage(entries, { page: 1, pageSize: 100, query: "" })

    // Then: the selected page size controls the visible rows.
    expect(page50.entries).toHaveLength(50)
    expect(page100.entries).toHaveLength(80)
  })

  it("filters by title category stack and domain", () => {
    // Given: entries with searchable launch metadata.
    const entries = [
      entry(1, {
        appName: "PromptDesk",
        appUrl: "https://promptdesk.example/",
        category: "AI Tools",
        stack: ["OpenAI"],
      }),
      entry(2, {
        appName: "ShopKit",
        appUrl: "https://shopkit.example/",
        category: "E-commerce",
        stack: ["Stripe"],
      }),
    ] as const

    // When: the user searches by a stack term.
    const page = buildLaunchBoardPage(entries, { page: 1, pageSize: 25, query: "stripe" })

    // Then: only matching entries remain.
    expect(page.entries.map((item) => item.id)).toEqual(["entry-2"])
    expect(page.totalEntries).toBe(1)
  })
})
