import { Send } from "lucide-react"
import type { FormEvent } from "react"
import { useState } from "react"
import type { ShowcaseEntry } from "../showcase/types.js"
import type { UiCopy } from "./i18n.js"
import { publishShowcaseEntry } from "./showcase-api.js"

type PublishState =
  | { readonly kind: "idle" }
  | { readonly kind: "saving" }
  | { readonly kind: "error"; readonly message: string }

export const CommunitySubmitForm = ({
  labels,
  onEntryCreated,
}: {
  readonly labels: UiCopy
  readonly onEntryCreated: (entry: ShowcaseEntry) => void
}) => {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [appUrl, setAppUrl] = useState("")
  const [category, setCategory] = useState(labels.publish.categories[0] ?? labels.publish.category)
  const [stack, setStack] = useState("")
  const [state, setState] = useState<PublishState>({ kind: "idle" })

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setState({ kind: "saving" })
    try {
      const entry = await publishShowcaseEntry({
        appName: title,
        appUrl,
        tagline: body,
        category,
        stack: stack
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item.length > 0),
      })
      setTitle("")
      setBody("")
      setAppUrl("")
      setStack("")
      onEntryCreated(entry)
      setState({ kind: "idle" })
    } catch (error) {
      if (error instanceof Error) {
        setState({ kind: "error", message: error.message })
        return
      }
      throw error
    }
  }

  return (
    <section className="community-submit" aria-labelledby="community-submit-title">
      <div className="panel-heading">
        <Send size={18} aria-hidden="true" />
        <span id="community-submit-title">{labels.publish.title}</span>
      </div>
      <form className="community-submit-form" onSubmit={submit}>
        <input
          value={title}
          placeholder={labels.publish.postTitle}
          onChange={(event) => setTitle(event.currentTarget.value)}
          required
        />
        <textarea
          value={body}
          placeholder={labels.publish.body}
          onChange={(event) => setBody(event.currentTarget.value)}
          required
        />
        <input
          value={appUrl}
          placeholder={labels.publish.appUrl}
          inputMode="url"
          autoCapitalize="none"
          autoComplete="off"
          onChange={(event) => setAppUrl(event.currentTarget.value)}
          required
        />
        <div className="community-submit-row">
          <select
            value={category}
            aria-label={labels.publish.category}
            onChange={(event) => setCategory(event.currentTarget.value)}
          >
            {labels.publish.categories.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
          <input
            value={stack}
            placeholder={labels.publish.stack}
            onChange={(event) => setStack(event.currentTarget.value)}
          />
        </div>
        <button type="submit" disabled={state.kind === "saving"}>
          {state.kind === "saving" ? labels.publish.publishing : labels.publish.publish}
        </button>
      </form>
      {state.kind === "error" ? <p className="launch-board-error">{state.message}</p> : null}
    </section>
  )
}
