import { describe, expect, it } from "bun:test"
import { mkdtemp } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Hono } from "hono"
import { attachStaticRoutes } from "../src/server/static.js"

describe("attachStaticRoutes", () => {
  it("serves web app icon assets with browser-friendly content types", async () => {
    // Given: a built client directory with favicon and manifest assets.
    const clientRoot = await mkdtemp(join(tmpdir(), "vibesec-static-"))
    await Bun.write(join(clientRoot, "index.html"), "<html></html>")
    await Bun.write(join(clientRoot, "favicon.svg"), "<svg></svg>")
    await Bun.write(join(clientRoot, "site.webmanifest"), "{}")
    const app = new Hono()
    attachStaticRoutes(app, clientRoot)

    // When: the browser asks for the tab icon and manifest.
    const faviconResponse = await app.request("/favicon.svg")
    const manifestResponse = await app.request("/site.webmanifest")

    // Then: both assets have explicit content types.
    expect(faviconResponse.headers.get("content-type")).toBe("image/svg+xml")
    expect(manifestResponse.headers.get("content-type")).toBe("application/manifest+json")
  })
})
