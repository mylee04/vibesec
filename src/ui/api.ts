import ky, { HTTPError } from "ky"
import { z } from "zod"
import { type ScanReport, ScanReportSchema } from "../scanner/types.js"

const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
})

export class ScanApiError extends Error {
  public readonly code: string

  public constructor(code: string, message: string) {
    super(message)
    this.name = "ScanApiError"
    this.code = code
  }
}

const parseApiError = async (error: HTTPError): Promise<ScanApiError> => {
  const payload = await error.response
    .clone()
    .json()
    .catch((jsonError: unknown) => {
      if (jsonError instanceof Error) {
        return undefined
      }
      throw jsonError
    })
  const parsed = ApiErrorSchema.safeParse(payload)
  if (parsed.success) {
    return new ScanApiError(parsed.data.error.code, parsed.data.error.message)
  }
  return new ScanApiError("request_failed", `Scan failed with HTTP ${error.response.status}.`)
}

export const scanUrl = async (url: string): Promise<ScanReport> => {
  try {
    const payload = await ky
      .post("/api/scan", {
        json: { url },
        timeout: 20_000,
      })
      .json()
    return ScanReportSchema.parse(payload)
  } catch (error) {
    if (error instanceof HTTPError) {
      throw await parseApiError(error)
    }
    throw error
  }
}
