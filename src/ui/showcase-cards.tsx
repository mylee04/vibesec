import { ExternalLink, ShieldCheck, Trophy } from "lucide-react"
import type { ShowcaseEntry } from "../showcase/types.js"
import { formatShowcaseHost } from "./home-showcase-data.js"
import type { Language, UiCopy } from "./i18n.js"
import { publicRiskLabel } from "./i18n.js"
import { LaunchBoardStats, UpvoteButton } from "./launch-board-actions.js"

type EntryUpdateHandler = (entry: ShowcaseEntry) => void

export const ShowcaseHeader = ({ labels }: { readonly labels: UiCopy }) => (
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

export const ShowcaseCard = ({
  entry,
  labels,
  onEntryUpdate,
}: {
  readonly entry: ShowcaseEntry
  readonly labels: UiCopy
  readonly onEntryUpdate: EntryUpdateHandler
}) => (
  <article className="showcase-card">
    <div>
      <div className="showcase-card-top">
        <div>
          <h2>{entry.appName}</h2>
          <a href={entry.appUrl}>{formatShowcaseHost(entry.appUrl)}</a>
        </div>
        {isScannedEntry(entry) ? (
          <div className="showcase-score-pill">
            <strong>{entry.grade}</strong>
            <span>{publicRiskLabel(entry.risk, labels)}</span>
          </div>
        ) : null}
      </div>
      <p>{publicTaglineFor(entry, labels)}</p>
      <LaunchBoardStats entry={entry} labels={labels} />
      <div className="tag-row">
        <span>{publicCategoryFor(entry, labels)}</span>
        {entry.stack.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <div className="showcase-actions">
        <a href={`/s/${entry.id}`}>{labels.showcase.publicReport}</a>
        <a href={entry.appUrl}>{labels.showcase.visitApp}</a>
        <UpvoteButton entry={entry} labels={labels} onEntryUpdate={onEntryUpdate} />
      </div>
    </div>
  </article>
)

export const ShowcaseHero = ({
  entry,
  labels,
  language,
  onEntryUpdate,
}: {
  readonly entry: ShowcaseEntry
  readonly labels: UiCopy
  readonly language: Language
  readonly onEntryUpdate: EntryUpdateHandler
}) => (
  <section className="showcase-detail">
    {isScannedEntry(entry) ? (
      <div className="showcase-score large">
        <span>{entry.grade}</span>
        <strong>{publicRiskLabel(entry.risk, labels)}</strong>
      </div>
    ) : null}
    <div>
      <p className="eyebrow">
        {isScannedEntry(entry) ? labels.showcase.scannedBy : labels.showcase.title}
      </p>
      <h1>{entry.appName}</h1>
      <p className="showcase-body">{publicTaglineFor(entry, labels)}</p>
      <div className="tag-row">
        <span>{publicCategoryFor(entry, labels)}</span>
        {entry.stack.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <LaunchBoardStats entry={entry} labels={labels} />
      {isScannedEntry(entry) ? (
        <p className="badge-line">
          <ShieldCheck size={17} aria-hidden="true" />
          {labels.showcase.gradeLine(
            entry.grade,
            publicRiskLabel(entry.risk, labels),
            formatPublicScanDate(entry.lastScannedAt, language),
          )}
        </p>
      ) : null}
      <div className="showcase-actions">
        <a className="showcase-link" href={entry.appUrl}>
          {labels.showcase.visitApp}
          <ExternalLink size={16} aria-hidden="true" />
        </a>
        <UpvoteButton entry={entry} labels={labels} onEntryUpdate={onEntryUpdate} />
      </div>
    </div>
  </section>
)

const publicTaglineFor = (entry: ShowcaseEntry, labels: UiCopy): string =>
  entry.id === "vibesec-vibesec-bymyleslee-com" ? labels.showcase.vibesecTagline : entry.tagline

const publicCategoryFor = (entry: ShowcaseEntry, labels: UiCopy): string =>
  entry.id === "vibesec-vibesec-bymyleslee-com" ? labels.showcase.securityCategory : entry.category

const isScannedEntry = (entry: ShowcaseEntry): boolean => entry.grade !== "Post"

const formatPublicScanDate = (value: string, language: Language): string =>
  new Intl.DateTimeFormat(language === "en" ? "en" : language === "ko" ? "ko-KR" : "ru-RU").format(
    new Date(value),
  )
