import type { Language } from "./i18n.js"
import { languageOptions, parseLanguage } from "./i18n.js"

type LanguageSelectorProps = {
  readonly language: Language
  readonly label: string
  readonly onChange: (language: Language) => void
}

export const LanguageSelector = ({ language, label, onChange }: LanguageSelectorProps) => (
  <label className="language-select">
    <span>{label}</span>
    <select
      value={language}
      onChange={(event) => {
        const nextLanguage = parseLanguage(event.currentTarget.value)
        if (nextLanguage !== undefined) {
          onChange(nextLanguage)
        }
      }}
    >
      {languageOptions.map((option) => (
        <option value={option.code} key={option.code}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
)
