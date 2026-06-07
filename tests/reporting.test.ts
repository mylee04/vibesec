import { describe, expect, it } from "bun:test"
import { buildReportViewModel } from "../src/reporting/view-model.js"
import type { ScanReport } from "../src/scanner/types.js"

describe("buildReportViewModel", () => {
  it("report view model keeps score top issues checklist and provider fixes visible", () => {
    // Given: a scan result with critical launch risks and provider-specific fixes.
    const report: ScanReport = {
      targetUrl: "https://demo.example",
      scannedAt: "2026-06-06T00:00:00.000Z",
      score: 62,
      grade: "C",
      risk: "High",
      summary: "High risk launch posture",
      issues: [
        {
          id: "wildcard-cors",
          title: "CORS allows every origin",
          severity: "Dangerous",
          evidence: "Access-Control-Allow-Origin: *",
          recommendation: "Restrict CORS to your production origin.",
          penalty: 20,
        },
        {
          id: "missing-csp",
          title: "Missing Content-Security-Policy",
          severity: "Needs attention",
          evidence: "No CSP header found",
          recommendation: "Add a CSP before public launch.",
          penalty: 10,
        },
      ],
      checks: [],
      fixes: [
        {
          provider: "Next.js / Vercel",
          title: "Add launch security headers",
          code: "export const headers = []",
          note: "Apply before launch.",
        },
      ],
      detected: ["Vercel"],
    }

    // When: the UI model is prepared for rendering.
    const model = buildReportViewModel(report)

    // Then: the report preserves the user-facing sections required by the MVP.
    expect(model.scoreLabel).toBe("62 / 100")
    expect(model.topIssues.map((issue) => issue.id)).toEqual(["wildcard-cors", "missing-csp"])
    expect(model.issueCounts).toEqual({
      dangerous: 1,
      needsAttention: 1,
      niceToFix: 0,
      passed: 0,
    })
    expect(model.scanSummary).toBe("2 findings across 2 priority groups")
    expect(model.launchChecklist).toContain("Protect admin and debug routes")
    expect(model.fixPanels.map((fix) => fix.provider)).toContain("Next.js / Vercel")
  })
})
