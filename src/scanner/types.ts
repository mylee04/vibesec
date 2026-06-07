import { z } from "zod"

export const IssueSeveritySchema = z.enum(["Dangerous", "Needs attention", "Nice to fix", "Passed"])

export const RiskSchema = z.enum(["Low", "Medium", "High"])
export const GradeSchema = z.enum(["A", "B", "C", "D", "F"])

export const SecurityIssueSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: IssueSeveritySchema,
  evidence: z.string(),
  recommendation: z.string(),
  penalty: z.number().int().min(0),
})

export const ScanCheckSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(["pass", "fail", "warning"]),
  detail: z.string(),
})

export const FixPanelSchema = z.object({
  provider: z.string(),
  title: z.string(),
  code: z.string(),
  note: z.string(),
})

export const ScanReportSchema = z.object({
  targetUrl: z.string(),
  scannedAt: z.string(),
  score: z.number().int().min(0).max(100),
  grade: GradeSchema,
  risk: RiskSchema,
  summary: z.string(),
  issues: z.array(SecurityIssueSchema),
  checks: z.array(ScanCheckSchema),
  fixes: z.array(FixPanelSchema),
  detected: z.array(z.string()),
})

export type IssueSeverity = z.infer<typeof IssueSeveritySchema>
export type Risk = z.infer<typeof RiskSchema>
export type Grade = z.infer<typeof GradeSchema>

export type SecurityIssue = {
  readonly id: string
  readonly title: string
  readonly severity: IssueSeverity
  readonly evidence: string
  readonly recommendation: string
  readonly penalty: number
}

export type ScanCheck = {
  readonly id: string
  readonly title: string
  readonly status: "pass" | "fail" | "warning"
  readonly detail: string
}

export type FixPanel = {
  readonly provider: string
  readonly title: string
  readonly code: string
  readonly note: string
}

export type ScanReport = {
  readonly targetUrl: string
  readonly scannedAt: string
  readonly score: number
  readonly grade: Grade
  readonly risk: Risk
  readonly summary: string
  readonly issues: readonly SecurityIssue[]
  readonly checks: readonly ScanCheck[]
  readonly fixes: readonly FixPanel[]
  readonly detected: readonly string[]
}

export type ScanTargetInput = {
  readonly url: string
}
