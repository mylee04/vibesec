import type { Language, UiCopy } from "./i18n.js"
import { LanguageSelector } from "./language-selector.js"

export const AppNav = ({
  currentPath,
  labels,
  language,
  onLanguageChange,
}: {
  readonly currentPath: string
  readonly labels: UiCopy
  readonly language: Language
  readonly onLanguageChange: (language: Language) => void
}) => {
  const isCommunity = currentPath === "/community" || currentPath === "/showcase"
  return (
    <header className="app-topbar">
      <a className="app-wordmark" href="/">
        VibeSec
      </a>
      <nav className="app-tabs" aria-label={labels.nav.community}>
        <a className={!isCommunity ? "active" : ""} href="/">
          {labels.nav.scan}
        </a>
        <a className={isCommunity ? "active" : ""} href="/community">
          {labels.nav.community}
        </a>
      </nav>
      <LanguageSelector language={language} label={labels.language} onChange={onLanguageChange} />
    </header>
  )
}
