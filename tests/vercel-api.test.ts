import { describe, expect, it } from "bun:test"
import handler from "../api/scan.js"

type CapturedResponse = {
  readonly statusCode: number
  readonly body: unknown
}

type FakeVercelResponse = {
  readonly status: (statusCode: number) => FakeVercelResponse
  readonly json: (body: unknown) => void
}

const createResponse = (): {
  readonly response: FakeVercelResponse
  readonly captured: () => CapturedResponse
} => {
  let statusCode = 200
  let body: unknown
  const response = {
    status(nextStatusCode: number) {
      statusCode = nextStatusCode
      return response
    },
    json(nextBody: unknown) {
      body = nextBody
    },
  }
  return {
    response,
    captured: () => ({ statusCode, body }),
  }
}

describe("vercel scan api", () => {
  it("returns a node api response for invalid scan payloads", async () => {
    // Given: Vercel invokes the function with its Node API request and response objects.
    const { response, captured } = createResponse()

    // When: the request body is not a valid scan target.
    await handler({ method: "POST", body: { url: "not-a-url" } }, response)

    // Then: the handler writes the expected JSON response instead of returning a web Response.
    expect(captured()).toEqual({
      statusCode: 400,
      body: {
        error: {
          code: "invalid_url",
          message: "Enter a valid http:// or https:// URL.",
        },
      },
    })
  })
})
