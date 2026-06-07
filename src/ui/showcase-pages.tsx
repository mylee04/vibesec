import { ArrowLeft, ExternalLink, ShieldCheck, Trophy } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import type { ShowcaseEntry } from "../showcase/types.js"
import { fallbackShowcaseEntries, formatShowcaseHost } from "./home-showcase-data.js"
import type { Language, UiCopy } from "./i18n.js"
import { publicRiskLabel } from "./i18n.js"
import { LanguageSelector } from "./language-selector.js"
import { listShowcaseEntries } from "./showcase-api.js"

type ShowcaseState =
  | { readonly kind: "loading" }
  | { readonly kind: "ready"; readonly entries: readonly ShowcaseEntry[] }
  | { readonly kind: "error"; readonly message: string }

const useShowcaseEntries = (): ShowcaseState => {
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
  return state
}

type ShowcasePageProps = {
  readonly labels: UiCopy
  readonly language: Language
  readonly onLanguageChange: (language: Language) => void
}

export const ShowcasePage = ({ labels, language, onLanguageChange }: ShowcasePageProps) => {
  const state = useShowcaseEntries()
  return (
    <main className="shell">
      <LanguageSelector language={language} label={labels.language} onChange={onLanguageChange} />
      <ShowcaseHeader labels={labels} />
      {state.kind === "loading" ? (
        <section className="empty-report">{labels.showcase.loading}</section>
      ) : null}
      {state.kind === "error" ? <section className="error-box">{state.message}</section> : null}
      {state.kind === "ready" ? (
        <section className="showcase-grid">
          {state.entries.map((entry) => (
            <ShowcaseCard entry={entry} labels={labels} key={entry.id} />
          ))}
          {state.entries.length === 0 ? (
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
  const state = useShowcaseEntries()
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
        <ShowcaseHero entry={entry} labels={labels} language={language} />
      ) : null}
    </main>
  )
}

const ShowcaseHeader = ({ labels }: { readonly labels: UiCopy }) => (
  <section className="scan-surface showcase-hero">
    <div className="brand-block">
      <div className="mark" aria-hidden="true">
        <Trophy size={25} />
      </div>
      <div>
        <p className="eyebrow">{labels.home.eyebrow}</p>
        <h1>{labels.showcase.title}</h1>
      </div>
    </div>
    <a className="showcase-link" href="/">
      {labels.showcase.scanYourApp}
      <ExternalLink size={16} aria-hidden="true" />
    </a>
  </section>
)

const ShowcaseCard = ({
  entry,
  labels,
}: {
  readonly entry: ShowcaseEntry
  readonly labels: UiCopy
}) => (
  <article className="showcase-card">
    <div>
      <div className="showcase-card-top">
        <div>
          <h2>{entry.appName}</h2>
          <a href={entry.appUrl}>{formatShowcaseHost(entry.appUrl)}</a>
        </div>
        <div className="showcase-score-pill">
          <strong>{entry.score}</strong>
          <span>{entry.grade}</span>
        </div>
      </div>
      <p>
        {entry.id === "vibesec-vibesec-bymyleslee-com"
          ? labels.showcase.vibesecTagline
          : entry.tagline}
      </p>
      <div className="tag-row">
        <span>
          {entry.id === "vibesec-vibesec-bymyleslee-com"
            ? labels.showcase.securityCategory
            : entry.category}
        </span>
        {entry.stack.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <div className="showcase-actions">
        <a href={`/s/${entry.id}`}>{labels.showcase.publicReport}</a>
        <a href={entry.appUrl}>{labels.showcase.visitApp}</a>
      </div>
    </div>
  </article>
)

const formatPublicScanDate = (value: string, language: Language): string =>
  new Intl.DateTimeFormat(language === "en" ? "en" : language === "ko" ? "ko-KR" : "ru-RU").format(
    new Date(value),
  )

const ShowcaseHero = ({
  entry,
  labels,
  language,
}: {
  readonly entry: ShowcaseEntry
  readonly labels: UiCopy
  readonly language: Language
}) => (
  <section className="showcase-detail">
    <div className="showcase-score large">
      <span>{entry.score}</span>
      <strong>{entry.grade}</strong>
    </div>
    <div>
      <p className="eyebrow">{labels.showcase.scannedBy}</p>
      <h1>{entry.appName}</h1>
      <p>
        {entry.id === "vibesec-vibesec-bymyleslee-com"
          ? labels.showcase.vibesecTagline
          : entry.tagline}
      </p>
      <div className="tag-row">
        <span>
          {entry.id === "vibesec-vibesec-bymyleslee-com"
            ? labels.showcase.securityCategory
            : entry.category}
        </span>
        {entry.stack.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <p className="badge-line">
        <ShieldCheck size={17} aria-hidden="true" />
        {labels.showcase.scoreLine(
          entry.score,
          publicRiskLabel(entry.risk, labels),
          formatPublicScanDate(entry.lastScannedAt, language),
        )}
      </p>
      <a className="showcase-link" href={entry.appUrl}>
        {labels.showcase.visitApp}
        <ExternalLink size={16} aria-hidden="true" />
      </a>
    </div>
  </section>
)
