import { describe, expect, it } from "bun:test"
import { redisBackendKindFromEnv } from "../src/server/redis-runtime.js"

describe("redis runtime configuration", () => {
  it("uses local Redis when REDIS_URL is configured", () => {
    // Given: the OCI deployment points the app at localhost Redis.
    const environment = {
      REDIS_URL: "redis://127.0.0.1:6379",
      UPSTASH_REDIS_REST_URL: "https://example-upstash.test",
      UPSTASH_REDIS_REST_TOKEN: "placeholder",
    } as const

    // When: the Redis backend is selected.
    const backend = redisBackendKindFromEnv(environment)

    // Then: the server prefers local Redis over managed REST Redis.
    expect(backend).toBe("node-redis")
  })

  it("uses Upstash REST when only REST credentials are configured", () => {
    // Given: a managed Redis deployment provides REST credentials.
    const environment = {
      UPSTASH_REDIS_REST_URL: "https://example-upstash.test",
      UPSTASH_REDIS_REST_TOKEN: "placeholder",
    } as const

    // When: the Redis backend is selected.
    const backend = redisBackendKindFromEnv(environment)

    // Then: the server keeps compatibility with the existing managed Redis path.
    expect(backend).toBe("upstash-rest")
  })

  it("falls back to memory when no Redis configuration is present", () => {
    // Given: no persistent Redis environment variables.
    const environment = {} as const

    // When: the Redis backend is selected.
    const backend = redisBackendKindFromEnv(environment)

    // Then: local development can still run without infrastructure.
    expect(backend).toBe("memory")
  })
})
