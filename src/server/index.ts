import { join } from "node:path"
import { createApp } from "./app.js"
import { attachStaticRoutes } from "./static.js"

const app = createApp()
const clientRoot = join(import.meta.dir, "../../dist/client")
attachStaticRoutes(app, clientRoot)

const port = Number(Bun.env["PORT"] ?? "4173")
const hostname = Bun.env["HOST"] ?? "127.0.0.1"

Bun.serve({
  hostname,
  port,
  fetch: app.fetch,
})

console.info(`VibeSec listening on http://${hostname}:${port}`)
