import { env } from "node:process"
import { Redis } from "@upstash/redis"
import type { ScanReport } from "../scanner/types.js"
import { ScanReportSchema } from "../scanner/types.js"

type CacheEntry = {
  readonly expiresAt: number
  readonly report: ScanReport
}

type RateWindow = {
  readonly resetAt: number
  readonly count: number
}

export type RateLimitResult =
  | { readonly kind: "allowed" }
  | { readonly kind: "limited"; readonly retryAfterSeconds: number }

export type ScanLease = {
  readonly release: () => Promise<void> | void
}

export type ScanGuard = {
  readonly getCachedReport: (cacheKey: string) => Promise<ScanReport | undefined>
  readonly storeCachedReport: (cacheKey: string, report: ScanReport) => Promise<void>
  readonly consumeRateLimit: (clientKey: string) => Promise<RateLimitResult>
  readonly tryAcquireScan: () => Promise<ScanLease | undefined>
}

export type ScanGuardOptions = {
  readonly cacheTtlMs?: number
  readonly windowMs?: number
  readonly maxRequestsPerWindow?: number
  readonly maxConcurrentScans?: number
  readonly nowMs?: () => number
}

const defaultCacheTtlMs = 15 * 60 * 1000
const defaultWindowMs = 60 * 1000
const defaultMaxRequestsPerWindow = 12
const defaultMaxConcurrentScans = 8

const cacheKeyFor = (scanUrl: string): string => `scan-cache:${scanUrl}`

const rateLimitKeyFor = (clientKey: string): string => `scan-rate:${clientKey}`

const activeScansKey = "scan-active-count"

export const createInMemoryScanGuard = (options: ScanGuardOptions = {}): ScanGuard => {
  const cacheTtlMs = options.cacheTtlMs ?? defaultCacheTtlMs
  const windowMs = options.windowMs ?? defaultWindowMs
  const maxRequestsPerWindow = options.maxRequestsPerWindow ?? defaultMaxRequestsPerWindow
  const maxConcurrentScans = options.maxConcurrentScans ?? defaultMaxConcurrentScans
  const nowMs = options.nowMs ?? Date.now
  const cache = new Map<string, CacheEntry>()
  const rateWindows = new Map<string, RateWindow>()
  let activeScans = 0

  return {
    async getCachedReport(cacheKey) {
      const entry = cache.get(cacheKey)
      if (entry === undefined) {
        return undefined
      }
      if (entry.expiresAt <= nowMs()) {
        cache.delete(cacheKey)
        return undefined
      }
      return entry.report
    },
    async storeCachedReport(cacheKey, report) {
      if (cacheTtlMs <= 0) {
        return
      }
      cache.set(cacheKey, { expiresAt: nowMs() + cacheTtlMs, report })
    },
    async consumeRateLimit(clientKey) {
      const now = nowMs()
      const existing = rateWindows.get(clientKey)
      if (existing === undefined || existing.resetAt <= now) {
        rateWindows.set(clientKey, { count: 1, resetAt: now + windowMs })
        return { kind: "allowed" }
      }
      if (existing.count >= maxRequestsPerWindow) {
        return {
          kind: "limited",
          retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
        }
      }
      rateWindows.set(clientKey, { count: existing.count + 1, resetAt: existing.resetAt })
      return { kind: "allowed" }
    },
    async tryAcquireScan() {
      if (activeScans >= maxConcurrentScans) {
        return undefined
      }
      activeScans += 1
      let released = false
      return {
        release() {
          if (released) {
            return
          }
          released = true
          activeScans = Math.max(0, activeScans - 1)
        },
      }
    },
  }
}

export const createRedisScanGuard = (redis: Redis, options: ScanGuardOptions = {}): ScanGuard => {
  const cacheTtlMs = options.cacheTtlMs ?? defaultCacheTtlMs
  const windowMs = options.windowMs ?? defaultWindowMs
  const maxRequestsPerWindow = options.maxRequestsPerWindow ?? defaultMaxRequestsPerWindow
  const maxConcurrentScans = options.maxConcurrentScans ?? defaultMaxConcurrentScans

  return {
    async getCachedReport(cacheKey) {
      const payload = await redis.get<unknown>(cacheKeyFor(cacheKey))
      const parsed = ScanReportSchema.safeParse(payload)
      return parsed.success ? parsed.data : undefined
    },
    async storeCachedReport(cacheKey, report) {
      if (cacheTtlMs <= 0) {
        return
      }
      await redis.set(cacheKeyFor(cacheKey), report, { ex: Math.ceil(cacheTtlMs / 1000) })
    },
    async consumeRateLimit(clientKey) {
      const key = rateLimitKeyFor(clientKey)
      const count = await redis.incr(key)
      if (count === 1) {
        await redis.expire(key, Math.ceil(windowMs / 1000))
      }
      if (count <= maxRequestsPerWindow) {
        return { kind: "allowed" }
      }
      const ttl = await redis.ttl(key)
      return {
        kind: "limited",
        retryAfterSeconds: Math.max(1, ttl > 0 ? ttl : Math.ceil(windowMs / 1000)),
      }
    },
    async tryAcquireScan() {
      const activeCount = await redis.incr(activeScansKey)
      await redis.expire(activeScansKey, 60)
      if (activeCount > maxConcurrentScans) {
        await redis.decr(activeScansKey)
        return undefined
      }
      let released = false
      return {
        async release() {
          if (released) {
            return
          }
          released = true
          await redis.decr(activeScansKey)
        },
      }
    },
  }
}

const redisFromEnv = (): Redis | undefined => {
  const url = env["UPSTASH_REDIS_REST_URL"] ?? env["KV_REST_API_URL"]
  const token = env["UPSTASH_REDIS_REST_TOKEN"] ?? env["KV_REST_API_TOKEN"]
  if (url === undefined || token === undefined) {
    return undefined
  }
  return new Redis({ url, token })
}

export const createConfiguredScanGuard = (): ScanGuard => {
  const redis = redisFromEnv()
  if (redis !== undefined) {
    return createRedisScanGuard(redis)
  }
  return createInMemoryScanGuard()
}
