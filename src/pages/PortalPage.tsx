import { FormEvent, useEffect, useMemo, useState } from "react"
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  GitPullRequest,
  Globe2,
  History,
  KeyRound,
  Loader2,
  LockKeyhole,
  LogOut,
  ScrollText,
  Server,
  ShieldCheck,
  RotateCcw,
  Save,
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
  auditLogs?: Array<{
    id: string
    eventType: string
    actor: string
    metadata: Record<string, unknown>
    createdAt: string
  }>
  operations?: Array<{
    id: string
    label: string
    ok: boolean
    headline: string
    detail: string
    href?: string
    checkedAt: string
  }>
  providerSnapshots?: Array<{
    id: string
    source: string
    status: string
    summary: string
    payload: Record<string, unknown>
    createdAt: string
  }>
  contentBlocks?: Array<ContentBlock>
  contentVersions?: Array<ContentVersion>
  configuredIntegrations: number
  checklist: string[]
}

type ContentBlock = {
  key: string
  label: string
  area: string
  draftValue: string
  publishedValue: string
  updatedAt: string
  publishedAt: string | null
}

type ContentVersion = {
  id: string
  blockKey: string
  value: string
  action: string
  actor: string
  createdAt: string
}

const defaultContentBlocks: ContentBlock[] = [
  {
    key: "hero.lead",
    label: "Úvodní sdělení",
    area: "Úvod",
    draftValue:
      "Navrhuji a stavím weby, PWA, interní nástroje a automatizace pro podnikatele a menší firmy, které potřebují jasný výstup, rychlé spuštění a řešení použitelné i po předání.",
    publishedValue:
      "Navrhuji a stavím weby, PWA, interní nástroje a automatizace pro podnikatele a menší firmy, které potřebují jasný výstup, rychlé spuštění a řešení použitelné i po předání.",
    updatedAt: "",
    publishedAt: null,
  },
  {
    key: "services.positioning",
    label: "Pozice služeb",
    area: "Služby",
    draftValue:
      "Digitální řešení, automatizace a webové aplikace pro podnikatele a firmy, které chtějí srozumitelný výsledek bez zbytečné technické složitosti.",
    publishedValue:
      "Digitální řešení, automatizace a webové aplikace pro podnikatele a firmy, které chtějí srozumitelný výsledek bez zbytečné technické složitosti.",
    updatedAt: "",
    publishedAt: null,
  },
  {
    key: "contact.prompt",
    label: "Kontaktní výzva",
    area: "Kontakt",
    draftValue:
      "Pošlete stručně, co řešíte, jaký je současný stav a co má být na konci lepší. Pokud rozsah ještě neznáte, začneme konzultací.",
    publishedValue:
      "Pošlete stručně, co řešíte, jaký je současný stav a co má být na konci lepší. Pokud rozsah ještě neznáte, začneme konzultací.",
    updatedAt: "",
    publishedAt: null,
  },
]

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
  const [auditFilter, setAuditFilter] = useState("")
  const [auditLimit, setAuditLimit] = useState(8)
  const [snapshotStatus, setSnapshotStatus] = useState("all")
  const [snapshotLimit, setSnapshotLimit] = useState(8)
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>(() => {
    const stored = overview.contentBlocks ?? []

    return defaultContentBlocks.map((fallback) => {
      const current = stored.find((block) => block.key === fallback.key)

      return current ?? fallback
    })
  })
  const [selectedContentKey, setSelectedContentKey] = useState(
    defaultContentBlocks[0]?.key ?? "",
  )
  const [contentDraft, setContentDraft] = useState(
    contentBlocks[0]?.draftValue ?? "",
  )
  const [contentMode, setContentMode] = useState<"draft" | "published">("draft")
  const [contentMessage, setContentMessage] = useState("")
  const [savingContent, setSavingContent] = useState(false)
  const [contentVersions, setContentVersions] = useState<ContentVersion[]>(
    () => overview.contentVersions ?? [],
  )
  const [rollingBackVersionId, setRollingBackVersionId] = useState("")
  const providers = overview.providers ?? []
  const auditLogs = overview.auditLogs ?? []
  const operations = overview.operations ?? []
  const providerSnapshots = overview.providerSnapshots ?? []
  const selectedContent =
    contentBlocks.find((block) => block.key === selectedContentKey) ??
    contentBlocks[0]
  const selectedVersions = contentVersions.filter(
    (version) => version.blockKey === selectedContent?.key,
  )
  const hasContentDiff =
    Boolean(selectedContent) &&
    contentDraft.trim() !== selectedContent.publishedValue.trim()

  function formatAuditDate(value: string) {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return "neznámý čas"
    }

    return new Intl.DateTimeFormat("cs-CZ", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date)
  }

  function summarizeMetadata(metadata: Record<string, unknown>) {
    const entries = Object.entries(metadata)

    if (entries.length === 0) {
      return "Bez doplňujících dat"
    }

    return entries
      .slice(0, 3)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(" · ")
  }

  function statusLabel(ok: boolean) {
    return ok ? "V pořádku" : "Vyžaduje kontrolu"
  }

  function snapshotStatusLabel(status: string) {
    return status === "ok" ? "Stabilní" : "Zhoršený stav"
  }

  const filteredAuditLogs = useMemo(() => {
    const normalized = auditFilter.trim().toLowerCase()

    return auditLogs
      .filter((event) => {
        if (!normalized) {
          return true
        }

        return [
          event.eventType,
          event.actor,
          summarizeMetadata(event.metadata),
          event.id,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalized)
      })
      .slice(0, auditLimit)
  }, [auditFilter, auditLimit, auditLogs])

  const filteredProviderSnapshots = useMemo(
    () =>
      providerSnapshots
        .filter((snapshot) =>
          snapshotStatus === "all" ? true : snapshot.status === snapshotStatus,
        )
        .slice(0, snapshotLimit),
    [providerSnapshots, snapshotLimit, snapshotStatus],
  )

  function selectContentBlock(key: string) {
    const next = contentBlocks.find((block) => block.key === key)
    setSelectedContentKey(key)
    setContentDraft(next?.draftValue ?? "")
    setContentMessage("")
  }

  async function saveContentBlock(publish: boolean) {
    if (!selectedContent) {
      return
    }

    setSavingContent(true)
    setContentMessage("")

    try {
      const response = await fetch("/api/admin/content", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: selectedContent.key,
          label: selectedContent.label,
          area: selectedContent.area,
          draftValue: contentDraft,
          publish,
        }),
      })
      const data = await readJson<{
        block?: {
          key: string
          label: string
          area: string
          draft_value: string
          published_value: string
          updated_at: string
          published_at: string | null
        }
        versions?: Array<{
          id: string
          block_key: string
          value: string
          action: string
          actor: string
          created_at: string
        }>
      }>(response)

      if (!response.ok || !data.block) {
        setContentMessage("Obsah se nepodařilo uložit.")
        return
      }

      const nextBlock: ContentBlock = {
        key: data.block.key,
        label: data.block.label,
        area: data.block.area,
        draftValue: data.block.draft_value,
        publishedValue: data.block.published_value,
        updatedAt: data.block.updated_at,
        publishedAt: data.block.published_at,
      }

      setContentBlocks((current) =>
        current.map((block) =>
          block.key === nextBlock.key ? nextBlock : block,
        ),
      )
      if (Array.isArray(data.versions)) {
        setContentVersions(
          data.versions.map((version) => ({
            id: version.id,
            blockKey: version.block_key,
            value: version.value,
            action: version.action,
            actor: version.actor,
            createdAt: version.created_at,
          })),
        )
      }
      setContentDraft(nextBlock.draftValue)
      setContentMessage(
        publish
          ? "Draft je uložený a označený jako publikovaný."
          : "Draft je uložený pro další kontrolu.",
      )
    } catch {
      setContentMessage("Admin API teď neuložilo obsah. Zkuste to znovu.")
    } finally {
      setSavingContent(false)
    }
  }

  async function rollbackContentVersion(versionId: string) {
    setRollingBackVersionId(versionId)
    setContentMessage("")

    try {
      const response = await fetch("/api/admin/content-rollback", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      })
      const data = await readJson<{
        block?: {
          key: string
          label: string
          area: string
          draft_value: string
          published_value: string
          updated_at: string
          published_at: string | null
        }
        versions?: Array<{
          id: string
          block_key: string
          value: string
          action: string
          actor: string
          created_at: string
        }>
      }>(response)

      if (!response.ok || !data.block) {
        setContentMessage("Publikovanou verzi se nepodařilo obnovit.")
        return
      }

      const nextBlock: ContentBlock = {
        key: data.block.key,
        label: data.block.label,
        area: data.block.area,
        draftValue: data.block.draft_value,
        publishedValue: data.block.published_value,
        updatedAt: data.block.updated_at,
        publishedAt: data.block.published_at,
      }

      setContentBlocks((current) =>
        current.map((block) =>
          block.key === nextBlock.key ? nextBlock : block,
        ),
      )
      if (Array.isArray(data.versions)) {
        setContentVersions(
          data.versions.map((version) => ({
            id: version.id,
            blockKey: version.block_key,
            value: version.value,
            action: version.action,
            actor: version.actor,
            createdAt: version.created_at,
          })),
        )
      }
      setSelectedContentKey(nextBlock.key)
      setContentDraft(nextBlock.draftValue)
      setContentMode("published")
      setContentMessage("Vybraná verze je obnovená jako publikovaný snapshot.")
    } catch {
      setContentMessage("Rollback teď není dostupný. Zkuste to znovu.")
    } finally {
      setRollingBackVersionId("")
    }
  }

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

        {selectedContent ? (
          <section className="mt-8 rounded-[var(--radius)] border border-border/70 bg-card/45 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-foreground/90" aria-hidden />
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    Content studio
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Bezpečný draft editor pro vybrané texty landing page s živým náhledem.
                  </p>
                </div>
              </div>
              <span className="w-fit rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
                {contentBlocks.length} bloky
              </span>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="grid gap-3">
                {contentBlocks.map((block) => (
                  <button
                    key={block.key}
                    type="button"
                    onClick={() => selectContentBlock(block.key)}
                    className={`rounded-[var(--radius)] border p-4 text-left transition ${
                      block.key === selectedContent.key
                        ? "border-brand-violet/60 bg-background/50"
                        : "border-border/60 bg-background/25 hover:bg-background/40"
                    }`}
                  >
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {block.area}
                    </span>
                    <span className="mt-2 block font-display text-base font-semibold text-foreground">
                      {block.label}
                    </span>
                    <span className="mt-2 line-clamp-2 block text-sm leading-relaxed text-muted-foreground">
                      {block.draftValue}
                    </span>
                  </button>
                ))}
              </div>

              <div className="grid gap-4">
                <label className="text-sm font-medium text-foreground">
                  Draft text
                  <textarea
                    value={contentDraft}
                    onChange={(event) => setContentDraft(event.target.value)}
                    rows={7}
                    maxLength={4000}
                    className="mt-2 w-full resize-y rounded-[var(--radius)] border border-border/70 bg-background/50 px-4 py-3 text-sm leading-relaxed text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-brand-violet/70"
                  />
                </label>

                <div className="rounded-[var(--radius)] border border-border/60 bg-background/30 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Eye className="h-4 w-4" aria-hidden />
                      Živý náhled
                    </div>
                    <div className="inline-flex w-fit rounded-full border border-border/70 bg-background/40 p-1">
                      <button
                        type="button"
                        onClick={() => setContentMode("draft")}
                        className={`rounded-full px-3 py-1 text-xs transition ${
                          contentMode === "draft"
                            ? "bg-card text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        Draft
                      </button>
                      <button
                        type="button"
                        onClick={() => setContentMode("published")}
                        className={`rounded-full px-3 py-1 text-xs transition ${
                          contentMode === "published"
                            ? "bg-card text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        Publikováno
                      </button>
                    </div>
                  </div>
                  <p className="mt-4 text-base leading-relaxed text-foreground/90">
                    {contentMode === "draft"
                      ? contentDraft
                      : selectedContent.publishedValue || "Zatím není publikovaná verze."}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    Poslední uložení:{" "}
                    {selectedContent.updatedAt
                      ? formatAuditDate(selectedContent.updatedAt)
                      : "zatím jen výchozí lokální návrh"}
                  </p>
                </div>

                <div className="rounded-[var(--radius)] border border-border/60 bg-background/30 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <History className="h-4 w-4" aria-hidden />
                    Publikační historie
                  </div>

                  {hasContentDiff ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-border/60 bg-background/25 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Publikováno
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {selectedContent.publishedValue || "Bez publikované verze."}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-background/25 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Draft
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                          {contentDraft}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      Draft odpovídá aktuálně publikovanému snapshotu.
                    </p>
                  )}

                  <div className="mt-4 grid gap-3">
                    {selectedVersions.length > 0 ? (
                      selectedVersions.slice(0, 5).map((version) => (
                        <article
                          key={version.id}
                          className="rounded-lg border border-border/60 bg-background/25 p-3"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                {version.action} · {formatAuditDate(version.createdAt)}
                              </p>
                              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                                {version.value}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => void rollbackContentVersion(version.id)}
                              disabled={Boolean(rollingBackVersionId)}
                            >
                              {rollingBackVersionId === version.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                              ) : (
                                <RotateCcw className="h-4 w-4" aria-hidden />
                              )}
                              Obnovit
                            </Button>
                          </div>
                        </article>
                      ))
                    ) : (
                      <p className="rounded-lg border border-border/60 bg-background/25 p-3 text-sm leading-relaxed text-muted-foreground">
                        Historie se vytvoří po první publikaci snapshotu.
                      </p>
                    )}
                  </div>
                </div>

                {contentMessage ? (
                  <p className="rounded-[var(--radius)] border border-border/60 bg-background/30 px-4 py-3 text-sm text-muted-foreground">
                    {contentMessage}
                  </p>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void saveContentBlock(false)}
                    disabled={savingContent || contentDraft.trim().length === 0}
                  >
                    {savingContent ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Save className="h-4 w-4" aria-hidden />
                    )}
                    Uložit draft
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void saveContentBlock(true)}
                    disabled={savingContent || contentDraft.trim().length === 0}
                  >
                    Publikovat snapshot
                  </Button>
                </div>
              </div>
            </div>
          </section>
        ) : null}

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

        {operations.length > 0 ? (
          <section className="mt-8 rounded-[var(--radius)] border border-border/70 bg-card/45 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <GitPullRequest className="h-5 w-5 text-foreground/90" aria-hidden />
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Provozní kontroly
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Poslední workflow a doménové kontroly načtené server-side.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {operations.map((operation) => {
                const Icon = operation.label.includes("domén")
                  ? Globe2
                  : GitPullRequest

                return (
                  <article
                    key={operation.id}
                    className="rounded-[var(--radius)] border border-border/60 bg-background/30 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-3">
                        <Icon
                          className="mt-0.5 h-4 w-4 shrink-0 text-foreground/90"
                          aria-hidden
                        />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {operation.label}
                          </p>
                          <h3 className="mt-2 font-display text-base font-semibold text-foreground">
                            {operation.headline}
                          </h3>
                        </div>
                      </div>
                      <span className="w-fit rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
                        {statusLabel(operation.ok)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {operation.detail}
                    </p>
                    {operation.href ? (
                      <a
                        href={operation.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex text-sm font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        Otevřít detail
                      </a>
                    ) : null}
                  </article>
                )
              })}
            </div>
          </section>
        ) : null}

        {providerSnapshots.length > 0 ? (
          <section className="mt-8 rounded-[var(--radius)] border border-border/70 bg-card/45 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-foreground/90" aria-hidden />
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    Historie provozu
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Poslední uložené snapshoty provider kontrol v PostgreSQL.
                  </p>
                </div>
              </div>
              <span className="w-fit rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
                {filteredProviderSnapshots.length} / {providerSnapshots.length}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="text-sm font-medium text-foreground">
                Stav
                <select
                  value={snapshotStatus}
                  onChange={(event) => setSnapshotStatus(event.target.value)}
                  className="mt-2 w-full rounded-[var(--radius)] border border-border/70 bg-background/50 px-3 py-2 text-sm text-foreground outline-none transition focus:border-brand-violet/70"
                >
                  <option value="all">Všechny stavy</option>
                  <option value="ok">Stabilní</option>
                  <option value="degraded">Zhoršený stav</option>
                </select>
              </label>
              <label className="text-sm font-medium text-foreground">
                Počet
                <select
                  value={snapshotLimit}
                  onChange={(event) => setSnapshotLimit(Number(event.target.value))}
                  className="mt-2 w-full rounded-[var(--radius)] border border-border/70 bg-background/50 px-3 py-2 text-sm text-foreground outline-none transition focus:border-brand-violet/70"
                >
                  <option value={5}>5</option>
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                  <option value={20}>20</option>
                </select>
              </label>
            </div>

            <div className="mt-5 grid gap-3">
              {filteredProviderSnapshots.map((snapshot) => (
                <article
                  key={snapshot.id}
                  className="rounded-[var(--radius)] border border-border/60 bg-background/30 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {snapshot.source} · {formatAuditDate(snapshot.createdAt)}
                      </p>
                      <h3 className="mt-2 font-display text-base font-semibold text-foreground">
                        {snapshot.summary}
                      </h3>
                    </div>
                    <span className="w-fit rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
                      {snapshotStatusLabel(snapshot.status)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-8 rounded-[var(--radius)] border border-border/70 bg-card/45 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <ScrollText className="h-5 w-5 text-foreground/90" aria-hidden />
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Audit log
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Poslední backendové události uložené v PostgreSQL.
                </p>
              </div>
            </div>
            <span className="w-fit rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
              {filteredAuditLogs.length} / {auditLogs.length}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="text-sm font-medium text-foreground">
              Filtr
              <input
                value={auditFilter}
                onChange={(event) => setAuditFilter(event.target.value)}
                className="mt-2 w-full rounded-[var(--radius)] border border-border/70 bg-background/50 px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-brand-violet/70"
                placeholder="Typ, aktér nebo metadata"
              />
            </label>
            <label className="text-sm font-medium text-foreground">
              Počet
              <select
                value={auditLimit}
                onChange={(event) => setAuditLimit(Number(event.target.value))}
                className="mt-2 w-full rounded-[var(--radius)] border border-border/70 bg-background/50 px-3 py-2 text-sm text-foreground outline-none transition focus:border-brand-violet/70"
              >
                <option value={5}>5</option>
                <option value={8}>8</option>
                <option value={12}>12</option>
                <option value={20}>20</option>
              </select>
            </label>
          </div>

          {filteredAuditLogs.length > 0 ? (
            <div className="mt-5 grid gap-3">
              {filteredAuditLogs.map((event) => (
                <article
                  key={event.id}
                  className="rounded-[var(--radius)] border border-border/60 bg-background/30 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-display text-base font-semibold text-foreground">
                        {event.eventType}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {event.actor} · {formatAuditDate(event.createdAt)}
                      </p>
                    </div>
                    <code className="w-fit rounded-md border border-border/60 bg-background/35 px-2 py-1 text-xs text-muted-foreground">
                      {event.id.slice(0, 8)}
                    </code>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {summarizeMetadata(event.metadata)}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[var(--radius)] border border-border/60 bg-background/30 p-4 text-sm leading-relaxed text-muted-foreground">
              {auditLogs.length > 0
                ? "Žádná událost neodpovídá aktuálnímu filtru."
                : "Audit log je připravený. Události se zobrazí po prvních backendových zápisech nebo po dalším produkčním smoke ověření."}
            </div>
          )}
        </section>

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
