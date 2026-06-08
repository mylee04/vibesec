import { describe, expect, it } from "bun:test"
import { riskForScore } from "../src/scanner/score.js"
import type { SecurityIssue } from "../src/scanner/types.js"

const issue = (severity: SecurityIssue["severity"], penalty: number): SecurityIssue => ({
  id: `${severity}-${penalty}`,
  title: severity,
  severity,
  evidence: "test evidence",
  recommendation: "test recommendation",
  penalty,
})

describe("riskForScore", () => {
  it("keeps A grade scans low risk when they have no dangerous findings", () => {
    // Given: a 90 point scan with a single non-dangerous launch finding.
    const issues = [issue("Needs attention", 10)]

    // When: risk is calculated from the score and issue severities.
    const risk = riskForScore(90, issues)

    // Then: the risk matches the quantitative score band instead of overreacting.
    expect(risk).toBe("Low")
  })

  it("marks B grade scans as medium risk", () => {
    // Given: a scan in the 75-89 score band.
    const issues = [issue("Needs attention", 10), issue("Nice to fix", 5)]

    // When: risk is calculated.
    const risk = riskForScore(85, issues)

    // Then: the scan is medium risk.
    expect(risk).toBe("Medium")
  })

  it("marks low scores or dangerous findings as high risk", () => {
    // Given: one scan below 75 and one scan with a dangerous issue.
    const lowScoreIssues = [issue("Needs attention", 30)]
    const dangerousIssues = [issue("Dangerous", 20)]

    // When: risk is calculated for both cases.
    const lowScoreRisk = riskForScore(70, lowScoreIssues)
    const dangerousRisk = riskForScore(95, dangerousIssues)

    // Then: either condition produces high risk.
    expect(lowScoreRisk).toBe("High")
    expect(dangerousRisk).toBe("High")
  })
})
