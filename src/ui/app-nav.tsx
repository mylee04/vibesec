import type { Language, UiCopy } from "./i18n.js"
import { LanguageSelector } from "./language-selector.js"
import type { ThemePreference } from "./theme.js"
import { ThemeToggle } from "./theme-toggle.js"

export const AppNav = ({
  currentPath,
  labels,
  language,
  theme,
  onLanguageChange,
  onThemeChange,
}: {
  readonly currentPath: string
  readonly labels: UiCopy
  readonly language: Language
  readonly theme: ThemePreference
  readonly onLanguageChange: (language: Language) => void
  readonly onThemeChange: (theme: ThemePreference) => void
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
      <div className="app-controls">
        <ThemeToggle theme={theme} onChange={onThemeChange} />
        <LanguageSelector language={language} label={labels.language} onChange={onLanguageChange} />
      </div>
    </header>
  )
}
