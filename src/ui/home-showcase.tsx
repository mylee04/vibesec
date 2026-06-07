import { ExternalLink, ShieldCheck, Trophy } from "lucide-react"
import { useEffect, useState } from "react"
import type { ShowcaseEntry } from "../showcase/types.js"
import { formatShowcaseHost, selectHomeShowcaseEntries } from "./home-showcase-data.js"
import type { UiCopy } from "./i18n.js"
import { listShowcaseEntries } from "./showcase-api.js"

type ShowcasePreviewState = {
  readonly entries: readonly ShowcaseEntry[]
  readonly status: "fallback" | "live"
}

export const HomeShowcase = ({ labels }: { readonly labels: UiCopy }) => {
  const [state, setState] = useState<ShowcasePreviewState>({
    entries: selectHomeShowcaseEntries([]),
    status: "fallback",
  })

  useEffect(() => {
    let isActive = true
    listShowcaseEntries()
      .then((entries) => {
        if (isActive) {
          setState({ entries: selectHomeShowcaseEntries(entries), status: "live" })
        }
      })
      .catch((error: unknown) => {
        if (!(error instanceof Error)) {
          throw error
        }
        if (isActive) {
          setState({ entries: selectHomeShowcaseEntries([]), status: "fallback" })
        }
      })
    return () => {
      isActive = false
    }
  }, [])

  return (
    <section className="home-showcase" aria-labelledby="home-showcase-title">
      <div className="home-showcase-head">
        <div className="home-showcase-title">
          <Trophy size={24} aria-hidden="true" />
          <div>
            <p className="eyebrow">{labels.home.eyebrow}</p>
            <h2 id="home-showcase-title">{labels.home.title}</h2>
            <p>{labels.home.pitch}</p>
          </div>
        </div>
        <a className="showcase-link" href="/showcase">
          {labels.home.viewAll}
          <ExternalLink size={16} aria-hidden="true" />
        </a>
      </div>

      <div className="home-showcase-grid">
        {state.entries.map((entry) => (
          <HomeShowcaseCard entry={entry} labels={labels} key={entry.id} />
        ))}
      </div>
      {state.status === "fallback" ? (
        <p className="home-showcase-note">{labels.home.beta}</p>
      ) : null}
    </section>
  )
}

const HomeShowcaseCard = ({
  entry,
  labels,
}: {
  readonly entry: ShowcaseEntry
  readonly labels: UiCopy
}) => (
  <article className="home-showcase-card">
    <div className="home-showcase-card-main">
      <div className="home-showcase-identity">
        <h3>{entry.appName}</h3>
        <a href={entry.appUrl}>{formatShowcaseHost(entry.appUrl)}</a>
      </div>
      <div className="showcase-score-pill">
        <strong>{entry.score}</strong>
        <span>{entry.grade}</span>
      </div>
    </div>
    <div className="home-showcase-copy">
      <div className="home-showcase-card-head">
        <span>
          {entry.id === "vibesec-vibesec-bymyleslee-com"
            ? labels.showcase.securityCategory
            : entry.category}
        </span>
      </div>
      <p>
        {entry.id === "vibesec-vibesec-bymyleslee-com"
          ? labels.showcase.vibesecTagline
          : entry.tagline}
      </p>
      <div className="tag-row">
        {entry.stack.slice(0, 3).map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <div className="showcase-actions">
        <a href={`/s/${entry.id}`}>
          <ShieldCheck size={15} aria-hidden="true" />
          {labels.showcase.publicReport}
        </a>
        <a href={entry.appUrl}>{labels.showcase.visitApp}</a>
      </div>
    </div>
  </article>
)
