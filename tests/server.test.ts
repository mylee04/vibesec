import { describe, expect, it } from "bun:test"
import { ScanFailedError } from "../src/scanner/scan.js"
import type { ScanReport } from "../src/scanner/types.js"
import { createApp } from "../src/server/app.js"
import { createMemoryShowcaseStore } from "../src/server/showcase-store.js"

describe("createApp", () => {
  it("api rejects malformed scan urls without starting a scan", async () => {
    // Given: an app with a scanner that would fail the test if invoked.
    const app = createApp({
      scanTarget: () => {
        throw new Error("scanner should not be called for invalid URLs")
      },
    })

    // When: a malformed URL is submitted to the API.
    const response = await app.request("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "not-a-url" }),
    })

    // Then: the API rejects it at the boundary with the public error contract.
    expect(response.status).toBe(400)
    const payload = await response.json()
    expect(payload).toEqual({
      error: {
        code: "invalid_url",
        message: "Enter a valid domain or http:// / https:// URL.",
      },
    })
  })

  it("api normalizes schemeless domains before scanning", async () => {
    // Given: an app scanner that records the URL it receives.
    let scannedUrl: string | undefined
    const report: ScanReport = {
      targetUrl: "https://bymyleslee.com/",
      scannedAt: "2026-06-07T00:00:00.000Z",
      score: 100,
      grade: "A",
      risk: "Low",
      summary: "ok",
      issues: [],
      checks: [],
      fixes: [],
      detected: [],
    }
    const app = createApp({
      scanTarget: ({ url }) => {
        scannedUrl = url
        return report
      },
    })

    // When: a user submits a normal domain without typing the scheme.
    const response = await app.request("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "bymyleslee.com" }),
    })

    // Then: the API scans the HTTPS URL instead of rejecting the request.
    expect(response.status).toBe(200)
    expect(scannedUrl).toBe("https://bymyleslee.com/")
    const payload = await response.json()
    expect(payload).toEqual(report)
  })

  it("api returns scan_failed for expected scanner failures", async () => {
    // Given: an app scanner that reports an expected network scan failure.
    const app = createApp({
      scanTarget: () => {
        throw new ScanFailedError("lookup failed")
      },
    })

    // When: a valid URL reaches the scanner and the scanner cannot complete.
    const response = await app.request("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://missing.example" }),
    })

    // Then: the API returns a stable non-500 scan failure envelope.
    expect(response.status).toBe(502)
    const payload = await response.json()
    expect(payload).toEqual({
      error: {
        code: "scan_failed",
        message: "lookup failed",
      },
    })
  })

  it("api counts one showcase upvote per visitor cookie", async () => {
    // Given: a launch board entry published through the API.
    const store = createMemoryShowcaseStore()
    const app = createApp({
      showcaseStore: store,
      scanner: {
        scanTarget: () => ({
          targetUrl: "https://vote.example/",
          scannedAt: "2026-06-08T00:00:00.000Z",
          score: 94,
          grade: "A",
          risk: "Low",
          summary: "ok",
          issues: [],
          checks: [],
          fixes: [],
          detected: [],
        }),
      },
    })
    await app.request("/api/showcase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appName: "Vote App",
        appUrl: "vote.example",
        tagline: "A useful launch board test entry for duplicate voting.",
        category: "AI Tools",
        stack: [],
      }),
    })

    // When: the same visitor cookie upvotes the same entry twice.
    const firstResponse = await app.request("/api/showcase-upvote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryId: "vote-app-vote-example" }),
    })
    const visitorCookie = firstResponse.headers.get("set-cookie")?.split(";")[0]
    const secondResponse = await app.request("/api/showcase-upvote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: visitorCookie ?? "",
      },
      body: JSON.stringify({ entryId: "vote-app-vote-example" }),
    })

    // Then: only the first request changes the public counter.
    expect(visitorCookie).toStartWith("vibesec_vote_visitor=")
    expect(firstResponse.status).toBe(200)
    expect(secondResponse.status).toBe(200)
    const payload = await secondResponse.json()
    expect(payload).toMatchObject({
      entry: {
        id: "vote-app-vote-example",
        upvotes: 1,
      },
    })
  })
})
