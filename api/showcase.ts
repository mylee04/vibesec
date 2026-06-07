import { createShowcaseEntry, listShowcaseEntries } from "../src/server/showcase-handler.js"

export const config = {
  maxDuration: 30,
}

type VercelRequest = {
  readonly method?: string
  readonly body?: unknown
}

type VercelJsonResponse = {
  readonly status: (statusCode: number) => VercelJsonResponse
  readonly json: (body: unknown) => void
}

export default async function handler(
  request: VercelRequest,
  response: VercelJsonResponse,
): Promise<void> {
  if (request.method === "GET") {
    const result = await listShowcaseEntries()
    response.status(result.status).json(result.body)
    return
  }
  if (request.method === "POST") {
    const result = await createShowcaseEntry(request.body)
    response.status(result.status).json(result.body)
    return
  }
  response.status(405).json({
    error: {
      code: "method_not_allowed",
      message: "Use GET or POST /api/showcase.",
    },
  })
}
