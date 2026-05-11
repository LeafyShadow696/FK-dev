import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import { Settings2, ShieldCheck, X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { cn } from "@/utils/cn"

const consentStorageKey = "fkdev-consent-v1"

export interface ConsentPreferences {
  preferences: boolean
  analytics: boolean
}

interface StoredConsent extends ConsentPreferences {
  decided: boolean
  updatedAt: string
}

interface ConsentContextValue {
  consent: StoredConsent
  acceptAll: () => void
  rejectOptional: () => void
  saveConsent: (preferences: ConsentPreferences) => void
  openPreferences: () => void
}

const defaultConsent: StoredConsent = {
  decided: false,
  preferences: false,
  analytics: false,
  updatedAt: "",
}

const ConsentContext = createContext<ConsentContextValue | null>(null)

function readConsent(): StoredConsent {
  if (typeof window === "undefined") {
    return defaultConsent
  }

  try {
    const raw = window.localStorage.getItem(consentStorageKey)
    if (!raw) {
      return defaultConsent
    }

    const parsed = JSON.parse(raw) as Partial<StoredConsent>

    return {
      decided: parsed.decided === true,
      preferences: parsed.preferences === true,
      analytics: parsed.analytics === true,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    }
  } catch {
    return defaultConsent
  }
}

function writeConsent(preferences: ConsentPreferences): StoredConsent {
  const next: StoredConsent = {
    decided: true,
    preferences: preferences.preferences,
    analytics: preferences.analytics,
    updatedAt: new Date().toISOString(),
  }

  try {
    window.localStorage.setItem(consentStorageKey, JSON.stringify(next))

    if (!next.preferences) {
      window.localStorage.removeItem("theme")
    }
  } catch {
    // Consent still applies for the current session if persistent storage fails.
  }

  return next
}

interface ConsentProviderProps {
  children: ReactNode
}

export function ConsentProvider({ children }: ConsentProviderProps) {
  const [consent, setConsent] = useState<StoredConsent>(() => readConsent())
  const [preferencesOpen, setPreferencesOpen] = useState(false)

  const value = useMemo<ConsentContextValue>(
    () => ({
      consent,
      acceptAll: () => {
        setConsent(writeConsent({ preferences: true, analytics: true }))
        setPreferencesOpen(false)
      },
      rejectOptional: () => {
        setConsent(writeConsent({ preferences: false, analytics: false }))
        setPreferencesOpen(false)
      },
      saveConsent: (preferences) => {
        setConsent(writeConsent(preferences))
        setPreferencesOpen(false)
      },
      openPreferences: () => setPreferencesOpen(true),
    }),
    [consent],
  )

  return (
    <ConsentContext.Provider value={value}>
      {children}
      {!consent.decided && <ConsentBanner />}
      {preferencesOpen && (
        <ConsentDialog onClose={() => setPreferencesOpen(false)} />
      )}
    </ConsentContext.Provider>
  )
}

export function useConsent() {
  const context = useContext(ConsentContext)

  if (!context) {
    throw new Error("useConsent must be used inside ConsentProvider")
  }

  return context
}

function ConsentBanner() {
  const { acceptAll, rejectOptional, openPreferences } = useConsent()

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] border-t border-border/70 bg-background/95 px-5 py-4 shadow-[0_-20px_80px_-40px_hsl(var(--brand-violet)/0.6)] backdrop-blur-md sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-3">
          <span className="mt-1 flex h-9 w-9 flex-none items-center justify-center rounded-md border border-border/70 bg-card/60">
            <ShieldCheck className="h-4 w-4 text-foreground/90" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Soukromí a nastavení webu
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Nezbytné technologie zajišťují fungování webu. Volitelně můžete
              povolit uložení předvoleb a anonymní měření návštěvnosti.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="primary" onClick={acceptAll}>
            Povolit vše
          </Button>
          <Button type="button" variant="secondary" onClick={rejectOptional}>
            Odmítnout volitelné
          </Button>
          <Button type="button" variant="ghost" onClick={openPreferences}>
            Nastavit
          </Button>
        </div>
      </div>
    </div>
  )
}

interface ConsentDialogProps {
  onClose: () => void
}

function ConsentDialog({ onClose }: ConsentDialogProps) {
  const { consent, saveConsent } = useConsent()
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    preferences: consent.preferences,
    analytics: consent.analytics,
  })

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-background/75 px-5 py-5 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-dialog-title"
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-[var(--radius)] border border-border/70 bg-card shadow-[0_30px_100px_-40px_hsl(var(--brand-violet)/0.7)]">
        <div className="flex items-start justify-between gap-4 border-b border-border/70 p-5 sm:p-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <Settings2 className="h-4 w-4 text-foreground/90" aria-hidden />
              Nastavení
            </div>
            <h2
              id="consent-dialog-title"
              className="mt-2 font-display text-2xl font-semibold text-foreground"
            >
              Správa souhlasu
            </h2>
          </div>
          <button
            type="button"
            aria-label="Zavřít nastavení souhlasu"
            onClick={onClose}
            className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-md border border-border/70 bg-card/60 text-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:p-6">
          <ConsentOption
            title="Nezbytné technologie"
            description="Zajišťují bezpečné načtení webu, navigaci, základní cache prohlížeče a uložení samotné volby souhlasu."
            checked
            disabled
          />
          <ConsentOption
            title="Předvolby"
            description="Umožní zapamatovat zvolený tmavý, světlý nebo systémový režim v tomto prohlížeči."
            checked={preferences.preferences}
            onChange={(checked) =>
              setPreferences((current) => ({
                ...current,
                preferences: checked,
              }))
            }
          />
          <ConsentOption
            title="Analytika"
            description="Povolí anonymní měření návštěvnosti a výkonu přes Vercel Analytics a Speed Insights."
            checked={preferences.analytics}
            onChange={(checked) =>
              setPreferences((current) => ({ ...current, analytics: checked }))
            }
          />
        </div>

        <div className="flex flex-col gap-2 border-t border-border/70 p-5 sm:flex-row sm:justify-end sm:p-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => saveConsent({ preferences: false, analytics: false })}
          >
            Odmítnout volitelné
          </Button>
          <Button type="button" onClick={() => saveConsent(preferences)}>
            Uložit nastavení
          </Button>
        </div>
      </div>
    </div>
  )
}

interface ConsentOptionProps {
  title: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange?: (checked: boolean) => void
}

function ConsentOption({
  title,
  description,
  checked,
  disabled = false,
  onChange,
}: ConsentOptionProps) {
  return (
    <label
      className={cn(
        "flex items-start justify-between gap-4 rounded-[var(--radius)] border border-border/70 bg-background/40 p-4",
        disabled && "opacity-80",
      )}
    >
      <span>
        <span className="block text-sm font-semibold text-foreground">
          {title}
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.currentTarget.checked)}
        className="mt-1 h-5 w-5 flex-none accent-brand-violet"
      />
    </label>
  )
}
