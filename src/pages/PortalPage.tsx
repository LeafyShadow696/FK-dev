import { FormEvent, useEffect, useMemo, useState } from "react"
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  KeyRound,
  Loader2,
  LockKeyhole,
  LogOut,
  Server,
  ShieldCheck,
  Wifi,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import {
  backendRecommendation,
  portalIntegrations,
  portalPrinciples,
} from "@/data/adminPortal"
import { business } from "@/data/business"

type SessionState = "checking" | "configured" | "ready" | "authenticated"

type PortalOverview = {
  generatedAt: string
  environment: string
  project: {
    name: string
    canonicalUrl: string
    repository: string
  }
  integrations: Array<{
    id: string
    label: string
    configured: boolean
    description: string
  }>
  providers?: Array<{
    id: string
    label: string
    ok: boolean
    headline: string
    detail: string
    href?: string
    checkedAt: string
  }>
  configuredIntegrations: number
  checklist: string[]
}

async function readJson<T>(response: Response) {
  const text = await response.text()

  if (!text) {
    return {} as T
  }

  try {
    return JSON.parse(text) as T
  } catch {
    return {} as T
  }
}

function IntegrationCard({
  id,
  label,
  purpose,
  configured,
}: {
  id: string
  label: string
  purpose: string
  configured?: boolean
}) {
  const item = portalIntegrations.find((integration) => integration.id === id)
  const Icon = item?.icon ?? ShieldCheck

  return (
    <div className="rounded-[var(--radius)] border border-border/70 bg-card/45 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/70 bg-background/40">
            <Icon className="h-5 w-5 text-foreground/90" aria-hidden />
          </span>
          <div>
            <h3 className="font-display text-base font-semibold text-foreground">
              {label}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {purpose}
            </p>
          </div>
        </div>
        {typeof configured === "boolean" ? (
          <span className="shrink-0 rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
            {configured ? "Připraveno" : "Čeká"}
          </span>
        ) : null}
      </div>
    </div>
  )
}

function PortalSkeleton() {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center px-4">
      <div className="flex items-center gap-3 rounded-full border border-border/70 bg-card/50 px-5 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Kontroluji zabezpečení portálu
      </div>
    </div>
  )
}

function PortalUnavailable({ message }: { message: string }) {
  return (
    <main className="px-4 py-16 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl rounded-[var(--radius)] border border-border/70 bg-card/50 p-6 sm:p-8">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border/70 bg-background/40">
          <LockKeyhole className="h-5 w-5 text-foreground/90" aria-hidden />
        </span>
        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Admin portál čeká na bezpečné nastavení
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {message}
        </p>
        <div className="mt-6 rounded-[var(--radius)] border border-border/70 bg-background/35 p-4 text-sm leading-relaxed text-muted-foreground">
          Pro aktivaci nastav v produkčním prostředí proměnné{" "}
          <code className="text-foreground">FK_ADMIN_ACCESS_KEY</code> a{" "}
          <code className="text-foreground">FK_ADMIN_SESSION_SECRET</code>.
          Přístupový klíč musí mít minimálně 16 znaků, session secret minimálně
          32 znaků.
        </div>
      </section>
    </main>
  )
}

function PortalLogin({
  onAuthenticated,
}: {
  onAuthenticated: (overview: PortalOverview) => void
}) {
  const [accessKey, setAccessKey] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function loadOverview() {
    const response = await fetch("/api/admin/overview", {
      credentials: "include",
    })
    const data = await readJson<PortalOverview>(response)

    if (!response.ok) {
      throw new Error("Nepodařilo se načíst přehled portálu.")
    }

    onAuthenticated(data)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage("")

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessKey }),
      })
      const data = await readJson<{ message?: string }>(response)

      if (!response.ok) {
        setMessage(data.message ?? "Přihlášení se nepodařilo.")
        return
      }

      await loadOverview()
    } catch {
      setMessage("Portál teď není dostupný. Zkontroluj produkční API.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="px-4 py-12 sm:px-6 lg:px-8">
      <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div className="pt-4">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Soukromý portál
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Admin centrum pro{" "}
            <span className="brand-script signature-gradient">
              {business.legalName}
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Bezpečný základ pro správu projektu, kontrolu integrací a budoucí
            provozní dashboard. Citlivé tokeny zůstávají jen na serveru.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {portalPrinciples.map((item) => {
              const Icon = item.icon

              return (
                <article
                  key={item.title}
                  className="rounded-[var(--radius)] border border-border/70 bg-card/40 p-4"
                >
                  <Icon className="h-5 w-5 text-foreground/90" aria-hidden />
                  <h2 className="mt-4 text-sm font-semibold text-foreground">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.text}
                  </p>
                </article>
              )
            })}
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-[var(--radius)] border border-border/70 bg-card/55 p-5 shadow-[0_24px_80px_-48px_hsl(var(--brand-violet)/0.5)] sm:p-6"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border/70 bg-background/40">
              <KeyRound className="h-5 w-5 text-foreground/90" aria-hidden />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">
                Přihlášení správce
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Přístup je ověřený přes serverless API a HttpOnly cookie.
              </p>
            </div>
          </div>

          <label className="mt-6 block text-sm font-medium text-foreground">
            Admin přístupový klíč
            <input
              value={accessKey}
              onChange={(event) => setAccessKey(event.target.value)}
              type="password"
              autoComplete="current-password"
              minLength={16}
              className="mt-2 w-full rounded-[var(--radius)] border border-border/70 bg-background/50 px-4 py-3 text-base text-foreground outline-none transition focus:border-brand-violet/70"
              placeholder="Zadej bezpečný klíč"
              required
            />
          </label>

          {message ? (
            <p className="mt-4 rounded-[var(--radius)] border border-border/70 bg-background/35 px-4 py-3 text-sm text-muted-foreground">
              {message}
            </p>
          ) : null}

          <Button
            type="submit"
            className="mt-6 w-full"
            disabled={submitting || accessKey.length < 16}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <ArrowRight className="h-4 w-4" aria-hidden />
            )}
            Vstoupit do portálu
          </Button>
        </form>
      </section>
    </main>
  )
}

function PortalDashboard({
  overview,
  onLogout,
}: {
  overview: PortalOverview
  onLogout: () => void
}) {
  const integrationMap = useMemo(
    () => new Map(overview.integrations.map((item) => [item.id, item])),
    [overview.integrations],
  )
  const providers = overview.providers ?? []

  return (
    <main className="px-4 py-12 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 border-b border-border/70 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Admin portál
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Přehled projektu
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Soukromý provozní pohled na web, integrace a další kroky pro
              backendovou část projektu.
            </p>
          </div>
          <Button variant="secondary" onClick={onLogout}>
            <LogOut className="h-4 w-4" aria-hidden />
            Odhlásit
          </Button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-[var(--radius)] border border-border/70 bg-card/45 p-5">
            <p className="text-sm text-muted-foreground">Produkční doména</p>
            <p className="mt-3 text-lg font-semibold text-foreground">
              {overview.project.canonicalUrl}
            </p>
          </article>
          <article className="rounded-[var(--radius)] border border-border/70 bg-card/45 p-5">
            <p className="text-sm text-muted-foreground">Prostředí</p>
            <p className="mt-3 text-lg font-semibold text-foreground">
              {overview.environment}
            </p>
          </article>
          <article className="rounded-[var(--radius)] border border-border/70 bg-card/45 p-5">
            <p className="text-sm text-muted-foreground">Napojené integrace</p>
            <p className="mt-3 text-lg font-semibold text-foreground">
              {overview.configuredIntegrations} / {overview.integrations.length}
            </p>
          </article>
        </div>

        {providers.length > 0 ? (
          <section className="mt-8 rounded-[var(--radius)] border border-border/70 bg-card/45 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Wifi className="h-5 w-5 text-foreground/90" aria-hidden />
              <h2 className="font-display text-xl font-semibold text-foreground">
                Živý stav providerů
              </h2>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {providers.map((provider) => (
                <article
                  key={provider.id}
                  className="rounded-[var(--radius)] border border-border/60 bg-background/30 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {provider.label}
                      </p>
                      <h3 className="mt-2 font-display text-lg font-semibold text-foreground">
                        {provider.headline}
                      </h3>
                    </div>
                    <span className="w-fit rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
                      {provider.ok ? "Online" : "Nedostupné"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {provider.detail}
                  </p>
                  {provider.href ? (
                    <a
                      href={provider.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex text-sm font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      Otevřít detail
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {portalIntegrations.map((item) => {
            const status = integrationMap.get(item.id)

            return (
              <IntegrationCard
                key={item.id}
                id={item.id}
                label={item.label}
                purpose={status?.description ?? item.purpose}
                configured={status?.configured}
              />
            )
          })}
        </div>

        <section className="mt-8 rounded-[var(--radius)] border border-border/70 bg-card/45 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Server className="h-5 w-5 text-foreground/90" aria-hidden />
            <h2 className="font-display text-xl font-semibold text-foreground">
              Doporučená backend architektura
            </h2>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-[var(--radius)] border border-border/60 bg-background/30 p-4">
              <p className="text-sm text-muted-foreground">Runtime</p>
              <p className="mt-2 font-semibold text-foreground">
                {backendRecommendation.runtime}
              </p>
            </div>
            <div className="rounded-[var(--radius)] border border-border/60 bg-background/30 p-4">
              <p className="text-sm text-muted-foreground">Hosting</p>
              <p className="mt-2 font-semibold text-foreground">
                {backendRecommendation.hosting}
              </p>
            </div>
            <div className="rounded-[var(--radius)] border border-border/60 bg-background/30 p-4">
              <p className="text-sm text-muted-foreground">Databáze</p>
              <p className="mt-2 font-semibold text-foreground">
                {backendRecommendation.database}
              </p>
            </div>
            <div className="rounded-[var(--radius)] border border-border/60 bg-background/30 p-4">
              <p className="text-sm text-muted-foreground">Storage</p>
              <p className="mt-2 font-semibold text-foreground">
                {backendRecommendation.storage}
              </p>
            </div>
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {backendRecommendation.reason}
          </p>
        </section>

        <section className="mt-8 rounded-[var(--radius)] border border-border/70 bg-card/45 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-foreground/90" aria-hidden />
            <h2 className="font-display text-xl font-semibold text-foreground">
              Další implementační kroky
            </h2>
          </div>
          <div className="mt-5 grid gap-3">
            {overview.checklist.map((item) => (
              <div
                key={item}
                className="flex gap-3 rounded-[var(--radius)] border border-border/60 bg-background/30 p-4 text-sm leading-relaxed text-muted-foreground"
              >
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-foreground/90"
                  aria-hidden
                />
                {item}
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

export default function PortalPage() {
  const [state, setState] = useState<SessionState>("checking")
  const [message, setMessage] = useState("")
  const [overview, setOverview] = useState<PortalOverview | null>(null)

  async function loadOverview() {
    const response = await fetch("/api/admin/overview", {
      credentials: "include",
    })
    const data = await readJson<PortalOverview>(response)

    if (!response.ok) {
      throw new Error("Přihlášení vypršelo nebo portál není připravený.")
    }

    setOverview(data)
    setState("authenticated")
  }

  useEffect(() => {
    let active = true

    async function checkSession() {
      try {
        const response = await fetch("/api/admin/session", {
          credentials: "include",
        })
        const data = await readJson<{
          authenticated?: boolean
          ready?: boolean
          message?: string
        }>(response)

        if (!active) {
          return
        }

        if (response.status === 503 || data.ready === false) {
          setMessage(
            data.message ??
              "Admin přístup čeká na nastavení serverových proměnných.",
          )
          setState("configured")
          return
        }

        if (data.authenticated) {
          await loadOverview()
          return
        }

        setState("ready")
      } catch {
        if (active) {
          setMessage("Admin API teď není dostupné.")
          setState("configured")
        }
      }
    }

    void checkSession()

    return () => {
      active = false
    }
  }, [])

  async function logout() {
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    })
    setOverview(null)
    setState("ready")
  }

  if (state === "checking") {
    return <PortalSkeleton />
  }

  if (state === "configured") {
    return <PortalUnavailable message={message} />
  }

  if (state === "authenticated" && overview) {
    return <PortalDashboard overview={overview} onLogout={() => void logout()} />
  }

  return <PortalLogin onAuthenticated={(data) => {
    setOverview(data)
    setState("authenticated")
  }} />
}
