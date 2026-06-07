import { afterEach, describe, expect, it } from "bun:test"
import { scanTarget } from "../src/scanner/scan.js"

const fixtureServers: Bun.Server<undefined>[] = []

function startRiskyTarget(): string {
  const server = Bun.serve({
    port: 43191,
    fetch(request) {
      const url = new URL(request.url)
      if (url.pathname === "/.env") {
        return new Response("OPENAI_API_KEY=sk-test\nSUPABASE_SERVICE_ROLE_KEY=secret", {
          headers: { "Content-Type": "text/plain" },
        })
      }
      if (url.pathname === "/robots.txt") {
        return new Response("User-agent: *\nDisallow: /admin\nDisallow: /debug")
      }
      if (url.pathname === "/app.js.map") {
        return new Response('{"version":3,"sources":["src/App.tsx"]}', {
          headers: { "Content-Type": "application/json" },
        })
      }
      return new Response("<html><script src='/app.js'></script></html>", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Set-Cookie": "session=abc; Path=/",
        },
      })
    },
  })
  fixtureServers.push(server)
  return `http://127.0.0.1:${server.port}`
}

afterEach(() => {
  for (const server of fixtureServers.splice(0)) {
    server.stop(true)
  }
  delete Bun.env["VIBESEC_ALLOW_PRIVATE_TARGETS"]
})

describe("scanTarget", () => {
  it("scanner reports public launch risks when a target exposes insecure headers and files", async () => {
    // Given: a deployed app fixture with weak headers and publicly exposed launch files.
    Bun.env["VIBESEC_ALLOW_PRIVATE_TARGETS"] = "1"
    const targetUrl = startRiskyTarget()

    // When: the passive scanner evaluates the target URL.
    const report = await scanTarget({ url: targetUrl })

    // Then: the score and issues reflect the observable launch risks.
    expect(report.score).toBeLessThan(80)
    expect(report.grade).toBe("F")
    expect(report.issues.map((issue) => issue.id)).toContain("missing-csp")
    expect(report.issues.map((issue) => issue.id)).toContain("wildcard-cors")
    expect(report.issues.map((issue) => issue.id)).toContain("public-env")
    expect(report.fixes.map((fix) => fix.provider)).toContain("Next.js / Vercel")
  })
})
