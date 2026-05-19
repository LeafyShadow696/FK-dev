import { FormEvent, useEffect, useMemo, useState } from "react"
import {
  Activity,
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  Clock3,
  ClipboardCopy,
  Download,
  Eye,
  FileText,
  GitPullRequest,
  Globe2,
  HardDrive,
  History,
  KeyRound,
  ListChecks,
  Loader2,
  LockKeyhole,
  LogOut,
  Plus,
  Printer,
  ScrollText,
  Server,
  ShieldCheck,
  RotateCcw,
  Save,
  Search,
  Send,
  Trash2,
  Wand2,
  Wifi,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import {
  backendRecommendation,
  portalIntegrations,
} from "@/data/adminPortal"

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
  telemetry?: {
    activeSessions: number
    events15m: number
    events60m: number
    topPages: Array<{
      path: string
      visits: number
      lastSeenAt: string
    }>
    recentEvents: Array<{
      eventType: string
      path: string
      referrer: string | null
      viewport: string | null
      createdAt: string
    }>
  }
  contentBlocks?: Array<ContentBlock>
  contentVersions?: Array<ContentVersion>
  opportunities?: Array<OpportunityItem>
  officialDrafts?: Array<OfficialDraftItem>
  configuredIntegrations: number
  checklist: string[]
}

type OpportunityItem = {
  id: string
  sourceId: string
  category: string
  title: string
  summary: string
  url: string
  region: string
  status: string
  deadline: string | null
  score: number
  matchReasons: string[]
  nextAction: string
  metadata: Record<string, unknown>
  workflowStatus: string
  adminNotes: string
  checklist: OpportunityChecklistItem[]
  nextReviewAt: string | null
  decisionUpdatedAt: string | null
  firstSeenAt: string
  lastSeenAt: string
}

type OpportunityChecklistItem = {
  id: string
  label: string
  done: boolean
}

type OfficialDraftItem = {
  id: string
  opportunityId: string | null
  purpose: string
  recipient: string
  subject: string
  body: string
  attachments: OpportunityChecklistItem[]
  reviewStatus: string
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
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

type ContentQuality = {
  status: string
  issues: Array<{
    severity: string
    code: string
    message: string
  }>
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

const adminIdentityProfile = {
  displayName: "František Kalášek",
  businessName: "František Kalášek",
  ico: "23628588",
  address: "592 03 Dankovice 9",
  brand: "FKdev / TopBot PwnZ(TM)",
  services:
    "vývoj webových aplikací, PWA, automatizace, API integrace, datové zpracování, hosting/webové portály a IT konzultace",
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

function isJsonResponse(response: Response) {
  return response.headers.get("content-type")?.includes("application/json")
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function fetchPortalOverview() {
  let lastData: PortalOverview | null = null

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`/api/admin/overview?ts=${Date.now()}-${attempt}`, {
      credentials: "include",
      cache: "no-store",
    })

    if (!isJsonResponse(response)) {
      throw new Error("Admin API nevrátilo JSON odpověď.")
    }

    const data = await readJson<PortalOverview>(response)

    if (!response.ok) {
      throw new Error("Přihlášení vypršelo nebo portál není připravený.")
    }

    lastData = data

    if ((data.opportunities?.length ?? 0) > 0 || attempt === 2) {
      return data
    }

    await delay(700)
  }

  return lastData as PortalOverview
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
    <main className="flex min-h-[70dvh] items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <section className="w-full max-w-sm rounded-[var(--radius)] border border-border/70 bg-card/55 p-5 shadow-[0_24px_80px_-48px_hsl(var(--brand-violet)/0.5)] sm:p-6">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-border/70 bg-background/40">
          <LockKeyhole className="h-5 w-5 text-foreground/90" aria-hidden />
        </span>
        <h1 className="mt-5 text-center font-display text-2xl font-semibold tracking-tight text-foreground">
          Admin portál
        </h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>
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
    onAuthenticated(await fetchPortalOverview())
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

      if (!isJsonResponse(response)) {
        throw new Error("Admin API nevrátilo JSON odpověď.")
      }

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
    <main className="flex min-h-[70dvh] items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <section className="w-full max-w-sm">
        <form
          onSubmit={onSubmit}
          className="rounded-[var(--radius)] border border-border/70 bg-card/55 p-5 shadow-[0_24px_80px_-48px_hsl(var(--brand-violet)/0.5)] sm:p-6"
        >
          <div className="text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-border/70 bg-background/40">
              <KeyRound className="h-5 w-5 text-foreground/90" aria-hidden />
            </span>
            <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-foreground">
              Admin portál
            </h1>
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
  const [checkingContent, setCheckingContent] = useState(false)
  const [contentQuality, setContentQuality] = useState<ContentQuality | null>(null)
  const [contentVersions, setContentVersions] = useState<ContentVersion[]>(
    () => overview.contentVersions ?? [],
  )
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>(
    () => overview.opportunities ?? [],
  )
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(
    () => overview.opportunities?.[0]?.id ?? "",
  )
  const [opportunityWorkflowStatus, setOpportunityWorkflowStatus] = useState(
    () => overview.opportunities?.[0]?.workflowStatus ?? "new",
  )
  const [opportunityNotes, setOpportunityNotes] = useState(
    () => overview.opportunities?.[0]?.adminNotes ?? "",
  )
  const [opportunityChecklist, setOpportunityChecklist] = useState<OpportunityChecklistItem[]>(
    () => overview.opportunities?.[0]?.checklist ?? [],
  )
  const [opportunityNextReviewAt, setOpportunityNextReviewAt] = useState(
    () => overview.opportunities?.[0]?.nextReviewAt?.slice(0, 16) ?? "",
  )
  const [savingOpportunityWorkflow, setSavingOpportunityWorkflow] = useState(false)
  const [refreshingOpportunities, setRefreshingOpportunities] = useState(false)
  const [opportunityMessage, setOpportunityMessage] = useState("")
  const [opportunitySearch, setOpportunitySearch] = useState("")
  const [opportunityWorkflowFilter, setOpportunityWorkflowFilter] = useState("all")
  const [opportunityCategoryFilter, setOpportunityCategoryFilter] = useState("all")
  const [opportunitySourceFilter, setOpportunitySourceFilter] = useState("all")
  const [opportunityDeadlineFilter, setOpportunityDeadlineFilter] = useState("all")
  const [opportunityReportCopied, setOpportunityReportCopied] = useState(false)
  const [officialPurpose, setOfficialPurpose] = useState("eligibility_question")
  const [officialRecipient, setOfficialRecipient] = useState("")
  const [officialSubject, setOfficialSubject] = useState("")
  const [officialDraft, setOfficialDraft] = useState("")
  const [officialAttachments, setOfficialAttachments] = useState<
    OpportunityChecklistItem[]
  >([])
  const [officialDraftId, setOfficialDraftId] = useState("")
  const [officialDrafts, setOfficialDrafts] = useState<OfficialDraftItem[]>(
    () => overview.officialDrafts ?? [],
  )
  const [savingOfficialDraft, setSavingOfficialDraft] = useState(false)
  const [archivingOfficialDraft, setArchivingOfficialDraft] = useState(false)
  const [runningOfficialAgent, setRunningOfficialAgent] = useState(false)
  const [officialMessage, setOfficialMessage] = useState("")
  const [officialDraftCopied, setOfficialDraftCopied] = useState(false)
  const [rollingBackVersionId, setRollingBackVersionId] = useState("")
  const providers = overview.providers ?? []
  const auditLogs = overview.auditLogs ?? []
  const operations = overview.operations ?? []
  const providerSnapshots = overview.providerSnapshots ?? []
  const isdsIntegration = overview.integrations.find((item) => item.id === "isds")
  const storageIntegration = overview.integrations.find((item) => item.id === "storage")
  const telemetry = overview.telemetry ?? {
    activeSessions: 0,
    events15m: 0,
    events60m: 0,
    topPages: [],
    recentEvents: [],
  }
  const selectedContent =
    contentBlocks.find((block) => block.key === selectedContentKey) ??
    contentBlocks[0]
  const selectedVersions = contentVersions.filter(
    (version) => version.blockKey === selectedContent?.key,
  )
  const hasContentDiff =
    Boolean(selectedContent) &&
    contentDraft.trim() !== selectedContent.publishedValue.trim()
  const selectedOpportunity =
    opportunities.find((item) => item.id === selectedOpportunityId) ??
    opportunities[0]

  useEffect(() => {
    const nextOpportunities = overview.opportunities ?? []
    setOpportunities(nextOpportunities)

    if (nextOpportunities.length === 0) {
      setSelectedOpportunityId("")
      return
    }

    setSelectedOpportunityId((current) =>
      nextOpportunities.some((item) => item.id === current)
        ? current
        : nextOpportunities[0].id,
    )
  }, [overview.opportunities])

  useEffect(() => {
    setOfficialDrafts(overview.officialDrafts ?? [])
  }, [overview.officialDrafts])

  useEffect(() => {
    if (!selectedOpportunity && opportunities[0]) {
      setSelectedOpportunityId(opportunities[0].id)
    }
  }, [opportunities, selectedOpportunity])

  useEffect(() => {
    if (!selectedOpportunity) {
      return
    }

    setOpportunityWorkflowStatus(selectedOpportunity.workflowStatus)
    setOpportunityNotes(selectedOpportunity.adminNotes)
    setOpportunityChecklist(selectedOpportunity.checklist)
    setOpportunityNextReviewAt(selectedOpportunity.nextReviewAt?.slice(0, 16) ?? "")
  }, [selectedOpportunity])

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

  function formatOpportunityDeadline(value: string) {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return value
    }

    return new Intl.DateTimeFormat("cs-CZ", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date)
  }

  function summarizeMetadata(metadata: Record<string, unknown>) {
    const entries = Object.entries(metadata).filter(
      ([key, value]) =>
        !["profile", "attempted_sources", "context"].includes(key) &&
        value !== null &&
        typeof value !== "object",
    )

    if (entries.length === 0) {
      return "Bez doplňujících dat"
    }

    return entries
      .slice(0, 3)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(" · ")
  }

  function opportunitySourceLabel(metadata: Record<string, unknown>) {
    const sourceType = String(metadata.source_type ?? "")

    if (sourceType === "api_optak_import") {
      return "OP TAK import"
    }

    if (sourceType === "api_optak_import_status") {
      return "OP TAK stav"
    }

    if (sourceType === "mpsv_import") {
      return "MPSV import"
    }

    if (sourceType === "mpsv_import_status") {
      return "MPSV stav"
    }

    if (sourceType === "nen_import_status") {
      return "NEN stav"
    }

    if (sourceType === "nen_import") {
      return "NEN import"
    }

    if (sourceType === "curated_watch") {
      return "Watchlist"
    }

    return "Zdroj"
  }

  function opportunitySourceKey(item: OpportunityItem) {
    return String(item.metadata.source_type ?? "curated_watch")
  }

  function csvCell(value: string | number | null | undefined) {
    const text = String(value ?? "")
    return `"${text.replace(/"/g, '""')}"`
  }

  function downloadTextFile(filename: string, content: string, type = "text/plain") {
    const blob = new Blob([content], { type: `${type};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  function statusLabel(ok: boolean) {
    return ok ? "V pořádku" : "Vyžaduje kontrolu"
  }

  function qualityStatusLabel(status: string) {
    if (status === "passed") {
      return "Bez nálezu"
    }

    if (status === "warning") {
      return "Doporučení"
    }

    return "Blokováno"
  }

  function snapshotStatusLabel(status: string) {
    return status === "ok" ? "Stabilní" : "Zhoršený stav"
  }

  function opportunityCategoryLabel(category: string) {
    if (category === "grant") {
      return "Dotace"
    }

    if (category === "public_procurement") {
      return "Zakázky"
    }

    if (category === "market_signal") {
      return "Tržní signál"
    }

    if (category === "eu_call") {
      return "EU výzva"
    }

    return "Sledování"
  }

  function opportunityWorkflowLabel(status: string) {
    const labels: Record<string, string> = {
      new: "Nové",
      verify: "Ověřit",
      good_fit: "Vhodné",
      not_fit: "Nevhodné",
      in_progress: "Rozpracováno",
      submitted: "Podáno / osloveno",
    }

    return labels[status] ?? "Ověřit"
  }

  function officialPurposeLabel(purpose: string) {
    const labels: Record<string, string> = {
      eligibility_question: "Dotaz k podmínkám",
      grant_application: "Žádost / záměr",
      supplement: "Doplnění podkladů",
      authority_reply: "Odpověď úřadu",
      procurement_question: "Dotaz k zakázce",
    }

    return labels[purpose] ?? "Dotaz k podmínkám"
  }

  function officialReviewStatusLabel(status: string) {
    const labels: Record<string, string> = {
      draft: "Rozpracováno",
      ready_for_review: "Ke kontrole",
      ready_for_isds: "Připraveno pro DS",
      sent_manually: "Odesláno ručně",
      archived: "Archiv",
    }

    return labels[status] ?? "Rozpracováno"
  }

  function suggestedOpportunityChecklist(item: OpportunityItem): OpportunityChecklistItem[] {
    const base = [
      "Ověřit aktuální detail zdroje a deadline",
      "Zkontrolovat shodu se službami FKdev",
    ]
    const byCategory: Record<string, string[]> = {
      grant: [
        "Ověřit oprávněnost podle IČO, sídla a velikosti podniku",
        "Zapsat požadované přílohy a finanční spoluúčast",
      ],
      eu_call: [
        "Ověřit typ žadatele a nutnost partnerů",
        "Rozhodnout, zda jít samostatně nebo jako subdodavatel",
      ],
      public_procurement: [
        "Ověřit kvalifikační podmínky a reference",
        "Zkontrolovat lhůtu, rozpočet a způsob podání nabídky",
      ],
      market_signal: [
        "Dohledat firmu nebo regionální kontext",
        "Připravit krátké oslovení s relevantní službou",
      ],
    }

    return [...base, ...(byCategory[item.category] ?? [])].map((label) => ({
      id: `suggested-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      label,
      done: false,
    }))
  }

  function suggestedOfficialAttachments(item?: OpportunityItem | null) {
    const base = [
      "Identifikace žadatele: jméno, IČO, sídlo",
      "Stručný popis záměru a poskytovaných služeb",
      "Kontaktní údaje pro zpětnou odpověď",
    ]
    const categorySpecific: Record<string, string[]> = {
      grant: [
        "Popis projektu nebo investičního záměru",
        "Předběžný rozpočet a plán financování",
      ],
      eu_call: [
        "Popis role žadatele nebo partnera",
        "Shrnutí relevantních zkušeností a technické kapacity",
      ],
      public_procurement: [
        "Dotaz k zadávací dokumentaci nebo kvalifikačním podmínkám",
        "Reference nebo stručný profil dodavatele",
      ],
      market_signal: [
        "Návrh oslovení a relevantní nabídka služeb",
        "Odkaz na web nebo portfolio",
      ],
    }

    return [...base, ...(item ? categorySpecific[item.category] ?? [] : [])].map(
      (label) => ({
        id: `official-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        label,
        done: false,
      }),
    )
  }

  async function refreshOpportunities() {
    setRefreshingOpportunities(true)
    setOpportunityMessage("")

    try {
      const response = await fetch("/api/admin/opportunities-refresh", {
        method: "POST",
        credentials: "include",
      })
      const data = await readJson<{
        opportunities?: OpportunityItem[]
        count?: number
        message?: string
      }>(response)

      if (!response.ok || !Array.isArray(data.opportunities)) {
        setOpportunityMessage(data.message ?? "Radar se nepodařilo obnovit.")
        return
      }

      setOpportunities(data.opportunities)
      if (!selectedOpportunityId && data.opportunities[0]) {
        setSelectedOpportunityId(data.opportunities[0].id)
      }
      setOpportunityMessage(`Radar obnoven: ${data.count ?? data.opportunities.length} zdrojů.`)
    } catch {
      setOpportunityMessage("Radar teď není dostupný. Zkuste to znovu.")
    } finally {
      setRefreshingOpportunities(false)
    }
  }

  function selectOpportunity(item: OpportunityItem) {
    setSelectedOpportunityId(item.id)
    setOpportunityMessage("")
  }

  function addOpportunityChecklistItem(label = "") {
    setOpportunityChecklist((current) => [
      ...current,
      {
        id: `local-${Date.now()}-${current.length}`,
        label,
        done: false,
      },
    ])
  }

  function updateOpportunityChecklistItem(
    itemId: string,
    patch: Partial<OpportunityChecklistItem>,
  ) {
    setOpportunityChecklist((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item,
      ),
    )
  }

  function removeOpportunityChecklistItem(itemId: string) {
    setOpportunityChecklist((current) =>
      current.filter((item) => item.id !== itemId),
    )
  }

  function createOpportunityChecklist() {
    if (!selectedOpportunity) {
      return
    }

    setOpportunityChecklist((current) =>
      current.length > 0 ? current : suggestedOpportunityChecklist(selectedOpportunity),
    )
  }

  function generateOpportunityDraft() {
    if (!selectedOpportunity) {
      return
    }

    const deadline = selectedOpportunity.deadline
      ? formatOpportunityDeadline(selectedOpportunity.deadline)
      : "není uveden"
    const checklist = opportunityChecklist.length > 0
      ? opportunityChecklist
      : suggestedOpportunityChecklist(selectedOpportunity)

    setOpportunityChecklist(checklist)
    setOpportunityNotes(
      [
        `Shrnutí: ${selectedOpportunity.title}`,
        `Kategorie: ${opportunityCategoryLabel(selectedOpportunity.category)}`,
        `Deadline: ${deadline}`,
        `Relevantnost: skóre ${selectedOpportunity.score}; ${selectedOpportunity.matchReasons.slice(0, 2).join(" ")}`,
        `Doporučený další krok: ${selectedOpportunity.nextAction}`,
        "",
        "Návrh oslovení / interní poznámka:",
        `Dobrý den, narazil jsem na Vaši položku „${selectedOpportunity.title}“. Mohu pomoct s webovou aplikací, automatizací, integrací API nebo technickou konzultací podle rozsahu zadání. Rád rychle ověřím, zda dává smysl navrhnout konkrétní postup.`,
      ].join("\n"),
    )
  }

  function exportFilteredOpportunities() {
    const rows = filteredOpportunities.map((item) => [
      item.title,
      opportunityCategoryLabel(item.category),
      opportunityWorkflowLabel(item.workflowStatus),
      opportunitySourceLabel(item.metadata),
      item.region,
      item.score,
      item.deadline ? formatOpportunityDeadline(item.deadline) : "",
      item.status,
      item.nextAction,
      item.url,
    ])
    const header = [
      "Nazev",
      "Kategorie",
      "Workflow",
      "Zdroj",
      "Region",
      "Skore",
      "Deadline",
      "Stav zdroje",
      "Dalsi krok",
      "URL",
    ]
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => csvCell(cell)).join(","))
      .join("\r\n")
    downloadTextFile(
      `fkdev-opportunity-radar-${new Date().toISOString().slice(0, 10)}.csv`,
      `\uFEFF${csv}`,
      "text/csv",
    )
    setOpportunityMessage(`Exportováno ${filteredOpportunities.length} položek do CSV.`)
  }

  async function copyOpportunityReport() {
    try {
      await navigator.clipboard.writeText(opportunityReport)
      setOpportunityReportCopied(true)
      setOpportunityMessage("Souhrn příležitostí je zkopírovaný do schránky.")
      window.setTimeout(() => setOpportunityReportCopied(false), 1800)
    } catch {
      setOpportunityMessage("Souhrn se nepodařilo zkopírovat. Použijte ruční výběr textu.")
    }
  }

  function downloadOpportunityReport() {
    downloadTextFile(
      `fkdev-opportunity-report-${new Date().toISOString().slice(0, 10)}.md`,
      opportunityReport,
      "text/markdown",
    )
    setOpportunityMessage("Souhrn příležitostí je stažený jako Markdown.")
  }

  function generateOfficialDraft() {
    const item = selectedOpportunity
    const purpose = officialPurposeLabel(officialPurpose)
    const inferredSubject = item
      ? `${purpose}: ${item.title}`
      : `${purpose}: ověření podmínek a dalšího postupu`
    const recipient =
      officialRecipient.trim() ||
      (item?.metadata.provider
        ? String(item.metadata.provider)
        : "Příslušný úřad / poskytovatel výzvy")
    const deadline = item?.deadline
      ? formatOpportunityDeadline(item.deadline)
      : "není uveden"
    const reasons = item?.matchReasons.slice(0, 3).join(" ") || ""
    const attachments =
      officialAttachments.length > 0
        ? officialAttachments
        : suggestedOfficialAttachments(item)

    setOfficialRecipient(recipient)
    setOfficialSubject(inferredSubject)
    setOfficialAttachments(attachments)
    setOfficialDraftId("")
    setOfficialDraft(
      [
        `Adresát: ${recipient}`,
        `Věc: ${inferredSubject}`,
        "",
        "Dobrý den,",
        "",
        `obracím se na Vás jako ${adminIdentityProfile.businessName}, IČO ${adminIdentityProfile.ico}, se sídlem ${adminIdentityProfile.address}. Působím pod značkou ${adminIdentityProfile.brand} a zaměřuji se na ${adminIdentityProfile.services}.`,
        "",
        item
          ? `Rád bych ověřil další postup k položce „${item.title}“. Kategorie: ${opportunityCategoryLabel(item.category)}. Zdroj: ${opportunitySourceLabel(item.metadata)}. Deadline: ${deadline}.`
          : "Rád bych ověřil podmínky a další vhodný postup pro připravované úřední podání.",
        reasons ? `Relevantní důvody k ověření: ${reasons}` : "",
        item ? `Navržený další krok: ${item.nextAction}` : "",
        "",
        "Prosím o potvrzení, zda je výše uvedený záměr způsobilý k řešení danou cestou, a případně o sdělení, jaké přílohy nebo doplňující informace mám připravit.",
        "",
        "Předpokládané přílohy / podklady:",
        ...attachments.map((attachment) => `- ${attachment.label}`),
        "",
        "Děkuji a přeji pěkný den.",
        "",
        adminIdentityProfile.displayName,
      ]
        .filter((line) => line !== "")
        .join("\n"),
    )
    setOfficialMessage("Koncept úřední zprávy je připravený ke kontrole.")
  }

  function selectOfficialDraft(draft: OfficialDraftItem) {
    setOfficialDraftId(draft.id)
    setOfficialPurpose(draft.purpose)
    setOfficialRecipient(draft.recipient)
    setOfficialSubject(draft.subject)
    setOfficialDraft(draft.body)
    setOfficialAttachments(draft.attachments)
    setOfficialMessage(`Načten uložený koncept: ${draft.subject}`)
  }

  async function saveOfficialDraft(
    reviewStatus = "draft",
    extraMetadata: Record<string, unknown> = {},
    successMessage = "Koncept je uložený v backendu.",
  ) {
    if (!officialSubject.trim() || !officialDraft.trim()) {
      setOfficialMessage("Před uložením doplňte věc a text konceptu.")
      return
    }

    setSavingOfficialDraft(true)
    setOfficialMessage("")

    try {
      const response = await fetch("/api/admin/official-draft", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: officialDraftId || null,
          opportunityId: selectedOpportunity?.id ?? null,
          purpose: officialPurpose,
          recipient: officialRecipient,
          subject: officialSubject,
          body: officialDraft,
          attachments: officialAttachments,
          reviewStatus,
          metadata: {
            source: "portal_official_communication",
            selectedOpportunityTitle: selectedOpportunity?.title ?? null,
            ...extraMetadata,
          },
        }),
      })
      const data = await readJson<{
        draft?: OfficialDraftItem
        drafts?: OfficialDraftItem[]
        message?: string
      }>(response)

      if (!response.ok || !data.draft) {
        setOfficialMessage(data.message ?? "Koncept se nepodařilo uložit.")
        return
      }

      setOfficialDraftId(data.draft.id)
      setOfficialDrafts(Array.isArray(data.drafts) ? data.drafts : [data.draft])
      setOfficialMessage(successMessage)
    } catch {
      setOfficialMessage("Koncept teď nejde uložit. Zkuste to znovu.")
    } finally {
      setSavingOfficialDraft(false)
    }
  }

  async function prepareOfficialDraftForIsds() {
    const missingAttachments = officialAttachments.filter((item) => !item.done)

    await saveOfficialDraft(
      "ready_for_isds",
      {
        channel: "isds",
        dataBoxId: "v2328bu",
        authorizationMethod: "bank_identity",
        archiveTarget: "google_drive",
        dispatchMode: "manual_confirmation_required",
        preparedAt: new Date().toISOString(),
        missingAttachments: missingAttachments.map((item) => item.label),
      },
      missingAttachments.length > 0
        ? `Koncept je uložený pro datovou schránku. Zbývá ověřit přílohy: ${missingAttachments.length}.`
        : "Koncept je uložený jako připravený pro datovou schránku.",
    )
  }

  async function archiveOfficialDraftToDrive() {
    if (!officialSubject.trim() || !officialDraft.trim()) {
      setOfficialMessage("Před archivací doplňte věc a text konceptu.")
      return
    }

    setArchivingOfficialDraft(true)
    setOfficialMessage("")

    try {
      const response = await fetch("/api/admin/official-draft-archive", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: officialDraftId || null,
          opportunityId: selectedOpportunity?.id ?? null,
          purpose: officialPurpose,
          recipient: officialRecipient,
          subject: officialSubject,
          body: officialDraft,
          attachments: officialAttachments,
          metadata: {
            source: "portal_official_communication",
            selectedOpportunityTitle: selectedOpportunity?.title ?? null,
            channel: "isds",
            dataBoxId: "v2328bu",
            authorizationMethod: "bank_identity",
          },
        }),
      })
      const data = await readJson<{
        draft?: OfficialDraftItem
        drafts?: OfficialDraftItem[]
        driveFile?: { name?: string; webViewLink?: string }
        message?: string
      }>(response)

      if (!response.ok || !data.draft) {
        setOfficialMessage(data.message ?? "Archivace do Google Drive se nepodařila.")
        return
      }

      setOfficialDraftId(data.draft.id)
      setOfficialDrafts(Array.isArray(data.drafts) ? data.drafts : [data.draft])
      setOfficialMessage(
        data.driveFile?.name
          ? `Koncept je archivovaný v Google Drive: ${data.driveFile.name}`
          : "Koncept je archivovaný v Google Drive.",
      )
    } catch {
      setOfficialMessage("Google Drive archiv teď není dostupný. Zkuste to znovu.")
    } finally {
      setArchivingOfficialDraft(false)
    }
  }

  async function reviewOfficialDraftWithAgent() {
    if (!officialSubject.trim() || !officialDraft.trim()) {
      setOfficialMessage("Před AI revizí doplňte věc a text konceptu.")
      return
    }

    setRunningOfficialAgent(true)
    setOfficialMessage("")

    try {
      const response = await fetch("/api/admin/official-draft-agent", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: officialPurpose,
          recipient: officialRecipient,
          subject: officialSubject,
          body: officialDraft,
          attachments: officialAttachments,
          opportunityTitle: selectedOpportunity?.title ?? "",
        }),
      })
      const data = await readJson<{
        result?: {
          subject: string
          body: string
          checklist: OpportunityChecklistItem[]
          notes: string[]
          riskLevel: "low" | "medium" | "high"
        }
        message?: string
      }>(response)

      if (!response.ok || !data.result) {
        setOfficialMessage(data.message ?? "AI revize teď není dostupná.")
        return
      }

      setOfficialSubject(data.result.subject)
      setOfficialDraft(data.result.body)
      setOfficialAttachments((current) => {
        const existing = new Set(current.map((item) => item.label.toLowerCase()))
        const additions = data.result?.checklist.filter(
          (item) => !existing.has(item.label.toLowerCase()),
        ) ?? []

        return additions.length > 0 ? [...current, ...additions] : current
      })
      setOfficialMessage(
        `AI revize dokončena. Riziko: ${data.result.riskLevel}. ${
          data.result.notes[0] ?? "Text je připravený k ruční kontrole."
        }`,
      )
    } catch {
      setOfficialMessage("AI agent teď není dostupný. Zkuste to znovu.")
    } finally {
      setRunningOfficialAgent(false)
    }
  }

  async function copyOfficialDraft() {
    try {
      await navigator.clipboard.writeText(officialDraft)
      setOfficialDraftCopied(true)
      setOfficialMessage("Koncept je zkopírovaný do schránky.")
      window.setTimeout(() => setOfficialDraftCopied(false), 1800)
    } catch {
      setOfficialMessage("Koncept se nepodařilo zkopírovat. Použijte ruční výběr textu.")
    }
  }

  function downloadOfficialDraft() {
    downloadTextFile(
      `fkdev-uredni-podani-${new Date().toISOString().slice(0, 10)}.md`,
      officialDraft,
      "text/markdown",
    )
    setOfficialMessage("Koncept je stažený jako Markdown.")
  }

  async function saveOpportunityWorkflow() {
    if (!selectedOpportunity) {
      return
    }

    setSavingOpportunityWorkflow(true)
    setOpportunityMessage("")

    try {
      const response = await fetch("/api/admin/opportunity-workflow", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId: selectedOpportunity.id,
          workflowStatus: opportunityWorkflowStatus,
          adminNotes: opportunityNotes,
          checklist: opportunityChecklist,
          nextReviewAt: opportunityNextReviewAt
            ? new Date(opportunityNextReviewAt).toISOString()
            : null,
        }),
      })
      const data = await readJson<{
        opportunity?: OpportunityItem
        message?: string
      }>(response)

      if (!response.ok || !data.opportunity) {
        setOpportunityMessage(data.message ?? "Stav příležitosti se nepodařilo uložit.")
        return
      }

      setOpportunities((current) =>
        current.map((item) =>
          item.id === data.opportunity?.id ? data.opportunity : item,
        ),
      )
      setOpportunityMessage("Stav příležitosti je uložený.")
    } catch {
      setOpportunityMessage("Stav příležitosti teď nejde uložit. Zkuste to znovu.")
    } finally {
      setSavingOpportunityWorkflow(false)
    }
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

  const opportunityCategories = useMemo(
    () => Array.from(new Set(opportunities.map((item) => item.category))).sort(),
    [opportunities],
  )
  const opportunitySources = useMemo(
    () => Array.from(new Set(opportunities.map((item) => opportunitySourceKey(item)))).sort(),
    [opportunities],
  )
  const filteredOpportunities = useMemo(() => {
    const normalized = opportunitySearch.trim().toLowerCase()
    const now = Date.now()
    const inSevenDays = now + 7 * 24 * 60 * 60 * 1000

    return opportunities.filter((item) => {
      if (
        opportunityWorkflowFilter !== "all" &&
        item.workflowStatus !== opportunityWorkflowFilter
      ) {
        return false
      }

      if (
        opportunityCategoryFilter !== "all" &&
        item.category !== opportunityCategoryFilter
      ) {
        return false
      }

      if (
        opportunitySourceFilter !== "all" &&
        opportunitySourceKey(item) !== opportunitySourceFilter
      ) {
        return false
      }

      if (opportunityDeadlineFilter !== "all") {
        const deadline = item.deadline ? new Date(item.deadline).getTime() : NaN

        if (opportunityDeadlineFilter === "due7") {
          if (Number.isNaN(deadline) || deadline < now || deadline > inSevenDays) {
            return false
          }
        } else if (opportunityDeadlineFilter === "expired") {
          if (Number.isNaN(deadline) || deadline >= now) {
            return false
          }
        } else if (opportunityDeadlineFilter === "no_deadline" && item.deadline) {
          return false
        }
      }

      if (!normalized) {
        return true
      }

      return [
        item.title,
        item.summary,
        item.region,
        item.status,
        item.nextAction,
        item.matchReasons.join(" "),
        summarizeMetadata(item.metadata),
        opportunityCategoryLabel(item.category),
        opportunityWorkflowLabel(item.workflowStatus),
        opportunitySourceLabel(item.metadata),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    })
  }, [
    opportunities,
    opportunityCategoryFilter,
    opportunityDeadlineFilter,
    opportunitySearch,
    opportunitySourceFilter,
    opportunityWorkflowFilter,
  ])

  const opportunityStats = useMemo(() => {
    const now = Date.now()
    const inSevenDays = now + 7 * 24 * 60 * 60 * 1000

    return {
      newItems: filteredOpportunities.filter((item) => item.workflowStatus === "new").length,
      toVerify: filteredOpportunities.filter((item) => item.workflowStatus === "verify").length,
      goodFit: filteredOpportunities.filter((item) => item.workflowStatus === "good_fit").length,
      dueSoon: filteredOpportunities.filter((item) => {
        if (!item.deadline) {
          return false
        }

        const deadline = new Date(item.deadline).getTime()
        return !Number.isNaN(deadline) && deadline >= now && deadline <= inSevenDays
      }).length,
    }
  }, [filteredOpportunities])
  const opportunityReport = useMemo(() => {
    const generatedAt = new Intl.DateTimeFormat("cs-CZ", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date())
    const topItems = filteredOpportunities
      .slice()
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
    const filters = [
      opportunitySearch.trim() ? `hledani: ${opportunitySearch.trim()}` : null,
      opportunityWorkflowFilter !== "all"
        ? `workflow: ${opportunityWorkflowLabel(opportunityWorkflowFilter)}`
        : null,
      opportunityCategoryFilter !== "all"
        ? `kategorie: ${opportunityCategoryLabel(opportunityCategoryFilter)}`
        : null,
      opportunitySourceFilter !== "all"
        ? `zdroj: ${
            opportunities.find((item) => opportunitySourceKey(item) === opportunitySourceFilter)
              ? opportunitySourceLabel(
                  opportunities.find((item) => opportunitySourceKey(item) === opportunitySourceFilter)
                    ?.metadata ?? {},
                )
              : opportunitySourceFilter
          }`
        : null,
      opportunityDeadlineFilter !== "all" ? `deadline: ${opportunityDeadlineFilter}` : null,
    ].filter(Boolean)

    return [
      "# FKdev Opportunity Radar - souhrn",
      "",
      `Vygenerovano: ${generatedAt}`,
      `Polozky ve vyberu: ${filteredOpportunities.length} / ${opportunities.length}`,
      filters.length > 0 ? `Filtry: ${filters.join(", ")}` : "Filtry: bez omezeni",
      "",
      "## Rychly prehled",
      "",
      `- Nove: ${opportunityStats.newItems}`,
      `- Overit: ${opportunityStats.toVerify}`,
      `- Vhodne: ${opportunityStats.goodFit}`,
      `- Deadline do 7 dnu: ${opportunityStats.dueSoon}`,
      "",
      "## Prioritni polozky",
      "",
      ...(topItems.length > 0
        ? topItems.flatMap((item, index) => [
            `${index + 1}. ${item.title}`,
            `   - Kategorie: ${opportunityCategoryLabel(item.category)}`,
            `   - Workflow: ${opportunityWorkflowLabel(item.workflowStatus)}`,
            `   - Zdroj: ${opportunitySourceLabel(item.metadata)}`,
            `   - Skore: ${item.score}`,
            `   - Deadline: ${
              item.deadline ? formatOpportunityDeadline(item.deadline) : "neuveden"
            }`,
            `   - Dalsi krok: ${item.nextAction}`,
            `   - URL: ${item.url}`,
            "",
          ])
        : ["Bez polozek v aktualnim vyberu.", ""]),
      "## Poznamka",
      "",
      "Tento souhrn vychazi z aktualniho filtrovaneho pohledu v soukromem admin portalu.",
    ].join("\n")
  }, [
    filteredOpportunities,
    opportunities,
    opportunityCategoryFilter,
    opportunityDeadlineFilter,
    opportunitySearch,
    opportunitySourceFilter,
    opportunityStats,
    opportunityWorkflowFilter,
  ])

  function selectContentBlock(key: string) {
    const next = contentBlocks.find((block) => block.key === key)
    setSelectedContentKey(key)
    setContentDraft(next?.draftValue ?? "")
    setContentQuality(null)
    setContentMessage("")
  }

  async function checkContentQuality() {
    setCheckingContent(true)
    setContentMessage("")

    try {
      const response = await fetch("/api/admin/content-check", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: contentDraft }),
      })
      const data = await readJson<ContentQuality & { message?: string }>(response)

      if (!response.ok) {
        setContentMessage(data.message ?? "Kontrola obsahu teď není dostupná.")
        return
      }

      setContentQuality(data)
      setContentMessage(
        data.status === "blocked"
          ? "Text je potřeba upravit před publikací."
          : data.status === "warning"
            ? "Text lze publikovat, ale kontrola našla doporučení."
            : "Text prošel kontrolou bez blokujících nálezů.",
      )
    } catch {
      setContentMessage("Kontrola obsahu teď není dostupná. Zkuste to znovu.")
    } finally {
      setCheckingContent(false)
    }
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
        quality?: ContentQuality
        message?: string
      }>(response)

      if (!response.ok || !data.block) {
        if (data.quality) {
          setContentQuality(data.quality)
        }
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
      if (data.quality) {
        setContentQuality(data.quality)
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

        <section className="mt-8 rounded-[var(--radius)] border border-border/70 bg-card/45 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-foreground/90" aria-hidden />
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Live návštěvnost
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Anonymní agregace návštěv po souhlasu s analytikou.
                </p>
              </div>
            </div>
            <span className="w-fit rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
              posledních 60 minut
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <article className="rounded-[var(--radius)] border border-border/60 bg-background/30 p-4">
              <p className="text-sm text-muted-foreground">Aktivní sessions</p>
              <p className="mt-3 text-2xl font-semibold text-foreground">
                {telemetry.activeSessions}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">posledních 5 minut</p>
            </article>
            <article className="rounded-[var(--radius)] border border-border/60 bg-background/30 p-4">
              <p className="text-sm text-muted-foreground">Události</p>
              <p className="mt-3 text-2xl font-semibold text-foreground">
                {telemetry.events15m}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">posledních 15 minut</p>
            </article>
            <article className="rounded-[var(--radius)] border border-border/60 bg-background/30 p-4">
              <p className="text-sm text-muted-foreground">Pageviews</p>
              <p className="mt-3 text-2xl font-semibold text-foreground">
                {telemetry.events60m}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">posledních 60 minut</p>
            </article>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[var(--radius)] border border-border/60 bg-background/30 p-4">
              <h3 className="font-display text-base font-semibold text-foreground">
                Nejživější stránky
              </h3>
              <div className="mt-4 grid gap-3">
                {telemetry.topPages.length > 0 ? (
                  telemetry.topPages.map((page) => (
                    <div
                      key={`${page.path}-${page.lastSeenAt}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/25 px-3 py-2 text-sm"
                    >
                      <span className="min-w-0 truncate text-foreground">
                        {page.path}
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {page.visits}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Data se zobrazí po prvních návštěvách se souhlasem analytiky.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[var(--radius)] border border-border/60 bg-background/30 p-4">
              <h3 className="font-display text-base font-semibold text-foreground">
                Poslední signály
              </h3>
              <div className="mt-4 grid gap-3">
                {telemetry.recentEvents.length > 0 ? (
                  telemetry.recentEvents.slice(0, 6).map((event) => (
                    <div
                      key={`${event.path}-${event.createdAt}`}
                      className="rounded-lg border border-border/50 bg-background/25 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate text-foreground">
                          {event.path}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatAuditDate(event.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {event.viewport ?? "bez viewportu"}
                        {event.referrer ? ` · ${event.referrer}` : ""}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Zatím nejsou uložené žádné anonymní telemetry eventy.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[var(--radius)] border border-border/70 bg-card/45 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <Globe2 className="h-5 w-5 text-foreground/90" aria-hidden />
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Opportunity Radar
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Sledování zakázek, dotačních zdrojů a tržních signálů podle profilu FKdev.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={exportFilteredOpportunities}
                disabled={filteredOpportunities.length === 0}
              >
                <Download className="h-4 w-4" aria-hidden />
                Export CSV
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void refreshOpportunities()}
                disabled={refreshingOpportunities}
              >
                {refreshingOpportunities ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <RotateCcw className="h-4 w-4" aria-hidden />
                )}
                Obnovit radar
              </Button>
            </div>
          </div>

          {opportunityMessage ? (
            <p className="mt-4 rounded-[var(--radius)] border border-border/60 bg-background/30 px-4 py-3 text-sm text-muted-foreground">
              {opportunityMessage}
            </p>
          ) : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Nové", opportunityStats.newItems],
              ["Ověřit", opportunityStats.toVerify],
              ["Vhodné", opportunityStats.goodFit],
              ["Deadline do 7 dnů", opportunityStats.dueSoon],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[var(--radius)] border border-border/60 bg-background/30 p-3"
              >
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-xl font-semibold text-foreground">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))]">
            <label className="grid gap-2 text-sm text-muted-foreground">
              Hledat
              <span className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  type="search"
                  value={opportunitySearch}
                  onChange={(event) => setOpportunitySearch(event.target.value)}
                  className="w-full rounded-lg border border-border/70 bg-background/50 py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-foreground/50"
                  placeholder="Název, region, zdroj..."
                />
              </span>
            </label>
            <label className="grid gap-2 text-sm text-muted-foreground">
              Workflow
              <select
                value={opportunityWorkflowFilter}
                onChange={(event) => setOpportunityWorkflowFilter(event.target.value)}
                className="rounded-lg border border-border/70 bg-background/50 px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/50"
              >
                <option value="all">Vše</option>
                {["new", "verify", "good_fit", "not_fit", "in_progress", "submitted"].map((status) => (
                  <option key={status} value={status}>
                    {opportunityWorkflowLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-muted-foreground">
              Kategorie
              <select
                value={opportunityCategoryFilter}
                onChange={(event) => setOpportunityCategoryFilter(event.target.value)}
                className="rounded-lg border border-border/70 bg-background/50 px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/50"
              >
                <option value="all">Vše</option>
                {opportunityCategories.map((category) => (
                  <option key={category} value={category}>
                    {opportunityCategoryLabel(category)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-muted-foreground">
              Zdroj
              <select
                value={opportunitySourceFilter}
                onChange={(event) => setOpportunitySourceFilter(event.target.value)}
                className="rounded-lg border border-border/70 bg-background/50 px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/50"
              >
                <option value="all">Vše</option>
                {opportunitySources.map((source) => {
                  const example = opportunities.find(
                    (item) => opportunitySourceKey(item) === source,
                  )

                  return (
                    <option key={source} value={source}>
                      {example ? opportunitySourceLabel(example.metadata) : source}
                    </option>
                  )
                })}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-muted-foreground">
              Deadline
              <select
                value={opportunityDeadlineFilter}
                onChange={(event) => setOpportunityDeadlineFilter(event.target.value)}
                className="rounded-lg border border-border/70 bg-background/50 px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/50"
              >
                <option value="all">Vše</option>
                <option value="due7">Do 7 dnů</option>
                <option value="expired">Po termínu</option>
                <option value="no_deadline">Bez termínu</option>
              </select>
            </label>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              Zobrazeno {filteredOpportunities.length} / {opportunities.length} položek
            </span>
            <button
              type="button"
              onClick={() => {
                setOpportunitySearch("")
                setOpportunityWorkflowFilter("all")
                setOpportunityCategoryFilter("all")
                setOpportunitySourceFilter("all")
                setOpportunityDeadlineFilter("all")
              }}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Vyčistit filtry
            </button>
          </div>

          <div className="mt-5 rounded-[var(--radius)] border border-border/60 bg-background/25 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-foreground/90" aria-hidden />
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground">
                    Souhrn příležitostí
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Aktuální filtrovaný výběr připravený pro e-mail, poznámku nebo PDF.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void copyOpportunityReport()}
                  disabled={filteredOpportunities.length === 0}
                >
                  <ClipboardCopy className="h-4 w-4" aria-hidden />
                  {opportunityReportCopied ? "Zkopírováno" : "Kopírovat"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={downloadOpportunityReport}
                  disabled={filteredOpportunities.length === 0}
                >
                  <Download className="h-4 w-4" aria-hidden />
                  Markdown
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => window.print()}
                  disabled={filteredOpportunities.length === 0}
                >
                  <Printer className="h-4 w-4" aria-hidden />
                  PDF
                </Button>
              </div>
            </div>
            <textarea
              value={opportunityReport}
              readOnly
              rows={8}
              className="mt-4 w-full resize-y rounded-lg border border-border/70 bg-background/60 px-3 py-2 font-mono text-xs leading-relaxed text-foreground outline-none"
              aria-label="Souhrn příležitostí"
            />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {filteredOpportunities.length > 0 ? (
              filteredOpportunities.map((item) => (
                <article
                  key={item.id || item.sourceId}
                  className={`rounded-[var(--radius)] border p-4 ${
                    selectedOpportunity?.id === item.id
                      ? "border-foreground/40 bg-background/45"
                      : "border-border/60 bg-background/30"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {opportunityCategoryLabel(item.category)} · {item.region}
                      </p>
                      <h3 className="mt-2 font-display text-base font-semibold text-foreground">
                        {item.title}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <span className="w-fit rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
                        {opportunitySourceLabel(item.metadata)}
                      </span>
                      <span className="w-fit rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
                        skóre {item.score}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full border border-border/50 px-2.5 py-1">
                      zdroj {item.status}
                    </span>
                    <span className="rounded-full border border-border/50 px-2.5 py-1">
                      workflow {opportunityWorkflowLabel(item.workflowStatus)}
                    </span>
                    {item.deadline ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/50 px-2.5 py-1">
                        <Clock3 className="h-3 w-3" aria-hidden />
                        termín {formatOpportunityDeadline(item.deadline)}
                      </span>
                    ) : null}
                    <span className="rounded-full border border-border/50 px-2.5 py-1">
                      {summarizeMetadata(item.metadata)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.summary}
                  </p>
                  {item.matchReasons.length > 0 ? (
                    <div className="mt-4 grid gap-2">
                      {item.matchReasons.slice(0, 4).map((reason) => (
                        <div
                          key={reason}
                          className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
                        >
                          <CheckCircle2
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground/90"
                            aria-hidden
                          />
                          {reason}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <p className="mt-4 rounded-lg border border-border/50 bg-background/25 p-3 text-sm leading-relaxed text-muted-foreground">
                    {item.nextAction}
                  </p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs text-muted-foreground">
                      Aktualizováno {formatAuditDate(item.lastSeenAt)}
                    </span>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => selectOpportunity(item)}
                        className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        Detail
                      </button>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        Otevřít zdroj
                      </a>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[var(--radius)] border border-border/60 bg-background/30 p-4 text-sm leading-relaxed text-muted-foreground lg:col-span-2">
                {opportunities.length > 0
                  ? "Aktuální filtry neodpovídají žádné položce."
                  : "Radar je připravený. Spusťte první obnovu, aby se založily sledované zdroje."}
              </div>
            )}
          </div>

          {selectedOpportunity ? (
            <div className="mt-6 grid gap-5 rounded-[var(--radius)] border border-border/70 bg-background/35 p-4 lg:grid-cols-[1fr_0.9fr]">
              <div>
                <div className="flex items-center gap-3">
                  <ListChecks className="h-5 w-5 text-foreground/90" aria-hidden />
                  <div>
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      Detail příležitosti
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedOpportunity.title}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm text-muted-foreground">
                    Workflow stav
                    <select
                      value={opportunityWorkflowStatus}
                      onChange={(event) => setOpportunityWorkflowStatus(event.target.value)}
                      className="rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/50"
                    >
                      {["new", "verify", "good_fit", "not_fit", "in_progress", "submitted"].map((status) => (
                        <option key={status} value={status}>
                          {opportunityWorkflowLabel(status)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm text-muted-foreground">
                    Další kontrola
                    <input
                      type="datetime-local"
                      value={opportunityNextReviewAt}
                      onChange={(event) => setOpportunityNextReviewAt(event.target.value)}
                      className="rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/50"
                    />
                  </label>
                </div>

                <label className="mt-4 grid gap-2 text-sm text-muted-foreground">
                  Poznámky
                  <textarea
                    value={opportunityNotes}
                    onChange={(event) => setOpportunityNotes(event.target.value)}
                    rows={6}
                    className="resize-y rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-sm leading-relaxed text-foreground outline-none focus:border-foreground/50"
                    placeholder="Shrnutí rozhodnutí, podmínky, rizika nebo další kroky."
                  />
                </label>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    onClick={() => void saveOpportunityWorkflow()}
                    disabled={savingOpportunityWorkflow}
                  >
                    {savingOpportunityWorkflow ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Save className="h-4 w-4" aria-hidden />
                    )}
                    Uložit stav
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={createOpportunityChecklist}
                  >
                    <ListChecks className="h-4 w-4" aria-hidden />
                    Vytvořit checklist
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={generateOpportunityDraft}
                  >
                    <ScrollText className="h-4 w-4" aria-hidden />
                    Návrh postupu
                  </Button>
                </div>
              </div>

              <div className="rounded-[var(--radius)] border border-border/60 bg-background/25 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-display text-base font-semibold text-foreground">
                    Checklist
                  </h4>
                  <button
                    type="button"
                    onClick={() => addOpportunityChecklistItem()}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 text-foreground hover:border-foreground/50"
                    aria-label="Přidat položku checklistu"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                  </button>
                </div>

                <div className="mt-4 grid gap-3">
                  {opportunityChecklist.length > 0 ? (
                    opportunityChecklist.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-lg border border-border/50 bg-background/25 p-2"
                      >
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={(event) =>
                            updateOpportunityChecklistItem(item.id, {
                              done: event.target.checked,
                            })
                          }
                          className="h-4 w-4"
                          aria-label={`Splněno: ${item.label}`}
                        />
                        <input
                          type="text"
                          value={item.label}
                          onChange={(event) =>
                            updateOpportunityChecklistItem(item.id, {
                              label: event.target.value,
                            })
                          }
                          className="min-w-0 rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-sm text-foreground outline-none focus:border-foreground/50"
                        />
                        <button
                          type="button"
                          onClick={() => removeOpportunityChecklistItem(item.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-background/60 hover:text-foreground"
                          aria-label={`Odebrat: ${item.label}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Checklist zatím není založený.
                    </p>
                  )}
                </div>

                <div className="mt-4 rounded-lg border border-border/50 bg-background/25 p-3 text-xs leading-relaxed text-muted-foreground">
                  Poslední rozhodnutí:{" "}
                  {selectedOpportunity.decisionUpdatedAt
                    ? formatAuditDate(selectedOpportunity.decisionUpdatedAt)
                    : "zatím neuloženo"}
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="mt-8 rounded-[var(--radius)] border border-border/70 bg-card/45 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-foreground/90" aria-hidden />
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Úřední komunikace
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Koncept podání připravený z vybrané příležitosti a profilu FKdev.
                </p>
              </div>
            </div>
            <span className="w-fit rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
              koncept bez odeslání
            </span>
          </div>

          {officialMessage ? (
            <p className="mt-4 rounded-[var(--radius)] border border-border/60 bg-background/30 px-4 py-3 text-sm text-muted-foreground">
              {officialMessage}
            </p>
          ) : null}

          <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[var(--radius)] border border-border/60 bg-background/25 p-4">
              <div className="flex items-center gap-3">
                <Bot className="h-5 w-5 text-foreground/90" aria-hidden />
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground">
                    Agent pro návrh podání
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Vyplní text, ale finální kontrola a odeslání zůstává na vás.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <label className="grid gap-2 text-sm text-muted-foreground">
                  Typ komunikace
                  <select
                    value={officialPurpose}
                    onChange={(event) => setOfficialPurpose(event.target.value)}
                    className="rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/50"
                  >
                    {[
                      "eligibility_question",
                      "grant_application",
                      "supplement",
                      "authority_reply",
                      "procurement_question",
                    ].map((purpose) => (
                      <option key={purpose} value={purpose}>
                        {officialPurposeLabel(purpose)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm text-muted-foreground">
                  Adresát
                  <input
                    type="text"
                    value={officialRecipient}
                    onChange={(event) => setOfficialRecipient(event.target.value)}
                    className="rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/50"
                    placeholder="Úřad, poskytovatel výzvy nebo zadavatel"
                  />
                </label>

                <label className="grid gap-2 text-sm text-muted-foreground">
                  Věc
                  <input
                    type="text"
                    value={officialSubject}
                    onChange={(event) => setOfficialSubject(event.target.value)}
                    className="rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/50"
                    placeholder="Předmět zprávy"
                  />
                </label>
              </div>

              <div className="mt-4 rounded-lg border border-border/50 bg-background/25 p-3 text-xs leading-relaxed text-muted-foreground">
                Profil: {adminIdentityProfile.displayName}, IČO {adminIdentityProfile.ico},{" "}
                {adminIdentityProfile.address}. Rozsah: {adminIdentityProfile.services}.
              </div>

              <div className="mt-4 rounded-lg border border-border/50 bg-background/25 p-3">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-foreground/90" aria-hidden />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Datová schránka
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {isdsIntegration?.configured
                        ? "Schránka v2328bu je zapsaná v serverovém nastavení. Odeslání zůstává blokované ruční autorizací přes bankovní identitu."
                        : "Schránka v2328bu čeká na produkční env nastavení. Koncept lze bezpečně připravit a archivovat."}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {storageIntegration?.configured
                        ? "Google Drive archiv je připravený pro podklady a exporty."
                        : "Google Drive archiv čeká na OAuth nebo service-account konfiguraci."}
                    </p>
                  </div>
                </div>
              </div>

              {selectedOpportunity ? (
                <div className="mt-4 rounded-lg border border-border/50 bg-background/25 p-3 text-sm leading-relaxed text-muted-foreground">
                  Zdroj konceptu:{" "}
                  <span className="font-medium text-foreground">
                    {selectedOpportunity.title}
                  </span>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-3">
                <Button type="button" onClick={generateOfficialDraft}>
                  <Wand2 className="h-4 w-4" aria-hidden />
                  Vytvořit koncept
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void saveOfficialDraft()}
                  disabled={savingOfficialDraft || officialDraft.trim().length === 0}
                >
                  {savingOfficialDraft ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Save className="h-4 w-4" aria-hidden />
                  )}
                  Uložit
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void prepareOfficialDraftForIsds()}
                  disabled={savingOfficialDraft || officialDraft.trim().length === 0}
                >
                  {savingOfficialDraft ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden />
                  )}
                  Připravit DS
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void reviewOfficialDraftWithAgent()}
                  disabled={runningOfficialAgent || officialDraft.trim().length === 0}
                >
                  {runningOfficialAgent ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Bot className="h-4 w-4" aria-hidden />
                  )}
                  AI revize
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void archiveOfficialDraftToDrive()}
                  disabled={
                    archivingOfficialDraft ||
                    officialDraft.trim().length === 0 ||
                    !storageIntegration?.configured
                  }
                >
                  {archivingOfficialDraft ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <HardDrive className="h-4 w-4" aria-hidden />
                  )}
                  Archiv Drive
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setOfficialAttachments(suggestedOfficialAttachments(selectedOpportunity))}
                >
                  <ListChecks className="h-4 w-4" aria-hidden />
                  Přílohy
                </Button>
              </div>

              <div className="mt-4 rounded-lg border border-border/50 bg-background/25 p-3">
                <h4 className="font-display text-sm font-semibold text-foreground">
                  Uložené koncepty
                </h4>
                <div className="mt-3 grid gap-2">
                  {officialDrafts.length > 0 ? (
                    officialDrafts.slice(0, 5).map((draft) => (
                      <button
                        key={draft.id}
                        type="button"
                        onClick={() => selectOfficialDraft(draft)}
                        className={`rounded-lg border p-3 text-left text-sm transition hover:border-foreground/50 ${
                          officialDraftId === draft.id
                            ? "border-foreground/40 bg-background/50"
                            : "border-border/50 bg-background/25"
                        }`}
                      >
                        <span className="block font-medium text-foreground">
                          {draft.subject}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {officialPurposeLabel(draft.purpose)} ·{" "}
                          {officialReviewStatusLabel(draft.reviewStatus)} ·{" "}
                          {formatAuditDate(draft.updatedAt)}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Zatím nejsou uložené žádné koncepty.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[var(--radius)] border border-border/60 bg-background/25 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground">
                    Koncept zprávy
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Text je připravený pro ruční kontrolu, export nebo pozdější ISDS konektor.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void copyOfficialDraft()}
                    disabled={officialDraft.trim().length === 0}
                  >
                    <ClipboardCopy className="h-4 w-4" aria-hidden />
                    {officialDraftCopied ? "Zkopírováno" : "Kopírovat"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={downloadOfficialDraft}
                    disabled={officialDraft.trim().length === 0}
                  >
                    <Download className="h-4 w-4" aria-hidden />
                    Markdown
                  </Button>
                </div>
              </div>

              <textarea
                value={officialDraft}
                onChange={(event) => setOfficialDraft(event.target.value)}
                rows={12}
                className="mt-4 w-full resize-y rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-sm leading-relaxed text-foreground outline-none focus:border-foreground/50"
                placeholder="Koncept se vytvoří po kliknutí na Vytvořit koncept."
                aria-label="Koncept úředního podání"
              />

              <div className="mt-4 rounded-lg border border-border/50 bg-background/25 p-3">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-display text-sm font-semibold text-foreground">
                    Checklist příloh
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      setOfficialAttachments((current) => [
                        ...current,
                        {
                          id: `official-local-${Date.now()}-${current.length}`,
                          label: "",
                          done: false,
                        },
                      ])
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 text-foreground hover:border-foreground/50"
                    aria-label="Přidat přílohu"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                  </button>
                </div>

                <div className="mt-3 grid gap-2">
                  {officialAttachments.length > 0 ? (
                    officialAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-lg border border-border/50 bg-background/25 p-2"
                      >
                        <input
                          type="checkbox"
                          checked={attachment.done}
                          onChange={(event) =>
                            setOfficialAttachments((current) =>
                              current.map((item) =>
                                item.id === attachment.id
                                  ? { ...item, done: event.target.checked }
                                  : item,
                              ),
                            )
                          }
                          className="h-4 w-4"
                          aria-label={`Příloha připravena: ${attachment.label}`}
                        />
                        <input
                          type="text"
                          value={attachment.label}
                          onChange={(event) =>
                            setOfficialAttachments((current) =>
                              current.map((item) =>
                                item.id === attachment.id
                                  ? { ...item, label: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          className="min-w-0 rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-sm text-foreground outline-none focus:border-foreground/50"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setOfficialAttachments((current) =>
                              current.filter((item) => item.id !== attachment.id),
                            )
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-background/60 hover:text-foreground"
                          aria-label={`Odebrat přílohu: ${attachment.label}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Checklist příloh se založí spolu s konceptem nebo tlačítkem Přílohy.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

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
                    onChange={(event) => {
                      setContentDraft(event.target.value)
                      setContentQuality(null)
                    }}
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

                <div className="rounded-[var(--radius)] border border-border/60 bg-background/30 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <ShieldCheck className="h-4 w-4" aria-hidden />
                      Kontrola obsahu
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => void checkContentQuality()}
                      disabled={checkingContent || contentDraft.trim().length === 0}
                    >
                      {checkingContent ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" aria-hidden />
                      )}
                      Zkontrolovat text
                    </Button>
                  </div>

                  {contentQuality ? (
                    <div className="mt-4">
                      <span className="inline-flex rounded-full border border-border/70 bg-background/40 px-3 py-1 text-xs text-muted-foreground">
                        {qualityStatusLabel(contentQuality.status)}
                      </span>
                      {contentQuality.issues.length > 0 ? (
                        <ul className="mt-3 grid gap-2 text-sm leading-relaxed text-muted-foreground">
                          {contentQuality.issues.map((issue) => (
                            <li
                              key={`${issue.code}-${issue.message}`}
                              className="rounded-lg border border-border/60 bg-background/25 px-3 py-2"
                            >
                              <span className="font-medium text-foreground">
                                {issue.severity}
                              </span>{" "}
                              {issue.message}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                          Kontrola nenašla blokující ani doporučené úpravy.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      Kontrola se spustí ručně nebo automaticky před publikací.
                    </p>
                  )}
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
                    disabled={
                      savingContent ||
                      contentDraft.trim().length === 0 ||
                      contentQuality?.status === "blocked"
                    }
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
    const data = await fetchPortalOverview()
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

        if (!isJsonResponse(response)) {
          throw new Error("Admin API nevrátilo JSON odpověď.")
        }

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
          setMessage("Portál teď není dostupný.")
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
