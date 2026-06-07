import { describe, expect, it } from "bun:test"
import type { ScanReport } from "../src/scanner/types.js"
import { handleScanPayload } from "../src/server/scan-handler.js"
import { createInMemoryScanGuard } from "../src/server/traffic-guard.js"
import type { TrafficEvent } from "../src/server/traffic-monitor.js"

const reportFor = (targetUrl: string): ScanReport => ({
  targetUrl,
  scannedAt: "2026-06-06T00:00:00.000Z",
  score: 97,
  grade: "A",
  risk: "Low",
  summary: "Baseline launch posture looks healthy",
  issues: [],
  checks: [],
  fixes: [],
  detected: [],
})

describe("scan traffic guard", () => {
  it("records scan completion events for alerting", async () => {
    // Given: a monitor that records traffic events emitted by the scan handler.
    const events: TrafficEvent[] = []
    const monitor = {
      record: async (event: TrafficEvent) => {
        events.push(event)
      },
    }
    const scanner = {
      scanTarget: ({ url }: { readonly url: string }) => reportFor(url),
    }

    // When: a scan completes successfully.
    const result = await handleScanPayload(
      { url: "https://monitored.example" },
      {
        scanner,
        monitor,
        guard: createInMemoryScanGuard({ cacheTtlMs: 0 }),
        clientKey: "monitored-client",
      },
    )

    // Then: the monitor receives the completion event.
    expect(result.status).toBe(200)
    expect(events).toEqual(["scan_completed"])
  })

  it("serves repeated scans for the same URL from cache", async () => {
    // Given: a scan guard with cache enabled and a scanner that records invocations.
    let calls = 0
    const guard = createInMemoryScanGuard({ cacheTtlMs: 60_000 })
    const scanner = {
      scanTarget: () => {
        calls += 1
        return reportFor("https://cached.example/")
      },
    }

    // When: the same URL is submitted twice.
    const first = await handleScanPayload(
      { url: "https://cached.example" },
      { scanner, guard, clientKey: "tester" },
    )
    const second = await handleScanPayload(
      { url: "https://cached.example/" },
      { scanner, guard, clientKey: "tester" },
    )

    // Then: the second response reuses the cached report without running another scan.
    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(calls).toBe(1)
    expect(second.body).toEqual(first.body)
  })

  it("rate limits a client that submits too many scans inside a window", async () => {
    // Given: a guard with a small request allowance.
    const guard = createInMemoryScanGuard({
      maxRequestsPerWindow: 1,
      windowMs: 60_000,
      cacheTtlMs: 0,
    })
    const scanner = {
      scanTarget: ({ url }: { readonly url: string }) => reportFor(url),
    }

    // When: one client submits two uncached scans in the same window.
    const first = await handleScanPayload(
      { url: "https://one.example" },
      { scanner, guard, clientKey: "rate-limited-client" },
    )
    const second = await handleScanPayload(
      { url: "https://two.example" },
      { scanner, guard, clientKey: "rate-limited-client" },
    )

    // Then: the second scan is rejected before the scanner runs.
    expect(first.status).toBe(200)
    expect(second.status).toBe(429)
    expect(second.body).toEqual({
      error: {
        code: "rate_limited",
        message: "Too many scan requests. Try again shortly.",
        retryAfterSeconds: 60,
      },
    })
  })

  it("rejects new scans when the instance is already at its concurrency limit", async () => {
    // Given: a guard that allows only one active scan.
    let finishFirstScan: (() => void) | undefined
    const guard = createInMemoryScanGuard({
      maxConcurrentScans: 1,
      cacheTtlMs: 0,
      maxRequestsPerWindow: 10,
    })
    const scanner = {
      scanTarget: ({ url }: { readonly url: string }) =>
        new Promise<ScanReport>((resolve) => {
          finishFirstScan = () => resolve(reportFor(url))
        }),
    }

    // When: a second scan arrives before the first scan finishes.
    const first = handleScanPayload(
      { url: "https://slow.example" },
      { scanner, guard, clientKey: "first-client" },
    )
    const second = await handleScanPayload(
      { url: "https://busy.example" },
      { scanner, guard, clientKey: "second-client" },
    )
    finishFirstScan?.()

    // Then: the second scan receives a backpressure response.
    expect(second.status).toBe(503)
    expect(second.body).toEqual({
      error: {
        code: "scanner_busy",
        message: "Scanner is busy. Try again shortly.",
      },
    })
    expect((await first).status).toBe(200)
  })
})
