import { env } from "node:process"
import { Redis } from "@upstash/redis"
import { type ShowcaseEntry, ShowcaseEntryListSchema } from "../showcase/types.js"

export type ShowcaseStore = {
  readonly listEntries: () => Promise<readonly ShowcaseEntry[]>
  readonly saveEntry: (entry: ShowcaseEntry) => Promise<void>
}

const redisKey = "showcase:entries"

const sortEntries = (entries: readonly ShowcaseEntry[]): readonly ShowcaseEntry[] =>
  [...entries].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score
    }
    return right.createdAt.localeCompare(left.createdAt)
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
