import { ArrowLeft } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import type { ShowcaseEntry } from "../showcase/types.js"
import { CommunityPostList } from "./community-post-list.js"
import { fallbackShowcaseEntries } from "./home-showcase-data.js"
import type { Language, UiCopy } from "./i18n.js"
import { CommentPanel, LaunchBoardTabs } from "./launch-board-actions.js"
import { type LaunchBoardSort, sortLaunchBoardEntries } from "./launch-board-sort.js"
import { listShowcaseEntries } from "./showcase-api.js"
import { ShowcaseHeader, ShowcaseHero } from "./showcase-cards.js"

type ShowcaseState =
  | { readonly kind: "loading" }
  | { readonly kind: "ready"; readonly entries: readonly ShowcaseEntry[] }
  | { readonly kind: "error"; readonly message: string }

const useShowcaseEntries = (): {
  readonly state: ShowcaseState
  readonly updateEntry: (entry: ShowcaseEntry) => void
} => {
  const [state, setState] = useState<ShowcaseState>({ kind: "loading" })
  useEffect(() => {
    let active = true
    listShowcaseEntries()
      .then((entries) => {
        if (active) {
          setState({
            kind: "ready",
            entries: entries.length === 0 ? fallbackShowcaseEntries : entries,
          })
        }
      })
      .catch((error: unknown) => {
        if (!(error instanceof Error)) {
          throw error
        }
        if (active) {
          setState({ kind: "ready", entries: fallbackShowcaseEntries })
        }
      })
    return () => {
      active = false
    }
  }, [])
  const updateEntry = (entry: ShowcaseEntry) => {
    setState((current) => {
      if (current.kind !== "ready") {
        return current
      }
      return {
        kind: "ready",
        entries: current.entries.map((item) => (item.id === entry.id ? entry : item)),
      }
    })
  }

  return { state, updateEntry }
}

type ShowcasePageProps = {
  readonly labels: UiCopy
}

export const ShowcasePage = ({ labels }: ShowcasePageProps) => {
  const { state, updateEntry } = useShowcaseEntries()
  const [sort, setSort] = useState<LaunchBoardSort>("hot")
  const entries = useMemo(
    () => (state.kind === "ready" ? sortLaunchBoardEntries(state.entries, sort) : []),
    [sort, state],
  )
  return (
    <>
      <ShowcaseHeader labels={labels} />
      <LaunchBoardTabs labels={labels} sort={sort} onSortChange={setSort} />
      {state.kind === "loading" ? (
        <section className="empty-report">{labels.showcase.loading}</section>
      ) : null}
      {state.kind === "error" ? <section className="error-box">{state.message}</section> : null}
      {state.kind === "ready" ? (
        <>
          <CommunityPostList entries={entries} labels={labels} onEntryUpdate={updateEntry} />
          {entries.length === 0 ? (
            <div className="empty-report">{labels.showcase.noPublic}</div>
          ) : null}
        </>
      ) : null}
    </>
  )
}

type ShowcaseDetailPageProps = ShowcasePageProps & {
  readonly entryId: string
  readonly language: Language
}

export const ShowcaseDetailPage = ({ entryId, labels, language }: ShowcaseDetailPageProps) => {
  const { state, updateEntry } = useShowcaseEntries()
  const entry = useMemo(() => {
    if (state.kind !== "ready") {
      return undefined
    }
    return state.entries.find((item) => item.id === entryId)
  }, [entryId, state])

  return (
    <>
      <a className="showcase-link" href="/community">
        <ArrowLeft size={16} aria-hidden="true" />
        {labels.showcase.back}
      </a>
      {state.kind === "loading" ? (
        <section className="empty-report">{labels.showcase.loadingReport}</section>
      ) : null}
      {state.kind === "ready" && entry === undefined ? (
        <section className="empty-report">{labels.showcase.notFound}</section>
      ) : null}
      {entry !== undefined ? (
        <>
          <ShowcaseHero
            entry={entry}
            labels={labels}
            language={language}
            onEntryUpdate={updateEntry}
          />
          <CommentPanel entry={entry} labels={labels} onEntryUpdate={updateEntry} />
        </>
      ) : null}
    </>
  )
}
