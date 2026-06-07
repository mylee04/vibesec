import { Hono } from "hono"
import { scanTarget } from "../scanner/scan.js"
import { clientKeyFromHeaderValues, handleScanPayload, type Scanner } from "./scan-handler.js"

export const createApp = (scanner: Scanner = { scanTarget }): Hono => {
  const app = new Hono()

  app.post("/api/scan", async (context) => {
    const payload = await context.req.json().catch((error: unknown) => {
      if (error instanceof Error) {
        return undefined
      }
      throw error
    })
    const result = await handleScanPayload(payload, {
      scanner,
      clientKey: clientKeyFromHeaderValues([
        context.req.header("x-forwarded-for"),
        context.req.header("x-real-ip"),
      ]),
    })
    return context.json(result.body, result.status)
  })

  return app
}
