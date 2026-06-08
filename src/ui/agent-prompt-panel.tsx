import { Clipboard, ClipboardCheck, WandSparkles } from "lucide-react"
import { useMemo, useState } from "react"
import type { ScanReport } from "../scanner/types.js"
import type { UiCopy } from "./i18n.js"
import { buildAgentRepairPrompt } from "./report-prompt.js"

type AgentPromptPanelProps = {
  readonly report: ScanReport
  readonly labels: UiCopy
}

export const AgentPromptPanel = ({ report, labels }: AgentPromptPanelProps) => {
  const [copied, setCopied] = useState(false)
  const prompt = useMemo(() => buildAgentRepairPrompt(report, labels), [report, labels])

  const copyPrompt = async (): Promise<void> => {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
  }

  return (
    <div className="agent-prompt-panel">
      <div className="panel-heading">
        <WandSparkles size={19} aria-hidden="true" />
        <span>{labels.report.agentPromptTitle}</span>
      </div>
      <p>{labels.report.agentPromptDescription}</p>
      <button type="button" onClick={() => void copyPrompt()}>
        {copied ? (
          <ClipboardCheck size={17} aria-hidden="true" />
        ) : (
          <Clipboard size={17} aria-hidden="true" />
        )}
        {copied ? labels.report.copied : labels.report.copyAgentPrompt}
      </button>
    </div>
  )
}
