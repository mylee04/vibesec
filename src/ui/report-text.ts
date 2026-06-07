import type { FixPanel, SecurityIssue } from "../scanner/types.js"
import type { UiCopy } from "./i18n.js"

type IssueText = {
  readonly title: string
  readonly evidence: string
  readonly recommendation: string
}

const providerEvidenceFor = (evidence: string, labels: UiCopy): string => {
  const match = /^Detected (.+) in public responses$/.exec(evidence)
  const providers = match?.[1]
  return providers === undefined
    ? labels.report.issueCopy["provider-hints"].evidence
    : labels.report.providerEvidence(providers)
}

const exposureEvidenceFor = (evidence: string, labels: UiCopy): string => {
  const match = /^(.+) returned HTTP (\d+)$/.exec(evidence)
  const path = match?.[1]
  const status = match?.[2]
  return path === undefined || status === undefined
    ? evidence
    : labels.report.exposureEvidence(path, status)
}

export const issueTextFor = (issue: SecurityIssue, labels: UiCopy): IssueText => {
  switch (issue.id) {
    case "cookie-missing-secure":
      return labels.report.issueCopy["cookie-missing-secure"]
    case "cookie-missing-httponly":
      return labels.report.issueCopy["cookie-missing-httponly"]
    case "cookie-missing-samesite":
      return labels.report.issueCopy["cookie-missing-samesite"]
    case "missing-csp":
      return labels.report.issueCopy["missing-csp"]
    case "missing-hsts":
      return labels.report.issueCopy["missing-hsts"]
    case "wildcard-cors":
      return labels.report.issueCopy["wildcard-cors"]
    case "missing-frame-policy":
      return labels.report.issueCopy["missing-frame-policy"]
    case "missing-referrer-policy":
      return labels.report.issueCopy["missing-referrer-policy"]
    case "missing-permissions-policy":
      return labels.report.issueCopy["missing-permissions-policy"]
    case "public-env":
      return {
        ...labels.report.issueCopy["public-env"],
        evidence: exposureEvidenceFor(issue.evidence, labels),
      }
    case "public-git-config":
      return {
        ...labels.report.issueCopy["public-git-config"],
        evidence: exposureEvidenceFor(issue.evidence, labels),
      }
    case "public-sourcemap":
      return {
        ...labels.report.issueCopy["public-sourcemap"],
        evidence: exposureEvidenceFor(issue.evidence, labels),
      }
    case "robots-sensitive-routes":
      return {
        ...labels.report.issueCopy["robots-sensitive-routes"],
        evidence: exposureEvidenceFor(issue.evidence, labels),
      }
    case "sitemap-sensitive-routes":
      return {
        ...labels.report.issueCopy["sitemap-sensitive-routes"],
        evidence: exposureEvidenceFor(issue.evidence, labels),
      }
    case "provider-hints":
      return {
        ...labels.report.issueCopy["provider-hints"],
        evidence: providerEvidenceFor(issue.evidence, labels),
      }
    default:
      return {
        title: issue.title,
        evidence: issue.evidence,
        recommendation: issue.recommendation,
      }
  }
}

export const fixNoteFor = (fix: FixPanel, labels: UiCopy): string => {
  switch (fix.provider) {
    case "Next.js / Vercel":
      return labels.report.fixNotes.next
    case "Supabase":
      return fix.note.startsWith("Supabase patterns")
        ? labels.report.fixNotes.supabaseDetected
        : labels.report.fixNotes.supabaseDefault
    case "Firebase":
      return labels.report.fixNotes.firebase
    case "AI API":
      return labels.report.fixNotes.aiApi
    default:
      return fix.note
  }
}
