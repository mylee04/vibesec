import type { ScanReport } from "../scanner/types.js"
import type { UiCopy } from "./i18n.js"
import { fixNoteFor, issueTextFor } from "./report-text.js"

const codeFenceFor = (code: string): string => code.replaceAll("```", "`\u200b``")

export const buildAgentRepairPrompt = (report: ScanReport, labels: UiCopy): string => {
  const detected =
    report.detected.length > 0 ? report.detected.join(", ") : labels.report.noFingerprint
  const findings = report.issues
    .filter((issue) => issue.severity !== "Passed")
    .map((issue, index) => {
      const text = issueTextFor(issue, labels)
      return [
        `${index + 1}. [${issue.severity}] ${text.title} (-${issue.penalty})`,
        `   Evidence: ${text.evidence}`,
        `   Fix guidance: ${text.recommendation}`,
      ].join("\n")
    })
  const fixes = report.fixes.map((fix) =>
    [
      `## ${fix.provider}: ${fix.title}`,
      fixNoteFor(fix, labels),
      "```ts",
      codeFenceFor(fix.code),
      "```",
    ].join("\n"),
  )
  const checklist = labels.report.checklist.map((item) => `- ${item}`)

  return [
    "You are helping fix launch security issues from a VibeSec scan.",
    "Inspect the existing codebase first, preserve current behavior, and make the smallest production-ready changes.",
    "Do not expose, print, or commit secrets.",
    "",
    "# Scan summary",
    `Target: ${report.targetUrl}`,
    `Scanned at: ${report.scannedAt}`,
    `Score: ${report.score}/100 (${report.grade})`,
    `Risk: ${report.risk}`,
    `Detected stack/providers: ${detected}`,
    "",
    "# Findings to fix",
    findings.length > 0 ? findings.join("\n\n") : labels.report.noBlocking,
    "",
    "# Suggested implementation snippets",
    fixes.length > 0 ? fixes.join("\n\n") : "No provider-specific snippet was generated.",
    "",
    "# Launch checklist",
    checklist.join("\n"),
    "",
    "# Verification request",
    "After making changes, run the relevant lint, typecheck, tests, and build commands. Summarize what changed and any remaining risk.",
  ].join("\n")
}
