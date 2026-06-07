import { join } from "node:path"
import { createApp } from "./app.js"
import { attachStaticRoutes } from "./static.js"

const app = createApp()
const clientRoot = join(import.meta.dir, "../../dist/client")
attachStaticRoutes(app, clientRoot)

const port = Number(Bun.env["PORT"] ?? "4173")

Bun.serve({
  port,
  fetch: app.fetch,
})

console.info(`VibeSec listening on http://127.0.0.1:${port}`)
