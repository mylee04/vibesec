import { randomUUID } from "node:crypto"
import { z } from "zod"
import { UnsafeTargetError } from "../scanner/safety.js"
import { ScanFailedError, scanTarget } from "../scanner/scan.js"
import type { ScanReport } from "../scanner/types.js"
import type { ShowcaseComment, ShowcaseEntry } from "../showcase/types.js"
import { createConfiguredShowcaseStore, type ShowcaseStore } from "./showcase-store.js"

export type ShowcaseHttpStatus = 200 | 201 | 400 | 403 | 404 | 502

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
}

export type ShowcaseUpvoteOptions = {
  readonly store?: ShowcaseStore
  readonly visitorId: string
}

const defaultStore = createConfiguredShowcaseStore()

const prohibitedShowcasePatterns: readonly RegExp[] = [
  /\b(?:betting|blackjack|casino|gambling|poker|roulette|slots?|sportsbook|wagering)\b/i,
  /\b(?:adult|escort|erotic|hookup|nude|nsfw|onlyfans|porn|porno|sex|webcam|xxx)\b/i,
  /(?:18\+|바카라|배팅|베팅|카지노|도박|사설토토|성인|섹스|스포츠토토|슬롯|야동|유흥|포커|포르노|홀덤)/i,
  /(?:안마|오피|키스방|룸살롱|룸싸롱)/i,
]

const schemelessDomainPattern =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+(?:[/?#].*)?$/iu

const normalizeShowcaseUrlInput = (value: string): string => {
  const trimmed = value.trim()
  const candidate = URL.canParse(trimmed)
    ? trimmed
    : schemelessDomainPattern.test(trimmed)
      ? `https://${trimmed}`
      : trimmed
  return URL.canParse(candidate) ? new URL(candidate).toString() : candidate
}

const ShowcaseRequestSchema = z.object({
  appName: z.string().trim().min(2).max(80),
  appUrl: z
    .string()
    .transform(normalizeShowcaseUrlInput)
    .refine((value) => {
      if (!URL.canParse(value)) {
        return false
      }
      const parsed = new URL(value)
      return parsed.protocol === "http:" || parsed.protocol === "https:"
    }),
  tagline: z.string().trim().min(8).max(700),
  category: z.string().trim().min(2).max(40),
  stack: z.array(z.string().trim().min(1).max(32)).max(8),
})

const isProhibitedShowcaseInput = (input: z.infer<typeof ShowcaseRequestSchema>): boolean => {
  const hostname = new URL(input.appUrl).hostname
  const searchText = [
    input.appName,
    input.appUrl,
    hostname,
    input.tagline,
    input.category,
    ...input.stack,
  ]
    .join(" ")
    .normalize("NFKC")
  return prohibitedShowcasePatterns.some((pattern) => pattern.test(searchText))
}

const ShowcaseUpvoteRequestSchema = z.object({
  entryId: z.string().trim().min(1).max(120),
})

const ShowcaseCommentRequestSchema = z.object({
  entryId: z.string().trim().min(1).max(120),
  authorName: z.string().trim().min(2).max(40),
  body: z.string().trim().min(2).max(280),
})

const slugFor = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 54)

const idFor = (appName: string, appUrl: string): string => {
  const hostname = new URL(appUrl).hostname.replace(/^www\./, "")
  return `${slugFor(appName)}-${slugFor(hostname)}`.slice(0, 80)
}

const publicEntryFrom = (
  input: z.infer<typeof ShowcaseRequestSchema>,
  report: ScanReport,
): ShowcaseEntry => {
  const createdAt = new Date().toISOString()
  return {
    id: idFor(input.appName, report.targetUrl),
    appName: input.appName,
    appUrl: report.targetUrl,
    tagline: input.tagline,
    category: input.category,
    stack: input.stack,
    score: report.score,
    grade: report.grade,
    risk: report.risk,
    upvotes: 0,
    comments: [],
    createdAt,
    lastScannedAt: report.scannedAt,
  }
}

const commentFrom = (input: z.infer<typeof ShowcaseCommentRequestSchema>): ShowcaseComment => ({
  id: randomUUID(),
  authorName: input.authorName,
  body: input.body,
  createdAt: new Date().toISOString(),
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
  if (isProhibitedShowcaseInput(parsed.data)) {
    return {
      status: 403,
      body: {
        error: {
          code: "prohibited_showcase_content",
          message: "Gambling, adult, and nightlife services cannot be posted.",
        },
      },
    }
  }
  const store = options.store ?? defaultStore
  const scanner = options.scanner ?? { scanTarget }
  let report: ScanReport
  try {
    report = await scanner.scanTarget({ url: parsed.data.appUrl })
  } catch (error) {
    if (error instanceof UnsafeTargetError) {
      return { status: 403, body: { error: { code: error.code, message: error.message } } }
    }
    if (error instanceof ScanFailedError) {
      return { status: 502, body: { error: { code: error.code, message: error.message } } }
    }
    throw error
  }
  const entry = publicEntryFrom(parsed.data, report)
  await store.saveEntry(entry)
  return { status: 201, body: { entry } }
}

export const upvoteShowcaseEntry = async (
  payload: unknown,
  options: ShowcaseUpvoteOptions,
): Promise<ShowcaseHttpResult> => {
  const parsed = ShowcaseUpvoteRequestSchema.safeParse(payload)
  if (!parsed.success) {
    return { status: 400, body: { error: { code: "invalid_showcase_upvote" } } }
  }
  const store = options.store ?? defaultStore
  const result = await store.upvoteEntry(parsed.data.entryId, options.visitorId)
  if (result === undefined) {
    return { status: 404, body: { error: { code: "showcase_entry_not_found" } } }
  }
  return { status: 200, body: { entry: result.entry } }
}

export const addShowcaseComment = async (
  payload: unknown,
  store: ShowcaseStore = defaultStore,
): Promise<ShowcaseHttpResult> => {
  const parsed = ShowcaseCommentRequestSchema.safeParse(payload)
  if (!parsed.success) {
    return { status: 400, body: { error: { code: "invalid_showcase_comment" } } }
  }
  const entry = await store.addComment(parsed.data.entryId, commentFrom(parsed.data))
  if (entry === undefined) {
    return { status: 404, body: { error: { code: "showcase_entry_not_found" } } }
  }
  return { status: 200, body: { entry } }
}
