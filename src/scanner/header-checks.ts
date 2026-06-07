import type { PassiveResponse } from "./http.js"
import type { SecurityIssue } from "./types.js"

const hasFrameProtection = (headers: Headers): boolean => {
  const csp = headers.get("content-security-policy") ?? ""
  return headers.has("x-frame-options") || csp.toLowerCase().includes("frame-ancestors")
}

const cookieIssues = (headers: Headers): readonly SecurityIssue[] => {
  const cookie = headers.get("set-cookie")
  if (cookie === null) {
    return []
  }
  const lower = cookie.toLowerCase()
  const issues: SecurityIssue[] = []

  if (!lower.includes("secure")) {
    issues.push({
      id: "cookie-missing-secure",
      title: "Cookie lacks Secure",
      severity: "Dangerous",
      evidence: "Set-Cookie header lacks Secure",
      recommendation: "Set Secure on session and auth cookies before launch.",
      penalty: 10,
    })
  }
  if (!lower.includes("httponly")) {
    issues.push({
      id: "cookie-missing-httponly",
      title: "Cookie lacks HttpOnly",
      severity: "Needs attention",
      evidence: "Set-Cookie header lacks HttpOnly",
      recommendation: "Set HttpOnly on cookies that do not need browser JavaScript access.",
      penalty: 8,
    })
  }
  if (!lower.includes("samesite")) {
    issues.push({
      id: "cookie-missing-samesite",
      title: "Cookie lacks SameSite",
      severity: "Needs attention",
      evidence: "Set-Cookie header lacks SameSite",
      recommendation: "Set SameSite=Lax or SameSite=Strict for session cookies.",
      penalty: 8,
    })
  }
  return issues
}

export const checkResponseHeaders = (
  response: PassiveResponse,
  scannedUrl: URL,
): readonly SecurityIssue[] => {
  const headers = response.headers
  const issues: SecurityIssue[] = []

  if (!headers.has("content-security-policy")) {
    issues.push({
      id: "missing-csp",
      title: "Missing Content-Security-Policy",
      severity: "Needs attention",
      evidence: "Content-Security-Policy header missing",
      recommendation: "Add a CSP header before public launch.",
      penalty: 10,
    })
  }
  if (scannedUrl.protocol === "https:" && !headers.has("strict-transport-security")) {
    issues.push({
      id: "missing-hsts",
      title: "Missing HSTS",
      severity: "Needs attention",
      evidence: "Strict-Transport-Security header missing",
      recommendation: "Add HSTS after confirming every subdomain supports HTTPS.",
      penalty: 10,
    })
  }
  if (headers.get("access-control-allow-origin") === "*") {
    issues.push({
      id: "wildcard-cors",
      title: "CORS allows every origin",
      severity: "Dangerous",
      evidence: "Access-Control-Allow-Origin: *",
      recommendation: "Replace wildcard CORS with a small allowlist of production origins.",
      penalty: 20,
    })
  }
  if (!hasFrameProtection(headers)) {
    issues.push({
      id: "missing-frame-policy",
      title: "Missing frame protection",
      severity: "Needs attention",
      evidence: "No X-Frame-Options or CSP frame-ancestors detected",
      recommendation: "Set CSP frame-ancestors or X-Frame-Options for sensitive pages.",
      penalty: 5,
    })
  }
  if (!headers.has("referrer-policy")) {
    issues.push({
      id: "missing-referrer-policy",
      title: "Missing Referrer-Policy",
      severity: "Nice to fix",
      evidence: "Referrer-Policy header missing",
      recommendation: "Set Referrer-Policy to strict-origin-when-cross-origin or stricter.",
      penalty: 5,
    })
  }
  if (!headers.has("permissions-policy")) {
    issues.push({
      id: "missing-permissions-policy",
      title: "Missing Permissions-Policy",
      severity: "Nice to fix",
      evidence: "Permissions-Policy header missing",
      recommendation: "Disable unused browser capabilities with a Permissions-Policy header.",
      penalty: 3,
    })
  }
  return [...issues, ...cookieIssues(headers)]
}
