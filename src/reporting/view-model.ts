import type { FixPanel, ScanReport, SecurityIssue } from "../scanner/types.js"

export type ReportViewModel = {
  readonly scoreLabel: string
  readonly riskLabel: string
  readonly topIssues: readonly SecurityIssue[]
  readonly groupedIssues: Readonly<Record<SecurityIssue["severity"], readonly SecurityIssue[]>>
  readonly issueCounts: {
    readonly dangerous: number
    readonly needsAttention: number
    readonly niceToFix: number
    readonly passed: number
  }
  readonly scanSummary: string
  readonly launchChecklist: readonly string[]
  readonly fixPanels: readonly FixPanel[]
}

const scanSummaryFor = (groupedIssues: ReportViewModel["groupedIssues"]): string => {
  const issueCount =
    groupedIssues.Dangerous.length +
    groupedIssues["Needs attention"].length +
    groupedIssues["Nice to fix"].length
  const priorityGroupCount = [
    groupedIssues.Dangerous,
    groupedIssues["Needs attention"],
    groupedIssues["Nice to fix"],
  ].filter((issues) => issues.length > 0).length

  if (issueCount === 0) {
    return "No launch-blocking findings"
  }
  return `${issueCount} findings across ${priorityGroupCount} priority groups`
}

export const buildReportViewModel = (report: ScanReport): ReportViewModel => {
  const groupedIssues: Readonly<Record<SecurityIssue["severity"], readonly SecurityIssue[]>> = {
    Dangerous: report.issues.filter((issue) => issue.severity === "Dangerous"),
    "Needs attention": report.issues.filter((issue) => issue.severity === "Needs attention"),
    "Nice to fix": report.issues.filter((issue) => issue.severity === "Nice to fix"),
    Passed: report.issues.filter((issue) => issue.severity === "Passed"),
  }

  return {
    scoreLabel: `${report.score} / 100`,
    riskLabel: `${report.risk} Risk`,
    topIssues: report.issues.slice(0, 5),
    groupedIssues,
    issueCounts: {
      dangerous: groupedIssues.Dangerous.length,
      needsAttention: groupedIssues["Needs attention"].length,
      niceToFix: groupedIssues["Nice to fix"].length,
      passed: groupedIssues.Passed.length,
    },
    scanSummary: scanSummaryFor(groupedIssues),
    launchChecklist: [
      "Hide private environment variables",
      "Protect admin and debug routes",
      "Disable public source maps unless intentionally published",
      "Enable Supabase RLS or equivalent data access controls",
      "Rate limit AI, auth, upload, and webhook endpoints",
    ],
    fixPanels: report.fixes,
  }
}
