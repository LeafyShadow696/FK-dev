import { useEffect, useState } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { useConsent } from "@/components/privacy/ConsentProvider"
import { cn } from "@/utils/cn"

type Theme = "light" | "dark"
type ThemePreference = Theme | "system"

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "dark"
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark"
}

function resolveTheme(preference: ThemePreference): Theme {
  return preference === "system" ? getSystemTheme() : preference
}

function getPreferredTheme(canUseStoredPreference: boolean): ThemePreference {
  if (typeof window === "undefined") return "dark"
  if (!canUseStoredPreference) return "dark"

  const stored = window.localStorage.getItem("theme")
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored
  }

  return "dark"
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("light", theme === "light")
  document.documentElement.classList.toggle("dark", theme === "dark")
  document.documentElement.style.colorScheme = theme
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "light" ? "#f7f6fb" : "#0a0a0c")
}

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { consent } = useConsent()
  const [preference, setPreference] = useState<ThemePreference>(() =>
    getPreferredTheme(consent.preferences),
  )

  useEffect(() => {
    setPreference(getPreferredTheme(consent.preferences))
  }, [consent.preferences])

  useEffect(() => {
    applyTheme(resolveTheme(preference))
    try {
      if (consent.preferences) {
        window.localStorage.setItem("theme", preference)
      } else {
        window.localStorage.removeItem("theme")
      }
    } catch {
      // Theme switching remains available for the current session.
    }
  }, [consent.preferences, preference])

  useEffect(() => {
    if (preference !== "system" || typeof window === "undefined") return

    const media = window.matchMedia("(prefers-color-scheme: light)")
    const syncSystemTheme = () => applyTheme(getSystemTheme())
    media.addEventListener("change", syncSystemTheme)

    return () => media.removeEventListener("change", syncSystemTheme)
  }, [preference])

  const theme = resolveTheme(preference)
  const nextPreference: ThemePreference =
    preference === "dark" ? "light" : preference === "light" ? "system" : "dark"
  const label =
    preference === "dark"
      ? "Přepnout na světlý režim"
      : preference === "light"
        ? "Použít systémový režim"
        : "Přepnout na tmavý režim"

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setPreference(nextPreference)}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-md border border-border/70 bg-card/40 text-foreground transition-colors hover:border-brand-violet/60 hover:bg-card/70",
        className,
      )}
    >
      {preference === "system" ? (
        <Monitor className="h-4 w-4" aria-hidden />
      ) : theme === "dark" ? (
        <Sun className="h-4 w-4" aria-hidden />
      ) : (
        <Moon className="h-4 w-4" aria-hidden />
      )}
    </button>
  )
}
