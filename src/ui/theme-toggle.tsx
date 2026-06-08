import { Moon, Sun } from "lucide-react"
import type { ThemePreference } from "./theme.js"

type ThemeToggleProps = {
  readonly theme: ThemePreference
  readonly onChange: (theme: ThemePreference) => void
}

export const ThemeToggle = ({ theme, onChange }: ThemeToggleProps) => {
  const isDark = theme === "dark"
  const nextTheme = isDark ? "light" : "dark"
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      onClick={() => onChange(nextTheme)}
    >
      {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
      <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  )
}
