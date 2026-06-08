import { env } from "node:process"
import { Redis as UpstashRedis } from "@upstash/redis"
import { createClient } from "redis"

export type RedisSetOptions = {
  readonly ex?: number
}

export type VibeSecRedis = {
  readonly getJson: (key: string) => Promise<unknown>
  readonly setJson: (key: string, value: unknown, options?: RedisSetOptions) => Promise<void>
  readonly del: (key: string) => Promise<void>
  readonly sAdd: (key: string, value: string) => Promise<number>
  readonly incr: (key: string) => Promise<number>
  readonly decr: (key: string) => Promise<number>
  readonly expire: (key: string, seconds: number) => Promise<void>
  readonly ttl: (key: string) => Promise<number>
}

export type RedisEnvironment = {
  readonly REDIS_URL?: string
  readonly UPSTASH_REDIS_REST_URL?: string
  readonly UPSTASH_REDIS_REST_TOKEN?: string
  readonly KV_REST_API_URL?: string
  readonly KV_REST_API_TOKEN?: string
}

export type RedisBackendKind = "memory" | "node-redis" | "upstash-rest"

type NodeRedisClient = {
  readonly get: (key: string) => Promise<string | null>
  readonly set: (
    key: string,
    value: string,
    options?: {
      readonly EX: number
    },
  ) => Promise<unknown>
  readonly del: (key: string) => Promise<unknown>
  readonly sAdd: (key: string, value: string) => Promise<number>
  readonly incr: (key: string) => Promise<number>
  readonly decr: (key: string) => Promise<number>
  readonly expire: (key: string, seconds: number) => Promise<unknown>
  readonly ttl: (key: string) => Promise<number>
}

const parseJson = (payload: string | null): unknown => {
  if (payload === null) {
    return null
  }
  return JSON.parse(payload)
}

export const redisBackendKindFromEnv = (input: RedisEnvironment): RedisBackendKind => {
  if (input.REDIS_URL !== undefined && input.REDIS_URL.length > 0) {
    return "node-redis"
  }
  const upstashUrl = input.UPSTASH_REDIS_REST_URL ?? input.KV_REST_API_URL
  const upstashToken = input.UPSTASH_REDIS_REST_TOKEN ?? input.KV_REST_API_TOKEN
  return upstashUrl !== undefined && upstashToken !== undefined ? "upstash-rest" : "memory"
}

export const createNodeRedisAdapter = (redisUrl: string): VibeSecRedis => {
  let clientPromise: Promise<NodeRedisClient> | undefined
  const client = async () => {
    if (clientPromise === undefined) {
      clientPromise = createClient({ url: redisUrl })
        .on("error", (error: Error) => {
          console.error(
            JSON.stringify({
              level: "error",
              message: "redis_client_error",
              error: error.message,
            }),
          )
        })
        .connect()
    }
    return clientPromise
  }
  return {
    async getJson(key) {
      return parseJson(await (await client()).get(key))
    },
    async setJson(key, value, options) {
      const payload = JSON.stringify(value)
      if (options?.ex === undefined) {
        await (await client()).set(key, payload)
        return
      }
      await (await client()).set(key, payload, { EX: options.ex })
    },
    async del(key) {
      await (await client()).del(key)
    },
    async sAdd(key, value) {
      return await (await client()).sAdd(key, value)
    },
    async incr(key) {
      return await (await client()).incr(key)
    },
    async decr(key) {
      return await (await client()).decr(key)
    },
    async expire(key, seconds) {
      await (await client()).expire(key, seconds)
    },
    async ttl(key) {
      return await (await client()).ttl(key)
    },
  }
}

const configuredEnvironment = (): RedisEnvironment => {
  const redisUrl = env["REDIS_URL"]
  const upstashUrl = env["UPSTASH_REDIS_REST_URL"]
  const upstashToken = env["UPSTASH_REDIS_REST_TOKEN"]
  const kvUrl = env["KV_REST_API_URL"]
  const kvToken = env["KV_REST_API_TOKEN"]
  return {
    ...(redisUrl === undefined ? {} : { REDIS_URL: redisUrl }),
    ...(upstashUrl === undefined ? {} : { UPSTASH_REDIS_REST_URL: upstashUrl }),
    ...(upstashToken === undefined ? {} : { UPSTASH_REDIS_REST_TOKEN: upstashToken }),
    ...(kvUrl === undefined ? {} : { KV_REST_API_URL: kvUrl }),
    ...(kvToken === undefined ? {} : { KV_REST_API_TOKEN: kvToken }),
  }
}

export const createUpstashRedisAdapter = (redis: UpstashRedis): VibeSecRedis => ({
  async getJson(key) {
    return await redis.get<unknown>(key)
  },
  async setJson(key, value, options) {
    if (options?.ex === undefined) {
      await redis.set(key, value)
      return
    }
    await redis.set(key, value, { ex: options.ex })
  },
  async del(key) {
    await redis.del(key)
  },
  async sAdd(key, value) {
    return await redis.sadd(key, value)
  },
  async incr(key) {
    return await redis.incr(key)
  },
  async decr(key) {
    return await redis.decr(key)
  },
  async expire(key, seconds) {
    await redis.expire(key, seconds)
  },
  async ttl(key) {
    return await redis.ttl(key)
  },
})

export const createConfiguredRedis = (
  input: RedisEnvironment = configuredEnvironment(),
): VibeSecRedis | undefined => {
  const backend = redisBackendKindFromEnv(input)
  switch (backend) {
    case "node-redis":
      return createNodeRedisAdapter(input.REDIS_URL ?? "")
    case "upstash-rest": {
      const url = input.UPSTASH_REDIS_REST_URL ?? input.KV_REST_API_URL
      const token = input.UPSTASH_REDIS_REST_TOKEN ?? input.KV_REST_API_TOKEN
      if (url === undefined || token === undefined) {
        return undefined
      }
      return createUpstashRedisAdapter(new UpstashRedis({ url, token }))
    }
    case "memory":
      return undefined
  }
}
