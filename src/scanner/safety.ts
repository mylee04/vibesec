import { lookup } from "node:dns/promises"
import { env } from "node:process"

export class UnsafeTargetError extends Error {
  public readonly code = "unsafe_target"

  public constructor(hostname: string) {
    super(`Private or reserved scan target is blocked: ${hostname}`)
    this.name = "UnsafeTargetError"
  }
}

export class ScanTargetResolutionError extends Error {
  public readonly code = "scan_failed"

  public constructor(hostname: string, cause: Error) {
    super(`Could not resolve scan target ${hostname}: ${cause.message}`)
    this.name = "ScanTargetResolutionError"
  }
}

export type ResolveHostname = (hostname: string) => Promise<readonly string[]>

export type SafetyOptions = {
  readonly resolveHostname?: ResolveHostname
  readonly allowPrivateTargets?: boolean
}

const privateIpv4Patterns: readonly RegExp[] = [
  /^0\./,
  /^10\./,
  /^127\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
]

const defaultResolveHostname: ResolveHostname = async (hostname) => {
  if (isIpAddress(hostname)) {
    return [normalizeAddress(hostname)]
  }
  try {
    const records = await lookup(hostname, { all: true, verbatim: true })
    return records.map((record) => record.address)
  } catch (error) {
    if (error instanceof Error) {
      throw new ScanTargetResolutionError(hostname, error)
    }
    throw error
  }
}

const isIpAddress = (hostname: string): boolean =>
  /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":")

const normalizeAddress = (address: string): string => address.replace(/^\[/, "").replace(/\]$/, "")

const isMetadataOrLinkLocal = (address: string): boolean => {
  const normalized = normalizeAddress(address).toLowerCase()
  return (
    normalized === "169.254.169.254" ||
    normalized.startsWith("169.254.") ||
    normalized.startsWith("fe80:")
  )
}

const ipv4FromMappedIpv6 = (address: string): string | undefined => {
  const normalized = normalizeAddress(address).toLowerCase()
  const dotted = normalized.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (dotted !== null) {
    return dotted[1]
  }
  const hex = normalized.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/)
  if (hex === null) {
    return undefined
  }
  const high = Number.parseInt(hex[1] ?? "", 16)
  const low = Number.parseInt(hex[2] ?? "", 16)
  if (Number.isNaN(high) || Number.isNaN(low)) {
    return undefined
  }
  return `${(high >> 8) & 255}.${high & 255}.${(low >> 8) & 255}.${low & 255}`
}

const isPrivateAddress = (address: string): boolean => {
  const normalized = normalizeAddress(address).toLowerCase()
  const mappedIpv4 = ipv4FromMappedIpv6(normalized)
  if (mappedIpv4 !== undefined) {
    return isPrivateAddress(mappedIpv4)
  }
  if (privateIpv4Patterns.some((pattern) => pattern.test(normalized))) {
    return true
  }
  if (
    normalized === "::" ||
    normalized === "::1" ||
    /^f[cd][0-9a-f]*:/i.test(normalized) ||
    normalized.startsWith("2001:db8:") ||
    normalized.startsWith("ff")
  ) {
    return true
  }
  return false
}

export const assertSafeTarget = async (url: URL, options: SafetyOptions = {}): Promise<void> => {
  const hostname = normalizeAddress(url.hostname.toLowerCase())
  const allowPrivateTargets =
    options.allowPrivateTargets ?? env["VIBESEC_ALLOW_PRIVATE_TARGETS"] === "1"
  const resolver = options.resolveHostname ?? defaultResolveHostname
  let addresses: readonly string[]
  try {
    addresses = hostname === "localhost" ? ["127.0.0.1"] : await resolver(hostname)
  } catch (error) {
    if (error instanceof ScanTargetResolutionError) {
      throw error
    }
    if (error instanceof Error) {
      throw new ScanTargetResolutionError(hostname, error)
    }
    throw error
  }

  for (const address of addresses) {
    if (isMetadataOrLinkLocal(address)) {
      throw new UnsafeTargetError(address)
    }
    if (!allowPrivateTargets && isPrivateAddress(address)) {
      throw new UnsafeTargetError(address)
    }
  }
}
