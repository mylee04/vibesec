import ky from "ky"
import { assertSafeTarget, type SafetyOptions } from "./safety.js"

export type PassiveResponse = {
  readonly url: string
  readonly status: number
  readonly headers: Headers
  readonly body: string
}

export type PassiveGetOptions = SafetyOptions & {
  readonly timeoutMs?: number
  readonly maxBodyBytes?: number
  readonly maxRedirects?: number
}

const defaultBodyLimitBytes = 512 * 1024

const readBody = async (response: Response, maxBodyBytes: number): Promise<string> => {
  if (response.body === null) {
    return ""
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let receivedBytes = 0

  while (receivedBytes < maxBodyBytes) {
    const result = await reader.read()
    if (result.done) {
      break
    }
    const remainingBytes = maxBodyBytes - receivedBytes
    const chunk =
      result.value.byteLength > remainingBytes
        ? result.value.slice(0, remainingBytes)
        : result.value
    chunks.push(chunk)
    receivedBytes += chunk.byteLength
    if (result.value.byteLength > remainingBytes) {
      await reader.cancel()
      break
    }
  }

  return new TextDecoder().decode(concatChunks(chunks, receivedBytes))
}

const concatChunks = (chunks: readonly Uint8Array[], totalBytes: number): Uint8Array => {
  const output = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    output.set(chunk, offset)
    offset += chunk.byteLength
  }
  return output
}

export const passiveGet = async (
  url: URL,
  options: PassiveGetOptions = {},
): Promise<PassiveResponse> => {
  const maxRedirects = options.maxRedirects ?? 5
  const timeoutMs = options.timeoutMs ?? 6000
  const maxBodyBytes = options.maxBodyBytes ?? defaultBodyLimitBytes
  let currentUrl = url

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    await assertSafeTarget(currentUrl, options)
    const response = await ky.get(currentUrl, {
      timeout: timeoutMs,
      retry: 0,
      throwHttpErrors: false,
      redirect: "manual",
      headers: {
        "User-Agent": "VibeSec passive launch checker",
      },
    })

    const location = response.headers.get("location")
    if (response.status >= 300 && response.status < 400 && location !== null) {
      currentUrl = new URL(location, currentUrl)
      continue
    }

    return {
      url: response.url,
      status: response.status,
      headers: response.headers,
      body: await readBody(response, maxBodyBytes),
    }
  }

  throw new Error(`Too many redirects while scanning ${url.toString()}`)
}
