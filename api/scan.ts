import { clientKeyFromHeaderValues, handleScanPayload } from "../src/server/scan-handler.js"

export const config = {
  maxDuration: 30,
}

type VercelRequest = {
  readonly method?: string
  readonly body?: unknown
  readonly headers?: Readonly<Record<string, readonly string[] | string | undefined>>
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
        message: "Use POST /api/scan.",
      },
    })
    return
  }
  const result = await handleScanPayload(request.body, {
    clientKey: clientKeyFromHeaderValues([
      request.headers?.["x-forwarded-for"],
      request.headers?.["x-real-ip"],
      request.headers?.["x-vercel-forwarded-for"],
    ]),
  })
  response.status(result.status).json(result.body)
}
