import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { cn } from "@/utils/cn"

type Theme = "light" | "dark"

function getPreferredTheme(): Theme {
  if (typeof window === "undefined") return "dark"
  const stored = window.localStorage.getItem("theme")
  if (stored === "light" || stored === "dark") return stored
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark"
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
  const [theme, setTheme] = useState<Theme>(() => getPreferredTheme())

  useEffect(() => {
    applyTheme(theme)
    window.localStorage.setItem("theme", theme)
  }, [theme])

  const nextTheme = theme === "dark" ? "light" : "dark"

  return (
    <button
      type="button"
      aria-label={
        theme === "dark" ? "Přepnout na světlý režim" : "Přepnout na tmavý režim"
      }
      title={
        theme === "dark" ? "Přepnout na světlý režim" : "Přepnout na tmavý režim"
      }
      onClick={() => setTheme(nextTheme)}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-md border border-border/70 bg-card/40 text-foreground transition-colors hover:border-brand-violet/60 hover:bg-card/70",
        className,
      )}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" aria-hidden />
      ) : (
        <Moon className="h-4 w-4" aria-hidden />
      )}
    </button>
  )
}
