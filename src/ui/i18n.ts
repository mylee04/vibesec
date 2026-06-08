import type { Risk, SecurityIssue } from "../scanner/types.js"
import { enCopy, type UiCopy } from "./locales/en.js"
import { esCopy } from "./locales/es.js"
import { jaCopy } from "./locales/ja.js"
import { koCopy } from "./locales/ko.js"
import { ruCopy } from "./locales/ru.js"

export type Language = "en" | "es" | "ja" | "ko" | "ru"
export type { UiCopy }

export const languageOptions: readonly { readonly code: Language; readonly label: string }[] = [
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "ru", label: "RU" },
]

const copies: Record<Language, UiCopy> = {
  en: enCopy,
  es: esCopy,
  ja: jaCopy,
  ko: koCopy,
  ru: ruCopy,
}

const languageStorageKey = "vibesec-language"
const languageSourceStorageKey = "vibesec-language-source"

export const parseLanguage = (value: string | null | undefined): Language | undefined => {
  switch (value) {
    case "en":
    case "es":
    case "ja":
    case "ko":
    case "ru":
      return value
    default:
      return undefined
  }
}

const languageFromBrowserTag = (value: string): Language | undefined => {
  const primaryLanguage = value.toLowerCase().split("-")[0]
  return parseLanguage(primaryLanguage)
}

export const detectLanguageFromPreferences = (
  preferences: readonly string[] | undefined,
): Language => {
  for (const preference of preferences ?? []) {
    const language = languageFromBrowserTag(preference)
    if (language !== undefined) {
      return language
    }
  }
  return "en"
}

export const getInitialLanguage = (): Language => {
  const saved = parseLanguage(window.localStorage.getItem(languageStorageKey))
  const source = window.localStorage.getItem(languageSourceStorageKey)
  if (source === "manual" && saved !== undefined) {
    return saved
  }
  const browserLanguages =
    window.navigator.languages.length > 0 ? window.navigator.languages : [window.navigator.language]
  return detectLanguageFromPreferences(browserLanguages)
}

export const applyLanguage = (language: Language): void => {
  document.documentElement.lang = language
}

export const persistLanguage = (language: Language): void => {
  window.localStorage.setItem(languageStorageKey, language)
  window.localStorage.setItem(languageSourceStorageKey, "manual")
  applyLanguage(language)
}

export const getCopy = (language: Language): UiCopy => copies[language]

export const severityLabel = (severity: SecurityIssue["severity"], labels: UiCopy): string =>
  labels.report.severity[severity]

export const riskLabel = (risk: Risk, labels: UiCopy): string => labels.report.risk[risk]

export const publicRiskLabel = (risk: string, labels: UiCopy): string => {
  switch (risk) {
    case "Low":
    case "Medium":
    case "High":
      return labels.report.risk[risk]
    default:
      return risk
  }
}

export const scanSummary = (
  counts: {
    readonly dangerous: number
    readonly needsAttention: number
    readonly niceToFix: number
  },
  labels: UiCopy,
): string => {
  const issues = counts.dangerous + counts.needsAttention + counts.niceToFix
  const groups = [counts.dangerous, counts.needsAttention, counts.niceToFix].filter(
    (count) => count > 0,
  ).length
  return issues === 0 ? labels.report.noBlocking : labels.report.summary(issues, groups)
}
