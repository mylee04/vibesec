import { randomUUID } from "node:crypto"
import { z } from "zod"
import type { ShowcaseComment, ShowcaseEntry } from "../showcase/types.js"
import { createConfiguredShowcaseStore, type ShowcaseStore } from "./showcase-store.js"

export type ShowcaseHttpStatus = 200 | 201 | 400 | 404 | 502

export type ShowcaseHttpResult = {
  readonly status: ShowcaseHttpStatus
  readonly body: unknown
}

export type ShowcaseHandlerOptions = {
  readonly store?: ShowcaseStore
}

const defaultStore = createConfiguredShowcaseStore()

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

const publicEntryFrom = (input: z.infer<typeof ShowcaseRequestSchema>): ShowcaseEntry => {
  const createdAt = new Date().toISOString()
  return {
    id: idFor(input.appName, input.appUrl),
    appName: input.appName,
    appUrl: input.appUrl,
    tagline: input.tagline,
    category: input.category,
    stack: input.stack,
    score: 0,
    grade: "Post",
    risk: "Community",
    upvotes: 0,
    comments: [],
    createdAt,
    lastScannedAt: createdAt,
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
  const store = options.store ?? defaultStore
  const entry = publicEntryFrom(parsed.data)
  await store.saveEntry(entry)
  return { status: 201, body: { entry } }
}

export const upvoteShowcaseEntry = async (
  payload: unknown,
  store: ShowcaseStore = defaultStore,
): Promise<ShowcaseHttpResult> => {
  const parsed = ShowcaseUpvoteRequestSchema.safeParse(payload)
  if (!parsed.success) {
    return { status: 400, body: { error: { code: "invalid_showcase_upvote" } } }
  }
  const entry = await store.upvoteEntry(parsed.data.entryId)
  if (entry === undefined) {
    return { status: 404, body: { error: { code: "showcase_entry_not_found" } } }
  }
  return { status: 200, body: { entry } }
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
