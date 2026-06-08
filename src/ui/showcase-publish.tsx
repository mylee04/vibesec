import { ExternalLink, Megaphone } from "lucide-react"
import { useState } from "react"
import type { ScanReport } from "../scanner/types.js"
import type { ShowcaseEntry } from "../showcase/types.js"
import type { UiCopy } from "./i18n.js"
import { publishShowcaseEntry } from "./showcase-api.js"

type PublishState =
  | { readonly kind: "idle" }
  | { readonly kind: "saving" }
  | { readonly kind: "saved"; readonly entry: ShowcaseEntry }
  | { readonly kind: "error"; readonly message: string }

export const ShowcasePublish = ({
  report,
  labels,
}: {
  readonly report: ScanReport
  readonly labels: UiCopy
}) => {
  const [appName, setAppName] = useState("")
  const [tagline, setTagline] = useState("")
  const [category, setCategory] = useState(labels.publish.defaultCategory)
  const [stack, setStack] = useState(report.detected.join(", "))
  const [state, setState] = useState<PublishState>({ kind: "idle" })

  const submit = async (event: { readonly preventDefault: () => void }) => {
    event.preventDefault()
    setState({ kind: "saving" })
    try {
      const entry = await publishShowcaseEntry({
        appName,
        appUrl: report.targetUrl,
        tagline,
        category,
        stack: stack
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item.length > 0),
      })
      setState({ kind: "saved", entry })
    } catch (error) {
      if (error instanceof Error) {
        setState({ kind: "error", message: error.message })
        return
      }
      throw error
    }
  }

  return (
    <section className="showcase-publish" id="showcase-publish">
      <div className="panel-heading">
        <Megaphone size={19} aria-hidden="true" />
        <span>{labels.publish.title}</span>
      </div>
      <form className="showcase-form" onSubmit={submit}>
        <input
          value={appName}
          placeholder={labels.publish.appName}
          onChange={(event) => setAppName(event.currentTarget.value)}
          required
        />
        <input
          value={tagline}
          placeholder={labels.publish.tagline}
          onChange={(event) => setTagline(event.currentTarget.value)}
          required
        />
        <input
          value={category}
          placeholder={labels.publish.category}
          onChange={(event) => setCategory(event.currentTarget.value)}
          required
        />
        <input
          value={stack}
          placeholder={labels.publish.stack}
          onChange={(event) => setStack(event.currentTarget.value)}
        />
        <button type="submit" disabled={state.kind === "saving"}>
          {state.kind === "saving" ? labels.publish.publishing : labels.publish.publish}
        </button>
      </form>
      {state.kind === "saved" ? (
        <a className="showcase-link" href={`/s/${state.entry.id}`}>
          {labels.publish.viewPublicPage}
          <ExternalLink size={16} aria-hidden="true" />
        </a>
      ) : null}
      {state.kind === "error" ? <p className="error-text">{state.message}</p> : null}
    </section>
  )
}
