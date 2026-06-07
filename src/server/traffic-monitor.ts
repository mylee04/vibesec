import { env } from "node:process"
import ky from "ky"

export type TrafficEvent = "scan_completed" | "rate_limited" | "scanner_busy"

export type TrafficMonitorOptions = {
  readonly webhookUrl?: string
  readonly scanThresholdPerMinute?: number
  readonly rateLimitThresholdPerMinute?: number
  readonly busyThresholdPerMinute?: number
  readonly cooldownMs?: number
  readonly nowMs?: () => number
}

type CounterWindow = {
  readonly resetAt: number
  readonly count: number
}

const defaultWindowMs = 60 * 1000
const defaultCooldownMs = 15 * 60 * 1000

const thresholdFor = (
  event: TrafficEvent,
  options: Required<
    Pick<
      TrafficMonitorOptions,
      "busyThresholdPerMinute" | "rateLimitThresholdPerMinute" | "scanThresholdPerMinute"
    >
  >,
): number => {
  switch (event) {
    case "scan_completed":
      return options.scanThresholdPerMinute
    case "rate_limited":
      return options.rateLimitThresholdPerMinute
    case "scanner_busy":
      return options.busyThresholdPerMinute
  }
}

export type TrafficMonitor = {
  readonly record: (event: TrafficEvent, detail: Record<string, unknown>) => Promise<void>
}

export const createTrafficMonitor = (options: TrafficMonitorOptions = {}): TrafficMonitor => {
  const webhookUrl = options.webhookUrl
  const scanThresholdPerMinute = options.scanThresholdPerMinute ?? 120
  const rateLimitThresholdPerMinute = options.rateLimitThresholdPerMinute ?? 20
  const busyThresholdPerMinute = options.busyThresholdPerMinute ?? 5
  const cooldownMs = options.cooldownMs ?? defaultCooldownMs
  const nowMs = options.nowMs ?? Date.now
  const counters = new Map<TrafficEvent, CounterWindow>()
  const lastAlertAt = new Map<TrafficEvent, number>()

  return {
    async record(event, detail) {
      const now = nowMs()
      const existing = counters.get(event)
      const nextWindow =
        existing === undefined || existing.resetAt <= now
          ? { count: 1, resetAt: now + defaultWindowMs }
          : { count: existing.count + 1, resetAt: existing.resetAt }
      counters.set(event, nextWindow)
      const threshold = thresholdFor(event, {
        scanThresholdPerMinute,
        rateLimitThresholdPerMinute,
        busyThresholdPerMinute,
      })
      const previousAlertAt = lastAlertAt.get(event) ?? 0
      if (nextWindow.count < threshold || now - previousAlertAt < cooldownMs) {
        return
      }
      lastAlertAt.set(event, now)
      const payload = {
        text: `VibeSec alert: ${event}`,
        event,
        count: nextWindow.count,
        windowSeconds: Math.ceil(defaultWindowMs / 1000),
        detail,
      }
      console.warn(JSON.stringify({ level: "warn", message: "traffic_alert", ...payload }))
      if (webhookUrl === undefined) {
        return
      }
      await ky
        .post(webhookUrl, { json: payload, timeout: 3000, retry: 0 })
        .catch((error: unknown) => {
          if (error instanceof Error) {
            console.error(
              JSON.stringify({
                level: "error",
                message: "traffic_alert_webhook_failed",
                error: error.message,
              }),
            )
            return
          }
          throw error
        })
    },
  }
}

export const createConfiguredTrafficMonitor = (): TrafficMonitor => {
  const webhookUrl = env["VIBESEC_ALERT_WEBHOOK_URL"]
  const scanThreshold = env["VIBESEC_ALERT_SCAN_THRESHOLD_PER_MINUTE"]
  const rateLimitThreshold = env["VIBESEC_ALERT_RATE_LIMIT_THRESHOLD_PER_MINUTE"]
  const busyThreshold = env["VIBESEC_ALERT_BUSY_THRESHOLD_PER_MINUTE"]
  const options = {
    ...(webhookUrl === undefined ? {} : { webhookUrl }),
    ...(scanThreshold === undefined ? {} : { scanThresholdPerMinute: Number(scanThreshold) }),
    ...(rateLimitThreshold === undefined
      ? {}
      : { rateLimitThresholdPerMinute: Number(rateLimitThreshold) }),
    ...(busyThreshold === undefined ? {} : { busyThresholdPerMinute: Number(busyThreshold) }),
  } satisfies TrafficMonitorOptions
  return createTrafficMonitor(options)
}
