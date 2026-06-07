import { z } from "zod"
import { UnsafeTargetError } from "../scanner/safety.js"
import { ScanFailedError, scanTarget } from "../scanner/scan.js"
import type { ScanReport, ScanTargetInput } from "../scanner/types.js"
import { createConfiguredScanGuard, type ScanGuard } from "./traffic-guard.js"
import { createConfiguredTrafficMonitor, type TrafficMonitor } from "./traffic-monitor.js"

export type Scanner = {
  readonly scanTarget: (input: ScanTargetInput) => Promise<ScanReport> | ScanReport
}

export type ScanHttpStatus = 200 | 400 | 403 | 405 | 429 | 502 | 503

export type ScanHttpResult = {
  readonly status: ScanHttpStatus
  readonly body: unknown
}

const ScanRequestSchema = z.object({
  url: z.url().refine((value) => {
    if (!URL.canParse(value)) {
      return false
    }
    const parsed = new URL(value)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  }),
})

const invalidUrlResponse = {
  error: {
    code: "invalid_url",
    message: "Enter a valid http:// or https:// URL.",
  },
}

const defaultScanGuard = createConfiguredScanGuard()
const defaultTrafficMonitor = createConfiguredTrafficMonitor()

export type ScanHandlerOptions = {
  readonly scanner?: Scanner
  readonly guard?: ScanGuard
  readonly monitor?: TrafficMonitor
  readonly clientKey?: string
}

const normalizedScanUrl = (url: string): string => new URL(url).toString()

export const clientKeyFromHeaderValues = (
  values: readonly (readonly string[] | string | null | undefined)[],
): string => {
  for (const value of values) {
    const headerValue = Array.isArray(value) ? value[0] : value
    const firstValue = headerValue?.split(",")[0]?.trim()
    if (firstValue !== undefined && firstValue.length > 0) {
      return firstValue
    }
  }
  return "anonymous"
}

export const handleScanPayload = async (
  payload: unknown,
  options: ScanHandlerOptions | Scanner = {},
): Promise<ScanHttpResult> => {
  const scanner = "scanTarget" in options ? options : (options.scanner ?? { scanTarget })
  const guard = "scanTarget" in options ? defaultScanGuard : (options.guard ?? defaultScanGuard)
  const monitor =
    "scanTarget" in options ? defaultTrafficMonitor : (options.monitor ?? defaultTrafficMonitor)
  const clientKey = "scanTarget" in options ? "anonymous" : (options.clientKey ?? "anonymous")
  const parsed = ScanRequestSchema.safeParse(payload)
  if (!parsed.success) {
    return { status: 400, body: invalidUrlResponse }
  }
  const cacheKey = normalizedScanUrl(parsed.data.url)
  const cachedReport = await guard.getCachedReport(cacheKey)
  if (cachedReport !== undefined) {
    return { status: 200, body: cachedReport }
  }
  const rateLimit = await guard.consumeRateLimit(clientKey)
  if (rateLimit.kind === "limited") {
    await monitor.record("rate_limited", { cacheKey, clientKey })
    return {
      status: 429,
      body: {
        error: {
          code: "rate_limited",
          message: "Too many scan requests. Try again shortly.",
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
      },
    }
  }
  const lease = await guard.tryAcquireScan()
  if (lease === undefined) {
    await monitor.record("scanner_busy", { cacheKey, clientKey })
    return {
      status: 503,
      body: {
        error: {
          code: "scanner_busy",
          message: "Scanner is busy. Try again shortly.",
        },
      },
    }
  }
  try {
    const report = await scanner.scanTarget({ url: parsed.data.url })
    await guard.storeCachedReport(cacheKey, report)
    await monitor.record("scan_completed", { cacheKey, clientKey, score: report.score })
    return { status: 200, body: report }
  } catch (error) {
    if (error instanceof UnsafeTargetError) {
      return { status: 403, body: { error: { code: error.code, message: error.message } } }
    }
    if (error instanceof ScanFailedError) {
      return { status: 502, body: { error: { code: error.code, message: error.message } } }
    }
    throw error
  } finally {
    await lease.release()
  }
}
