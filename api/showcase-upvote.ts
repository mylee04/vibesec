import { randomUUID } from "node:crypto"
import { upvoteShowcaseEntry } from "../src/server/showcase-handler.js"

export const config = {
  maxDuration: 10,
}

type VercelRequest = {
  readonly method?: string
  readonly body?: unknown
  readonly headers?: Record<string, string | readonly string[] | undefined>
}

type VercelJsonResponse = {
  readonly status: (statusCode: number) => VercelJsonResponse
  readonly setHeader: (name: string, value: string) => void
  readonly json: (body: unknown) => void
}

const voteVisitorCookieName = "vibesec_vote_visitor"
const visitorIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu
const oneYearSeconds = 60 * 60 * 24 * 365

const cookieHeaderFrom = (request: VercelRequest): string => {
  const cookie = request.headers?.["cookie"]
  if (Array.isArray(cookie)) {
    return cookie.join("; ")
  }
  return typeof cookie === "string" ? cookie : ""
}

const visitorIdFrom = (request: VercelRequest, response: VercelJsonResponse): string => {
  const cookie = cookieHeaderFrom(request)
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${voteVisitorCookieName}=`))
  const existing = cookie?.slice(voteVisitorCookieName.length + 1)
  if (existing !== undefined && visitorIdPattern.test(existing)) {
    return existing
  }
  const visitorId = randomUUID()
  response.setHeader(
    "Set-Cookie",
    `${voteVisitorCookieName}=${visitorId}; Path=/; Max-Age=${oneYearSeconds}; HttpOnly; SameSite=Lax; Secure`,
  )
  return visitorId
}

export default async function handler(
  request: VercelRequest,
  response: VercelJsonResponse,
): Promise<void> {
  if (request.method !== "POST") {
    response.status(405).json({
      error: {
        code: "method_not_allowed",
        message: "Use POST /api/showcase-upvote.",
      },
    })
    return
  }
  const result = await upvoteShowcaseEntry(request.body, {
    visitorId: visitorIdFrom(request, response),
  })
  response.status(result.status).json(result.body)
}
