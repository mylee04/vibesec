import { join } from "node:path"
import type { Hono } from "hono"

const mimeTypes: Readonly<Record<string, string>> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
}

const contentTypeFor = (path: string): string => {
  for (const [extension, mimeType] of Object.entries(mimeTypes)) {
    if (path.endsWith(extension)) {
      return mimeType
    }
  }
  return "application/octet-stream"
}

export const attachStaticRoutes = (app: Hono, clientRoot: string): void => {
  app.get("*", async (context) => {
    const requestUrl = new URL(context.req.url)
    const requestedPath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname
    const filePath = join(clientRoot, requestedPath)
    const file = Bun.file(filePath)
    if (await file.exists()) {
      return new Response(file, { headers: { "Content-Type": contentTypeFor(filePath) } })
    }
    const indexFile = Bun.file(join(clientRoot, "index.html"))
    return new Response(indexFile, { headers: { "Content-Type": "text/html; charset=utf-8" } })
  })
}
