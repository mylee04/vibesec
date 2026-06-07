import type { Grade, Risk, SecurityIssue } from "./types.js"

export const calculateScore = (issues: readonly SecurityIssue[]): number => {
  const totalPenalty = issues.reduce((total, issue) => total + issue.penalty, 0)
  return Math.max(0, 100 - totalPenalty)
}

export const gradeForScore = (score: number): Grade => {
  if (score >= 90) {
    return "A"
  }
  if (score >= 75) {
    return "B"
  }
  if (score >= 60) {
    return "C"
  }
  if (score >= 40) {
    return "D"
  }
  return "F"
}

export const riskForScore = (score: number, issues: readonly SecurityIssue[]): Risk => {
  if (score < 75 || issues.some((issue) => issue.severity === "Dangerous")) {
    return "High"
  }
  if (score < 90 || issues.some((issue) => issue.severity === "Needs attention")) {
    return "Medium"
  }
  return "Low"
}
