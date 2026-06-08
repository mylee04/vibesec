import { ArrowBigUp, MessageCircle, Send } from "lucide-react"
import { type FormEvent, useMemo, useState } from "react"
import type { ShowcaseEntry } from "../showcase/types.js"
import type { UiCopy } from "./i18n.js"
import { commentShowcaseEntry, upvoteShowcaseEntry } from "./showcase-api.js"

export type LaunchBoardSort = "popular" | "latest"

export const sortLaunchBoardEntries = (
  entries: readonly ShowcaseEntry[],
  sort: LaunchBoardSort,
): readonly ShowcaseEntry[] =>
  [...entries].sort((left, right) => {
    if (sort === "popular") {
      const voteDelta = right.upvotes - left.upvotes
      if (voteDelta !== 0) {
        return voteDelta
      }
      const commentDelta = right.comments.length - left.comments.length
      if (commentDelta !== 0) {
        return commentDelta
      }
    }
    return right.createdAt.localeCompare(left.createdAt)
  })

export const LaunchBoardTabs = ({
  labels,
  sort,
  onSortChange,
}: {
  readonly labels: UiCopy
  readonly sort: LaunchBoardSort
  readonly onSortChange: (sort: LaunchBoardSort) => void
}) => (
  <div className="launch-board-tabs" role="tablist" aria-label={labels.showcase.title}>
    <button
      type="button"
      className={sort === "popular" ? "active" : ""}
      onClick={() => onSortChange("popular")}
    >
      {labels.showcase.popular}
    </button>
    <button
      type="button"
      className={sort === "latest" ? "active" : ""}
      onClick={() => onSortChange("latest")}
    >
      {labels.showcase.latest}
    </button>
  </div>
)

export const LaunchBoardStats = ({
  entry,
  labels,
}: {
  readonly entry: ShowcaseEntry
  readonly labels: UiCopy
}) => (
  <div className="launch-board-stats">
    <span>
      <ArrowBigUp size={15} aria-hidden="true" />
      {entry.upvotes} {labels.showcase.upvotes}
    </span>
    <span>
      <MessageCircle size={15} aria-hidden="true" />
      {entry.comments.length} {labels.showcase.comments}
    </span>
  </div>
)

export const UpvoteButton = ({
  entry,
  labels,
  onEntryUpdate,
}: {
  readonly entry: ShowcaseEntry
  readonly labels: UiCopy
  readonly onEntryUpdate: (entry: ShowcaseEntry) => void
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
    <div className="launch-board-vote">
      <button type="button" onClick={upvote} disabled={state === "saving"}>
        <ArrowBigUp size={17} aria-hidden="true" />
        {labels.showcase.upvote}
      </button>
      {state === "error" ? <span>{labels.showcase.voteError}</span> : null}
    </div>
  )
}

export const CommentPanel = ({
  entry,
  labels,
  onEntryUpdate,
}: {
  readonly entry: ShowcaseEntry
  readonly labels: UiCopy
  readonly onEntryUpdate: (entry: ShowcaseEntry) => void
}) => {
  const [authorName, setAuthorName] = useState("")
  const [body, setBody] = useState("")
  const [state, setState] = useState<"idle" | "saving" | "error">("idle")
  const comments = useMemo(() => entry.comments.slice(0, 20), [entry.comments])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setState("saving")
    try {
      const updatedEntry = await commentShowcaseEntry({ entryId: entry.id, authorName, body })
      onEntryUpdate(updatedEntry)
      setAuthorName("")
      setBody("")
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
    <section className="launch-board-comments" aria-labelledby="launch-board-comments-title">
      <div className="panel-heading">
        <MessageCircle size={18} aria-hidden="true" />
        <span id="launch-board-comments-title">{labels.showcase.comments}</span>
      </div>
      <form className="launch-board-comment-form" onSubmit={submit}>
        <input
          value={authorName}
          placeholder={labels.showcase.commentName}
          onChange={(event) => setAuthorName(event.currentTarget.value)}
          required
        />
        <textarea
          value={body}
          placeholder={labels.showcase.commentBody}
          onChange={(event) => setBody(event.currentTarget.value)}
          required
        />
        <button type="submit" disabled={state === "saving"}>
          {state === "saving" ? labels.showcase.commenting : labels.showcase.commentSubmit}
          <Send size={15} aria-hidden="true" />
        </button>
      </form>
      {state === "error" ? (
        <p className="launch-board-error">{labels.showcase.commentError}</p>
      ) : null}
      <div className="launch-board-comment-list">
        {comments.length === 0 ? <p>{labels.showcase.noComments}</p> : null}
        {comments.map((comment) => (
          <article key={comment.id}>
            <strong>{comment.authorName}</strong>
            <p>{comment.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
