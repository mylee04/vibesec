import { type PassiveResponse, passiveGet } from "./http.js"
import type { SecurityIssue } from "./types.js"

type ExposureRule = {
  readonly path: string
  readonly id: string
  readonly title: string
  readonly severity: SecurityIssue["severity"]
  readonly recommendation: string
  readonly penalty: number
  readonly match: (response: PassiveResponse) => boolean
}

const includesSensitiveRoute = (body: string): boolean => {
  const lower = body.toLowerCase()
  return ["/admin", "/debug", "/staging", "/dev"].some((path) => lower.includes(path))
}

const exposureRules: readonly ExposureRule[] = [
  {
    path: "/.env",
    id: "public-env",
    title: "Public .env file is reachable",
    severity: "Dangerous",
    recommendation: "Remove the file from public hosting and rotate exposed secrets immediately.",
    penalty: 40,
    match: (response) =>
      response.status === 200 && /API_KEY|SECRET|TOKEN|PASSWORD/i.test(response.body),
  },
  {
    path: "/.git/config",
    id: "public-git-config",
    title: "Public .git/config is reachable",
    severity: "Dangerous",
    recommendation: "Block dotfiles at the edge and redeploy without the repository directory.",
    penalty: 35,
    match: (response) => response.status === 200 && /\[core\]|\[remote /i.test(response.body),
  },
  {
    path: "/app.js.map",
    id: "public-sourcemap",
    title: "Public source map is reachable",
    severity: "Needs attention",
    recommendation:
      "Disable public production source maps or upload them only to your error tracker.",
    penalty: 15,
    match: (response) => response.status === 200 && /"sources"|"mappings"/i.test(response.body),
  },
  {
    path: "/robots.txt",
    id: "robots-sensitive-routes",
    title: "robots.txt reveals sensitive routes",
    severity: "Nice to fix",
    recommendation: "Do not advertise admin, debug, dev, or staging paths in robots.txt.",
    penalty: 3,
    match: (response) => response.status === 200 && includesSensitiveRoute(response.body),
  },
  {
    path: "/sitemap.xml",
    id: "sitemap-sensitive-routes",
    title: "sitemap.xml reveals sensitive routes",
    severity: "Nice to fix",
    recommendation: "Keep private and operational routes out of public sitemaps.",
    penalty: 3,
    match: (response) => response.status === 200 && includesSensitiveRoute(response.body),
  },
]

export const checkPassiveExposures = async (
  targetUrl: URL,
): Promise<{
  readonly issues: readonly SecurityIssue[]
  readonly responses: readonly PassiveResponse[]
}> => {
  const issues: SecurityIssue[] = []
  const responses: PassiveResponse[] = []

  for (const rule of exposureRules) {
    const checkUrl = new URL(rule.path, targetUrl)
    const response = await passiveGet(checkUrl)
    responses.push(response)
    if (rule.match(response)) {
      issues.push({
        id: rule.id,
        title: rule.title,
        severity: rule.severity,
        evidence: `${rule.path} returned HTTP ${response.status}`,
        recommendation: rule.recommendation,
        penalty: rule.penalty,
      })
    }
  }

  return { issues, responses }
}
