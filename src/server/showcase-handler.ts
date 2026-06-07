import { env } from "node:process"
import { z } from "zod"
import { scanTarget } from "../scanner/scan.js"
import type { ScanReport } from "../scanner/types.js"
import type { ShowcaseEntry } from "../showcase/types.js"
import { createConfiguredShowcaseStore, type ShowcaseStore } from "./showcase-store.js"

export type ShowcaseHttpStatus = 200 | 201 | 400 | 402 | 422 | 502

export type ShowcaseHttpResult = {
  readonly status: ShowcaseHttpStatus
  readonly body: unknown
}

type ShowcaseScanner = {
  readonly scanTarget: (input: { readonly url: string }) => Promise<ScanReport> | ScanReport
}

export type ShowcaseHandlerOptions = {
  readonly store?: ShowcaseStore
  readonly scanner?: ShowcaseScanner
  readonly accessCode?: string
}

const defaultStore = createConfiguredShowcaseStore()

const ShowcaseRequestSchema = z.object({
  appName: z.string().trim().min(2).max(80),
  appUrl: z.url(),
  tagline: z.string().trim().min(8).max(160),
  category: z.string().trim().min(2).max(40),
  stack: z.array(z.string().trim().min(1).max(32)).max(8),
  accessCode: z.string().trim().optional(),
})

const slugFor = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 54)

const idFor = (appName: string, appUrl: string): string => {
  const hostname = new URL(appUrl).hostname.replace(/^www\./, "")
  return `${slugFor(appName)}-${slugFor(hostname)}`.slice(0, 80)
}

const requiredAccessCode = (): string | undefined => env["VIBESEC_SHOWCASE_ACCESS_CODE"]

const publicEntryFrom = (
  input: z.infer<typeof ShowcaseRequestSchema>,
  report: ScanReport,
): ShowcaseEntry => ({
  id: idFor(input.appName, report.targetUrl),
  appName: input.appName,
  appUrl: report.targetUrl,
  tagline: input.tagline,
  category: input.category,
  stack: input.stack,
  score: report.score,
  grade: report.grade,
  risk: report.risk,
  createdAt: new Date().toISOString(),
  lastScannedAt: report.scannedAt,
})

export const listShowcaseEntries = async (
  store: ShowcaseStore = defaultStore,
): Promise<ShowcaseHttpResult> => ({
  status: 200,
  body: { entries: await store.listEntries() },
})

export const createShowcaseEntry = async (
  payload: unknown,
  options: ShowcaseHandlerOptions = {},
): Promise<ShowcaseHttpResult> => {
  const parsed = ShowcaseRequestSchema.safeParse(payload)
  if (!parsed.success) {
    return { status: 400, body: { error: { code: "invalid_showcase_entry" } } }
  }
  const expectedAccessCode = options.accessCode ?? requiredAccessCode()
  if (expectedAccessCode !== undefined && parsed.data.accessCode !== expectedAccessCode) {
    return {
      status: 402,
      body: { error: { code: "showcase_access_required", message: "Showcase access required." } },
    }
  }
  const scanner = options.scanner ?? { scanTarget }
  const store = options.store ?? defaultStore
  const report = await scanner.scanTarget({ url: parsed.data.appUrl })
  if (report.score < 75) {
    return {
      status: 422,
      body: {
        error: {
          code: "score_too_low",
          message: "Only apps scoring B or higher can be published to the showcase.",
        },
      },
    }
  }
  const entry = publicEntryFrom(parsed.data, report)
  await store.saveEntry(entry)
  return { status: 201, body: { entry } }
}
