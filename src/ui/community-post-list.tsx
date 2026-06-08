import { ArrowBigUp } from "lucide-react"
import { useState } from "react"
import type { ShowcaseEntry } from "../showcase/types.js"
import { formatShowcaseHost } from "./home-showcase-data.js"
import type { UiCopy } from "./i18n.js"
import { upvoteShowcaseEntry } from "./showcase-api.js"

type EntryUpdateHandler = (entry: ShowcaseEntry) => void

export const CommunityPostList = ({
  entries,
  labels,
  onEntryUpdate,
}: {
  readonly entries: readonly ShowcaseEntry[]
  readonly labels: UiCopy
  readonly onEntryUpdate: EntryUpdateHandler
}) => (
  <section className="community-board" aria-label={labels.nav.community}>
    {entries.map((entry) => (
      <CommunityPostRow
        entry={entry}
        labels={labels}
        key={entry.id}
        onEntryUpdate={onEntryUpdate}
      />
    ))}
  </section>
)

const CommunityPostRow = ({
  entry,
  labels,
  onEntryUpdate,
}: {
  readonly entry: ShowcaseEntry
  readonly labels: UiCopy
  readonly onEntryUpdate: EntryUpdateHandler
}) => {
  const [state, setState] = useState<"idle" | "saving" | "error">("idle")

  const upvote = async () => {
    setState("saving")
    try {
      onEntryUpdate(await upvoteShowcaseEntry(entry.id))
      setState("idle")
    } catch (error: unknown) {
      if (error instanceof Error) {
        setState("error")
        return
      }
      throw error
    }
  }

  return (
    <article className="community-post">
      <button
        type="button"
        className="community-vote"
        onClick={upvote}
        disabled={state === "saving"}
        aria-label={labels.showcase.upvote}
      >
        <ArrowBigUp size={18} aria-hidden="true" />
        <span>{entry.upvotes}</span>
      </button>
      <div className="community-post-main">
        <div className="community-post-line">
          <span className="community-badge">{publicCategoryFor(entry, labels)}</span>
          <a className="community-title" href={`/s/${entry.id}`}>
            {entry.appName}: {publicTaglineFor(entry, labels)}
          </a>
          <a className="community-comments" href={`/s/${entry.id}#launch-board-comments-title`}>
            [{entry.comments.length}]
          </a>
        </div>
        <div className="community-meta">
          <a href={entry.appUrl}>{formatShowcaseHost(entry.appUrl)}</a>
          <span>{entry.score}/100</span>
          <span>{entry.grade}</span>
          {state === "error" ? <span>{labels.showcase.voteError}</span> : null}
        </div>
      </div>
    </article>
  )
}

const publicTaglineFor = (entry: ShowcaseEntry, labels: UiCopy): string =>
  entry.id === "vibesec-vibesec-bymyleslee-com" ? labels.showcase.vibesecTagline : entry.tagline

const publicCategoryFor = (entry: ShowcaseEntry, labels: UiCopy): string =>
  entry.id === "vibesec-vibesec-bymyleslee-com" ? labels.showcase.securityCategory : entry.category
