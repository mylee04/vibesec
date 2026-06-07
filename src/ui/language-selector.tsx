import type { Language } from "./i18n.js"
import { languageOptions } from "./i18n.js"

type LanguageSelectorProps = {
  readonly language: Language
  readonly label: string
  readonly onChange: (language: Language) => void
}

export const LanguageSelector = ({ language, label, onChange }: LanguageSelectorProps) => (
  <fieldset className="language-bar">
    <legend>{label}</legend>
    {languageOptions.map((option) => (
      <button
        className={option.code === language ? "language-button active" : "language-button"}
        type="button"
        key={option.code}
        onClick={() => onChange(option.code)}
      >
        {option.label}
      </button>
    ))}
  </fieldset>
)
