import { afterEach, describe, expect, it } from "bun:test"
import { passiveGet } from "../src/scanner/http.js"
import { assertSafeTarget } from "../src/scanner/safety.js"

const servers: Bun.Server<undefined>[] = []

const startServer = (handler: (request: Request) => Promise<Response> | Response): string => {
  const server = Bun.serve({
    port: 0,
    fetch: handler,
  })
  servers.push(server)
  return `http://127.0.0.1:${server.port}`
}

const expectBlocked = async (promise: Promise<unknown>): Promise<void> => {
  try {
    await promise
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    if (error instanceof Error) {
      expect(error.message).toContain("blocked")
      return
    }
    throw error
  }
  throw new Error("expected target to be blocked")
}

const expectResolutionFailure = async (promise: Promise<unknown>): Promise<void> => {
  try {
    await promise
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    if (error instanceof Error) {
      expect(error.name).toBe("ScanTargetResolutionError")
      return
    }
    throw error
  }
  throw new Error("expected target resolution to fail")
}

afterEach(() => {
  for (const server of servers.splice(0)) {
    server.stop(true)
  }
  delete Bun.env["VIBESEC_ALLOW_PRIVATE_TARGETS"]
})

describe("scanner safety", () => {
  it("blocks hostnames that resolve to loopback addresses", async () => {
    // Given: a public-looking hostname that resolves to a loopback IP.
    const target = new URL("https://public-looking.example")

    // When/Then: the safety gate blocks the resolved private address.
    await expectBlocked(
      assertSafeTarget(target, {
        resolveHostname: async () => ["127.0.0.1"],
      }),
    )
  })

  it("blocks IPv6 local and link-local targets", async () => {
    // Given: local IPv6 target forms.
    const loopback = new URL("http://[::1]/")
    const linkLocal = new URL("http://[fe80::1]/")

    // When/Then: both forms are blocked by default.
    await expectBlocked(assertSafeTarget(loopback))
    await expectBlocked(assertSafeTarget(linkLocal))
  })

  it("blocks unspecified and IPv4-mapped private IPv6 targets", async () => {
    // Given: reserved IPv6 target forms.
    const unspecified = new URL("http://[::]/")
    const mappedPrivate = new URL("http://[::ffff:192.168.1.1]/")

    // When/Then: both forms are blocked as private or reserved targets.
    await expectBlocked(assertSafeTarget(unspecified))
    await expectBlocked(assertSafeTarget(mappedPrivate))
  })

  it("allows hostnames beginning with fc when DNS resolves to a public address", async () => {
    // Given: a normal hostname whose label begins with fc but resolves publicly.
    const target = new URL("https://fc-example.test")

    // When/Then: classification uses resolved IPs, not hostname prefixes.
    await assertSafeTarget(target, {
      resolveHostname: async () => ["93.184.216.34"],
    })
  })

  it("returns a typed resolution failure for unresolvable hostnames", async () => {
    // Given: a hostname resolver that cannot resolve the target.
    const target = new URL("https://missing.example")

    // When/Then: the safety gate emits a typed expected scan failure.
    await expectResolutionFailure(
      assertSafeTarget(target, {
        resolveHostname: async () => {
          throw new Error("lookup failed")
        },
      }),
    )
  })

  it("caps response bodies during passive fetches", async () => {
    // Given: a local fixture that returns a large response body.
    Bun.env["VIBESEC_ALLOW_PRIVATE_TARGETS"] = "1"
    const baseUrl = startServer(() => new Response("x".repeat(1024)))

    // When: the passive fetch uses a small body limit.
    const response = await passiveGet(new URL(baseUrl), { maxBodyBytes: 32 })

    // Then: only the bounded body is retained.
    expect(response.body.length).toBe(32)
  })

  it("allows a modestly slow launch page within the default timeout", async () => {
    // Given: a deployed app fixture that responds just after the old 2.5s cutoff.
    Bun.env["VIBESEC_ALLOW_PRIVATE_TARGETS"] = "1"
    const baseUrl = startServer(async () => {
      await Bun.sleep(2600)
      return new Response("ok")
    })

    // When: the passive fetch uses its default timeout budget.
    const response = await passiveGet(new URL(baseUrl))

    // Then: the scan treats the slow-but-normal page as reachable.
    expect(response.status).toBe(200)
  })

  it("blocks redirects to metadata targets before following them", async () => {
    // Given: a safe local fixture that redirects to a metadata endpoint.
    Bun.env["VIBESEC_ALLOW_PRIVATE_TARGETS"] = "1"
    const baseUrl = startServer(
      () =>
        new Response("", {
          status: 302,
          headers: { Location: "http://169.254.169.254/latest/meta-data" },
        }),
    )

    // When/Then: the passive fetch refuses the unsafe redirect target.
    await expectBlocked(passiveGet(new URL(baseUrl)))
  })
})
