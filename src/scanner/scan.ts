import { detectProviderHints, providerIssue } from "./detect.js"
import { checkPassiveExposures } from "./exposure.js"
import { buildFixPanels } from "./fixes.js"
import { checkResponseHeaders } from "./header-checks.js"
import { passiveGet } from "./http.js"
import { assertSafeTarget, ScanTargetResolutionError, UnsafeTargetError } from "./safety.js"
import { calculateScore, gradeForScore, riskForScore } from "./score.js"
import type { ScanReport, ScanTargetInput, SecurityIssue } from "./types.js"

export class ScanFailedError extends Error {
  public readonly code = "scan_failed"

  public constructor(message: string) {
    super(message)
    this.name = "ScanFailedError"
  }
}

const summaryFor = (risk: ScanReport["risk"]): string => {
  switch (risk) {
    case "High":
      return "High risk launch posture"
    case "Medium":
      return "Needs attention before a public launch"
    case "Low":
      return "Baseline launch posture looks healthy"
  }
}

export const scanTarget = async (input: ScanTargetInput): Promise<ScanReport> => {
  try {
    const targetUrl = new URL(input.url)
    await assertSafeTarget(targetUrl)
    const rootResponse = await passiveGet(targetUrl)
    const exposureResult = await checkPassiveExposures(targetUrl)
    const responses = [rootResponse, ...exposureResult.responses]
    const detected = detectProviderHints(responses)
    const providerSignal = providerIssue(detected)
    const issues: SecurityIssue[] = [
      ...checkResponseHeaders(rootResponse, targetUrl),
      ...exposureResult.issues,
    ]

    if (providerSignal !== undefined) {
      issues.push(providerSignal)
    }

    const score = calculateScore(issues)
    const risk = riskForScore(score, issues)

    return {
      targetUrl: targetUrl.toString(),
      scannedAt: new Date().toISOString(),
      score,
      grade: gradeForScore(score),
      risk,
      summary: summaryFor(risk),
      issues,
      checks: [
        {
          id: "passive-only",
          title: "Passive scan only",
          status: "pass",
          detail: "No exploit payloads, credential guessing, or brute-force discovery were used.",
        },
      ],
      fixes: buildFixPanels(detected),
      detected,
    }
  } catch (error) {
    if (error instanceof UnsafeTargetError) {
      throw error
    }
    if (error instanceof ScanTargetResolutionError) {
      throw new ScanFailedError(error.message)
    }
    if (error instanceof Error) {
      throw new ScanFailedError(error.message)
    }
    throw error
  }
}
