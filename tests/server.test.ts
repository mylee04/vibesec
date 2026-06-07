import { describe, expect, it } from "bun:test"
import { ScanFailedError } from "../src/scanner/scan.js"
import { createApp } from "../src/server/app.js"

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
        message: "Enter a valid http:// or https:// URL.",
      },
    })
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
})
