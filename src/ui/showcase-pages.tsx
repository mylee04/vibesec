import { ArrowLeft } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import type { ShowcaseEntry } from "../showcase/types.js"
import { fallbackShowcaseEntries } from "./home-showcase-data.js"
import type { Language, UiCopy } from "./i18n.js"
import { LanguageSelector } from "./language-selector.js"
import {
  CommentPanel,
  type LaunchBoardSort,
  LaunchBoardTabs,
  sortLaunchBoardEntries,
} from "./launch-board-actions.js"
import { listShowcaseEntries } from "./showcase-api.js"
import { ShowcaseCard, ShowcaseHeader, ShowcaseHero } from "./showcase-cards.js"

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
  readonly language: Language
  readonly onLanguageChange: (language: Language) => void
}

export const ShowcasePage = ({ labels, language, onLanguageChange }: ShowcasePageProps) => {
  const { state, updateEntry } = useShowcaseEntries()
  const [sort, setSort] = useState<LaunchBoardSort>("popular")
  const entries = useMemo(
    () => (state.kind === "ready" ? sortLaunchBoardEntries(state.entries, sort) : []),
    [sort, state],
  )
  return (
    <main className="shell">
      <LanguageSelector language={language} label={labels.language} onChange={onLanguageChange} />
      <ShowcaseHeader labels={labels} />
      <LaunchBoardTabs labels={labels} sort={sort} onSortChange={setSort} />
      {state.kind === "loading" ? (
        <section className="empty-report">{labels.showcase.loading}</section>
      ) : null}
      {state.kind === "error" ? <section className="error-box">{state.message}</section> : null}
      {state.kind === "ready" ? (
        <section className="showcase-grid">
          {entries.map((entry) => (
            <ShowcaseCard
              entry={entry}
              labels={labels}
              key={entry.id}
              onEntryUpdate={updateEntry}
            />
          ))}
          {entries.length === 0 ? (
            <div className="empty-report">{labels.showcase.noPublic}</div>
          ) : null}
        </section>
      ) : null}
    </main>
  )
}

type ShowcaseDetailPageProps = ShowcasePageProps & {
  readonly entryId: string
}

export const ShowcaseDetailPage = ({
  entryId,
  labels,
  language,
  onLanguageChange,
}: ShowcaseDetailPageProps) => {
  const { state, updateEntry } = useShowcaseEntries()
  const entry = useMemo(() => {
    if (state.kind !== "ready") {
      return undefined
    }
    return state.entries.find((item) => item.id === entryId)
  }, [entryId, state])

  return (
    <main className="shell">
      <LanguageSelector language={language} label={labels.language} onChange={onLanguageChange} />
      <a className="showcase-link" href="/showcase">
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
    </main>
  )
}
