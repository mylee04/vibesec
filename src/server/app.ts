import { randomUUID } from "node:crypto"
import { type Context, Hono } from "hono"
import { getCookie, setCookie } from "hono/cookie"
import { scanTarget } from "../scanner/scan.js"
import { clientKeyFromHeaderValues, handleScanPayload, type Scanner } from "./scan-handler.js"
import {
  addShowcaseComment,
  createShowcaseEntry,
  listShowcaseEntries,
  upvoteShowcaseEntry,
} from "./showcase-handler.js"
import type { ShowcaseStore } from "./showcase-store.js"

type AppOptions = {
  readonly scanner?: Scanner
  readonly showcaseStore?: ShowcaseStore
}

const voteVisitorCookieName = "vibesec_vote_visitor"
const visitorIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu
const oneYearSeconds = 60 * 60 * 24 * 365

const isScanner = (value: Scanner | AppOptions): value is Scanner => "scanTarget" in value

const visitorIdFrom = (context: Context): string => {
  const existing = getCookie(context, voteVisitorCookieName)
  if (existing !== undefined && visitorIdPattern.test(existing)) {
    return existing
  }
  const visitorId = randomUUID()
  setCookie(context, voteVisitorCookieName, visitorId, {
    httpOnly: true,
    maxAge: oneYearSeconds,
    path: "/",
    sameSite: "Lax",
    secure: new URL(context.req.url).protocol === "https:",
  })
  return visitorId
}

export const createApp = (input: Scanner | AppOptions = {}): Hono => {
  const scanner = isScanner(input) ? input : (input.scanner ?? { scanTarget })
  const showcaseStore = isScanner(input) ? undefined : input.showcaseStore
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

  app.get("/api/showcase", async (context) => {
    const result =
      showcaseStore === undefined
        ? await listShowcaseEntries()
        : await listShowcaseEntries(showcaseStore)
    return context.json(result.body, result.status)
  })

  app.post("/api/showcase", async (context) => {
    const payload = await context.req.json().catch((error: unknown) => {
      if (error instanceof Error) {
        return undefined
      }
      throw error
    })
    const result =
      showcaseStore === undefined
        ? await createShowcaseEntry(payload)
        : await createShowcaseEntry(payload, { store: showcaseStore, scanner })
    return context.json(result.body, result.status)
  })

  app.post("/api/showcase-upvote", async (context) => {
    const payload = await context.req.json().catch((error: unknown) => {
      if (error instanceof Error) {
        return undefined
      }
      throw error
    })
    const result = await upvoteShowcaseEntry(payload, {
      ...(showcaseStore === undefined ? {} : { store: showcaseStore }),
      visitorId: visitorIdFrom(context),
    })
    return context.json(result.body, result.status)
  })

  app.post("/api/showcase-comment", async (context) => {
    const payload = await context.req.json().catch((error: unknown) => {
      if (error instanceof Error) {
        return undefined
      }
      throw error
    })
    const result =
      showcaseStore === undefined
        ? await addShowcaseComment(payload)
        : await addShowcaseComment(payload, showcaseStore)
    return context.json(result.body, result.status)
  })

  return app
}
