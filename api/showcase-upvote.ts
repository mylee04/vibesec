import { upvoteShowcaseEntry } from "../src/server/showcase-handler.js"

export const config = {
  maxDuration: 10,
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
  if (request.method !== "POST") {
    response.status(405).json({
      error: {
        code: "method_not_allowed",
        message: "Use POST /api/showcase-upvote.",
      },
    })
    return
  }
  const result = await upvoteShowcaseEntry(request.body)
  response.status(result.status).json(result.body)
}
