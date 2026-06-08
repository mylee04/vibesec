import { env } from "node:process"
import { Redis } from "@upstash/redis"
import {
  type ShowcaseComment,
  type ShowcaseEntry,
  ShowcaseEntryListSchema,
} from "../showcase/types.js"

export type ShowcaseStore = {
  readonly listEntries: () => Promise<readonly ShowcaseEntry[]>
  readonly saveEntry: (entry: ShowcaseEntry) => Promise<void>
  readonly upvoteEntry: (entryId: string) => Promise<ShowcaseEntry | undefined>
  readonly addComment: (
    entryId: string,
    comment: ShowcaseComment,
  ) => Promise<ShowcaseEntry | undefined>
}

const redisKey = "showcase:entries"

const sortEntries = (entries: readonly ShowcaseEntry[]): readonly ShowcaseEntry[] =>
  [...entries].sort((left, right) => {
    return right.createdAt.localeCompare(left.createdAt)
  })

const upvotedEntry = (entry: ShowcaseEntry): ShowcaseEntry => ({
  ...entry,
  upvotes: entry.upvotes + 1,
})

const entryWithComment = (entry: ShowcaseEntry, comment: ShowcaseComment): ShowcaseEntry => ({
  ...entry,
  comments: [comment, ...entry.comments],
})

export const createMemoryShowcaseStore = (): ShowcaseStore => {
  const entries = new Map<string, ShowcaseEntry>()
  return {
    async listEntries() {
      return sortEntries([...entries.values()])
    },
    async saveEntry(entry) {
      entries.set(entry.id, entry)
    },
    async upvoteEntry(entryId) {
      const entry = entries.get(entryId)
      if (entry === undefined) {
        return undefined
      }
      const nextEntry = upvotedEntry(entry)
      entries.set(entryId, nextEntry)
      return nextEntry
    },
    async addComment(entryId, comment) {
      const entry = entries.get(entryId)
      if (entry === undefined) {
        return undefined
      }
      const nextEntry = entryWithComment(entry, comment)
      entries.set(entryId, nextEntry)
      return nextEntry
    },
  }
}

export const createRedisShowcaseStore = (redis: Redis): ShowcaseStore => {
  const listEntries = async (): Promise<readonly ShowcaseEntry[]> => {
    const payload = await redis.get<unknown>(redisKey)
    const parsed = ShowcaseEntryListSchema.safeParse(payload)
    return parsed.success ? sortEntries(parsed.data) : []
  }
  return {
    listEntries,
    async saveEntry(entry) {
      const existing = await listEntries()
      const nextEntries = [...existing.filter((item) => item.id !== entry.id), entry]
      await redis.set(redisKey, nextEntries)
    },
    async upvoteEntry(entryId) {
      const existing = await listEntries()
      const nextEntry = existing.find((entry) => entry.id === entryId)
      if (nextEntry === undefined) {
        return undefined
      }
      const updatedEntry = upvotedEntry(nextEntry)
      await redis.set(
        redisKey,
        existing.map((entry) => (entry.id === entryId ? updatedEntry : entry)),
      )
      return updatedEntry
    },
    async addComment(entryId, comment) {
      const existing = await listEntries()
      const nextEntry = existing.find((entry) => entry.id === entryId)
      if (nextEntry === undefined) {
        return undefined
      }
      const updatedEntry = entryWithComment(nextEntry, comment)
      await redis.set(
        redisKey,
        existing.map((entry) => (entry.id === entryId ? updatedEntry : entry)),
      )
      return updatedEntry
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

export const createConfiguredShowcaseStore = (): ShowcaseStore => {
  const redis = redisFromEnv()
  return redis === undefined ? createMemoryShowcaseStore() : createRedisShowcaseStore(redis)
}
