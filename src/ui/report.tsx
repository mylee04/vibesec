import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  ClipboardCheck,
  ClipboardList,
  Code2,
  FileWarning,
  Shield,
} from "lucide-react"
import { useState } from "react"
import type { ReportViewModel } from "../reporting/view-model.js"
import type { ScanReport, SecurityIssue } from "../scanner/types.js"
import type { UiCopy } from "./i18n.js"
import { riskLabel, scanSummary, severityLabel } from "./i18n.js"
import { fixNoteFor, issueTextFor } from "./report-text.js"
import { ShowcasePublish } from "./showcase-publish.js"

const severityOrder: readonly SecurityIssue["severity"][] = [
  "Dangerous",
  "Needs attention",
  "Nice to fix",
  "Passed",
]

type ReportProps = {
  readonly report: ScanReport
  readonly model: ReportViewModel
  readonly labels: UiCopy
}

const issueIconFor = (severity: SecurityIssue["severity"]) => {
  switch (severity) {
    case "Dangerous":
      return AlertTriangle
    case "Needs attention":
      return FileWarning
    case "Nice to fix":
      return ClipboardList
    case "Passed":
      return CheckCircle2
  }
}

const formatScanTime = (value: string, labels: UiCopy): string => {
  const date = new Date(value)
  return new Intl.DateTimeFormat(labels.dateLocale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

export const Report = ({ report, model, labels }: ReportProps) => (
  <section className="report-grid" aria-live="polite">
    <ScorePanel report={report} model={model} labels={labels} />
    <IssuesPanel model={model} labels={labels} />
    <ChecklistPanel labels={labels} />
    <ShowcasePublish report={report} labels={labels} />
    <FixesPanel model={model} labels={labels} />
  </section>
)

const ScorePanel = ({ report, model, labels }: ReportProps) => (
  <div className="score-panel">
    <div className="panel-heading">
      <Shield size={19} aria-hidden="true" />
      <span>{labels.report.securityScore}</span>
    </div>
    <div className="score-row">
      <div className="score">{model.scoreLabel}</div>
      <div className="grade-badge">{report.grade}</div>
    </div>
    <div className={`risk risk-${report.risk.toLowerCase()}`}>{riskLabel(report.risk, labels)}</div>
    <p>{scanSummary(model.issueCounts, labels)}</p>
    <dl className="report-meta">
      <div>
        <dt>{labels.report.target}</dt>
        <dd>{report.targetUrl}</dd>
      </div>
      <div>
        <dt>{labels.report.scanned}</dt>
        <dd>{formatScanTime(report.scannedAt, labels)}</dd>
      </div>
      <div>
        <dt>{labels.report.detected}</dt>
        <dd>
          {report.detected.length > 0 ? report.detected.join(", ") : labels.report.noFingerprint}
        </dd>
      </div>
    </dl>
  </div>
)

const IssuesPanel = ({
  model,
  labels,
}: {
  readonly model: ReportViewModel
  readonly labels: UiCopy
}) => (
  <div className="issues-panel">
    <div className="panel-heading">
      <FileWarning size={19} aria-hidden="true" />
      <span>{labels.report.findings}</span>
    </div>
    <div className="issue-counts">
      <span>
        {model.issueCounts.dangerous} {labels.report.counts.dangerous}
      </span>
      <span>
        {model.issueCounts.needsAttention} {labels.report.counts.needsAttention}
      </span>
      <span>
        {model.issueCounts.niceToFix} {labels.report.counts.niceToFix}
      </span>
    </div>
    {severityOrder.map((severity) => {
      const Icon = issueIconFor(severity)
      return (
        <section className="issue-group" key={severity}>
          <h3>
            <Icon size={16} aria-hidden="true" />
            {severityLabel(severity, labels)}
          </h3>
          <ul>
            {model.groupedIssues[severity].map((issue) => (
              <IssueRow issue={issue} labels={labels} key={issue.id} />
            ))}
            {model.groupedIssues[severity].length === 0 ? (
              <li className="muted">{labels.report.noGroupFindings}</li>
            ) : null}
          </ul>
        </section>
      )
    })}
  </div>
)

const IssueRow = ({
  issue,
  labels,
}: {
  readonly issue: SecurityIssue
  readonly labels: UiCopy
}) => {
  const text = issueTextFor(issue, labels)
  return (
    <li>
      <div className="issue-title-row">
        <span>{text.title}</span>
        <strong>-{issue.penalty}</strong>
      </div>
      <small>{text.evidence}</small>
      <p>{text.recommendation}</p>
    </li>
  )
}

const ChecklistPanel = ({ labels }: { readonly labels: UiCopy }) => (
  <div className="checklist-panel">
    <div className="panel-heading">
      <ClipboardList size={19} aria-hidden="true" />
      <span>{labels.report.checklistTitle}</span>
    </div>
    <ul>
      {labels.report.checklist.map((item) => (
        <li key={item}>
          <CheckCircle2 size={17} aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  </div>
)

const FixesPanel = ({
  model,
  labels,
}: {
  readonly model: ReportViewModel
  readonly labels: UiCopy
}) => {
  const [copiedProvider, setCopiedProvider] = useState<string | undefined>()

  const copyFix = async (provider: string, code: string): Promise<void> => {
    await navigator.clipboard.writeText(code)
    setCopiedProvider(provider)
  }

  return (
    <div className="fix-panel">
      <div className="panel-heading">
        <Code2 size={19} aria-hidden="true" />
        <span>{labels.report.fixesTitle}</span>
      </div>
      {model.fixPanels.map((fix) => {
        const isCopied = copiedProvider === fix.provider
        return (
          <article key={fix.provider} className="fix-card">
            <div className="fix-heading">
              <div>
                <h3>{fix.provider}</h3>
                <p>{fixNoteFor(fix, labels)}</p>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => void copyFix(fix.provider, fix.code)}
              >
                {isCopied ? (
                  <ClipboardCheck size={17} aria-hidden="true" />
                ) : (
                  <Clipboard size={17} aria-hidden="true" />
                )}
                {isCopied ? labels.report.copied : labels.report.copy}
              </button>
            </div>
            <pre>{fix.code}</pre>
          </article>
        )
      })}
    </div>
  )
}
