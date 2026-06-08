export type ThemePreference = "light" | "dark"

const themeStorageKey = "vibesec-theme"

export const parseThemePreference = (
  value: string | null | undefined,
): ThemePreference | undefined => {
  switch (value) {
    case "light":
    case "dark":
      return value
    default:
      return undefined
  }
}

export const getInitialThemePreference = (): ThemePreference =>
  parseThemePreference(window.localStorage.getItem(themeStorageKey)) ??
  (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")

export const applyThemePreference = (theme: ThemePreference): void => {
  document.documentElement.dataset["theme"] = theme
  document.documentElement.style.colorScheme = theme
}

export const persistThemePreference = (theme: ThemePreference): void => {
  window.localStorage.setItem(themeStorageKey, theme)
  applyThemePreference(theme)
}

export const nextThemePreference = (theme: ThemePreference): ThemePreference =>
  theme === "dark" ? "light" : "dark"
