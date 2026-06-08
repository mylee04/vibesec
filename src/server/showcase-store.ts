import {
  type ShowcaseComment,
  type ShowcaseEntry,
  ShowcaseEntryListSchema,
} from "../showcase/types.js"
import { createConfiguredRedis, type VibeSecRedis } from "./redis-runtime.js"

export type ShowcaseStore = {
  readonly listEntries: () => Promise<readonly ShowcaseEntry[]>
  readonly saveEntry: (entry: ShowcaseEntry) => Promise<void>
  readonly upvoteEntry: (
    entryId: string,
    visitorId: string,
  ) => Promise<ShowcaseVoteResult | undefined>
  readonly addComment: (
    entryId: string,
    comment: ShowcaseComment,
  ) => Promise<ShowcaseEntry | undefined>
}

export type ShowcaseVoteResult = {
  readonly entry: ShowcaseEntry
  readonly counted: boolean
}

const redisKey = "showcase:entries"
const voteKeySeparator = "\u0000"

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

const memoryVoteKeyFor = (entryId: string, visitorId: string): string =>
  `${entryId}${voteKeySeparator}${visitorId}`

const redisVoteKeyFor = (entryId: string): string => `showcase:votes:${entryId}`

export const createMemoryShowcaseStore = (): ShowcaseStore => {
  const entries = new Map<string, ShowcaseEntry>()
  const votes = new Set<string>()
  return {
    async listEntries() {
      return sortEntries([...entries.values()])
    },
    async saveEntry(entry) {
      entries.set(entry.id, entry)
      for (const voteKey of votes) {
        if (voteKey.startsWith(`${entry.id}${voteKeySeparator}`)) {
          votes.delete(voteKey)
        }
      }
    },
    async upvoteEntry(entryId, visitorId) {
      const entry = entries.get(entryId)
      if (entry === undefined) {
        return undefined
      }
      const voteKey = memoryVoteKeyFor(entryId, visitorId)
      if (votes.has(voteKey)) {
        return { entry, counted: false }
      }
      const nextEntry = upvotedEntry(entry)
      entries.set(entryId, nextEntry)
      votes.add(voteKey)
      return { entry: nextEntry, counted: true }
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

export const createRedisShowcaseStore = (redis: VibeSecRedis): ShowcaseStore => {
  const listEntries = async (): Promise<readonly ShowcaseEntry[]> => {
    const payload = await redis.getJson(redisKey)
    const parsed = ShowcaseEntryListSchema.safeParse(payload)
    return parsed.success ? sortEntries(parsed.data) : []
  }
  return {
    listEntries,
    async saveEntry(entry) {
      const existing = await listEntries()
      const nextEntries = [...existing.filter((item) => item.id !== entry.id), entry]
      await redis.setJson(redisKey, nextEntries)
      await redis.del(redisVoteKeyFor(entry.id))
    },
    async upvoteEntry(entryId, visitorId) {
      const existing = await listEntries()
      const nextEntry = existing.find((entry) => entry.id === entryId)
      if (nextEntry === undefined) {
        return undefined
      }
      const voteKey = redisVoteKeyFor(entryId)
      const voteAdded = await redis.sAdd(voteKey, visitorId)
      if (voteAdded === 0) {
        return { entry: nextEntry, counted: false }
      }
      const updatedEntry = upvotedEntry(nextEntry)
      await redis.setJson(
        redisKey,
        existing.map((entry) => (entry.id === entryId ? updatedEntry : entry)),
      )
      return { entry: updatedEntry, counted: true }
    },
    async addComment(entryId, comment) {
      const existing = await listEntries()
      const nextEntry = existing.find((entry) => entry.id === entryId)
      if (nextEntry === undefined) {
        return undefined
      }
      const updatedEntry = entryWithComment(nextEntry, comment)
      await redis.setJson(
        redisKey,
        existing.map((entry) => (entry.id === entryId ? updatedEntry : entry)),
      )
      return updatedEntry
    },
  }
}

export const createConfiguredShowcaseStore = (): ShowcaseStore => {
  const redis = createConfiguredRedis()
  return redis === undefined ? createMemoryShowcaseStore() : createRedisShowcaseStore(redis)
}
