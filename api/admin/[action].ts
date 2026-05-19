import { createHmac, createSign, randomBytes, timingSafeEqual } from "node:crypto"

const SESSION_COOKIE = "fk_admin_session"
const SESSION_TTL_SECONDS = 60 * 60 * 8

type IntegrationStatus = {
  id: string
  label: string
  configured: boolean
  description: string
}

type ProviderSummary = {
  id: string
  label: string
  ok: boolean
  headline: string
  detail: string
  href?: string
  checkedAt: string
}

type AuditLogItem = {
  id: string
  eventType: string
  actor: string
  metadata: Record<string, unknown>
  createdAt: string
}

type OperationCheck = {
  id: string
  label: string
  ok: boolean
  headline: string
  detail: string
  href?: string
  checkedAt: string
}

type ProviderSnapshot = {
  id: string
  source: string
  status: string
  summary: string
  payload: Record<string, unknown>
  createdAt: string
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

type TelemetrySummary = {
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
  checklist: Array<{ id: string; label: string; done: boolean }>
  nextReviewAt: string | null
  decisionUpdatedAt: string | null
  firstSeenAt: string
  lastSeenAt: string
}

type OfficialDraftItem = {
  id: string
  opportunityId: string | null
  purpose: string
  recipient: string
  subject: string
  body: string
  attachments: Array<{ id: string; label: string; done: boolean }>
  reviewStatus: string
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

type OfficialDraftAgentResult = {
  subject: string
  body: string
  checklist: Array<{ id: string; label: string; done: boolean }>
  notes: string[]
  riskLevel: "low" | "medium" | "high"
}

function getSecret(name: string) {
  return process.env[name]?.trim() ?? ""
}

function getAnySecret(names: string[]) {
  for (const name of names) {
    const value = getSecret(name)

    if (value) {
      return value
    }
  }

  return ""
}

function toBase64Url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url")
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url")
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)

  return left.length === right.length && timingSafeEqual(left, right)
}

function parseCookie(header: string | undefined, name: string) {
  if (!header) {
    return ""
  }

  const prefix = `${name}=`
  const item = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))

  return item ? decodeURIComponent(item.slice(prefix.length)) : ""
}

function createSessionToken(secret: string) {
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    sub: "fk-admin",
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    nonce: randomBytes(16).toString("base64url"),
  }
  const encoded = toBase64Url(JSON.stringify(payload))

  return `${encoded}.${sign(encoded, secret)}`
}

function verifySessionToken(token: string, secret: string) {
  const [encoded, signature] = token.split(".")

  if (!encoded || !signature || !safeEqual(signature, sign(encoded, secret))) {
    return false
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as { sub?: string; exp?: number }

    return payload.sub === "fk-admin" && Number(payload.exp) > Date.now() / 1000
  } catch {
    return false
  }
}

function setJsonHeaders(res: any) {
  res.setHeader("Content-Type", "application/json; charset=utf-8")
  res.setHeader("Cache-Control", "no-store")
}

function sendJson(res: any, status: number, body: unknown) {
  setJsonHeaders(res)
  res.status(status).send(JSON.stringify(body))
}

function readBody(req: any) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body) as Record<string, unknown>
    } catch {
      return {}
    }
  }

  if (req.body && typeof req.body === "object") {
    return req.body as Record<string, unknown>
  }

  return {}
}

function authConfig() {
  const accessKey = getSecret("FK_ADMIN_ACCESS_KEY")
  const sessionSecret = getSecret("FK_ADMIN_SESSION_SECRET")

  return {
    accessKey,
    sessionSecret,
    ready: accessKey.length >= 16 && sessionSecret.length >= 32,
  }
}

function integrationStatuses(): IntegrationStatus[] {
  const hasAnySecret = (names: string[]) => Boolean(getAnySecret(names))

  return [
    {
      id: "vercel",
      label: "Vercel",
      configured: hasAnySecret(["VERCEL_API_TOKEN", "VERCEL_TOKEN", "VERCEL_API_KEY"]),
      description: "Deploymenty, domény, build logy a produkční stav.",
    },
    {
      id: "github",
      label: "GitHub",
      configured: hasAnySecret(["GITHUB_TOKEN", "GITHUB_API_KEY"]),
      description: "Repozitář, poslední commity, issues a budoucí release workflow.",
    },
    {
      id: "render",
      label: "Render",
      configured: Boolean(getSecret("RENDER_API_KEY")),
      description: "Budoucí backend služby, workery nebo Python API.",
    },
    {
      id: "railway",
      label: "Railway",
      configured: hasAnySecret(["RAILWAY_API_TOKEN", "RAILWAY_API_KEY"]),
      description: "Alternativní backend runtime a databázové služby.",
    },
    {
      id: "storage",
      label: "Google Drive storage",
      configured: Boolean(
        getSecret("FK_GOOGLE_DRIVE_FOLDER_ID") &&
          (getSecret("FK_GOOGLE_DRIVE_REFRESH_TOKEN") ||
            getSecret("FK_GOOGLE_SERVICE_ACCOUNT_JSON_BASE64")),
      ),
      description: "Soukromé exporty, podklady a pracovní dokumenty v Google Drive.",
    },
    {
      id: "database",
      label: "Databáze",
      configured: Boolean(getSecret("DATABASE_URL")),
      description: "Perzistentní data portálu, audit log a nastavení.",
    },
    {
      id: "ai",
      label: "AI providers",
      configured: hasAnySecret(["OPENAI_API_KEY", "GEMINI_API_KEY"]),
      description: "Budoucí AI asistenti, sumarizace, interní automatizace a agentní funkce.",
    },
    {
      id: "tailscale",
      label: "Tailscale",
      configured: hasAnySecret([
        "TAILSCALE_API_KEY",
        "TAILSCALE_AUTH_TOKEN",
        "TAILSCALE_LOGIN_ID",
        "TAILSCALE_LOGIN_SECRET",
        "TAILNET_UNIQUE_ID",
      ]),
      description: "Soukromé síťové napojení pro interní služby a bezpečný backend přístup.",
    },
    {
      id: "isds",
      label: "Datová schránka",
      configured: Boolean(
        getSecret("FK_ISDS_BOX_ID") &&
          getSecret("FK_ISDS_AUTH_METHOD").toLowerCase() === "bank_identity",
      ),
      description: "Datová schránka v2328bu, autorizace bankovní identitou a ruční potvrzení odeslání.",
    },
  ]
}

function formatDateTime(value: string | number | undefined) {
  if (!value) {
    return "neznámý čas"
  }

  const date = typeof value === "number" ? new Date(value) : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "neznámý čas"
  }

  return date.toLocaleString("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Prague",
  })
}

async function fetchJson(url: string, init: RequestInit, timeoutMs = 15000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    })
    const text = await response.text()
    const data = text ? JSON.parse(text) : null

    return { ok: response.ok, status: response.status, data }
  } finally {
    clearTimeout(timeout)
  }
}

async function githubSummary(): Promise<ProviderSummary> {
  const checkedAt = new Date().toISOString()
  const token = getAnySecret(["GITHUB_TOKEN", "GITHUB_API_KEY"])

  if (!token) {
    return {
      id: "github",
      label: "GitHub",
      ok: false,
      headline: "Token není nastavený",
      detail: "Chybí serverová proměnná GITHUB_TOKEN nebo GITHUB_API_KEY.",
      checkedAt,
    }
  }

  try {
    const [repo, commit] = await Promise.all([
      fetchJson("https://api.github.com/repos/LeafyShadow696/FK-dev", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "fkdev-admin-portal",
        },
      }),
      fetchJson("https://api.github.com/repos/LeafyShadow696/FK-dev/commits/main", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "fkdev-admin-portal",
        },
      }),
    ])

    if (!repo.ok || !commit.ok) {
      return {
        id: "github",
        label: "GitHub",
        ok: false,
        headline: "GitHub API nevrátilo platný stav",
        detail: `Repo status ${repo.status}, commit status ${commit.status}.`,
        checkedAt,
      }
    }

    const commitSha = String(commit.data?.sha ?? "").slice(0, 7)
    const message = String(commit.data?.commit?.message ?? "").split("\n")[0]
    const pushedAt = String(repo.data?.pushed_at ?? commit.data?.commit?.committer?.date ?? "")

    return {
      id: "github",
      label: "GitHub",
      ok: true,
      headline: `${repo.data?.full_name ?? "LeafyShadow696/FK-dev"} / main`,
      detail: `${commitSha} · ${message || "poslední commit"} · ${formatDateTime(pushedAt)}`,
      href: String(repo.data?.html_url ?? "https://github.com/LeafyShadow696/FK-dev"),
      checkedAt,
    }
  } catch {
    return {
      id: "github",
      label: "GitHub",
      ok: false,
      headline: "GitHub API je nedostupné",
      detail: "Nepodařilo se načíst stav repozitáře v časovém limitu.",
      checkedAt,
    }
  }
}

async function vercelSummary(): Promise<ProviderSummary> {
  const checkedAt = new Date().toISOString()
  const token = getAnySecret(["VERCEL_API_TOKEN", "VERCEL_TOKEN", "VERCEL_API_KEY"])
  const projectId = getSecret("VERCEL_PROJECT_ID") || "prj_5rwIhFXRqZ0Q0i0tiVGuSPUMVhGn"
  const teamId = getSecret("VERCEL_TEAM_ID") || "team_Q7P5ptcXkEL5SBpsQ2edIgr3"

  if (!token) {
    return {
      id: "vercel",
      label: "Vercel",
      ok: false,
      headline: "Token není nastavený",
      detail: "Chybí serverová proměnná VERCEL_TOKEN, VERCEL_API_TOKEN nebo VERCEL_API_KEY.",
      checkedAt,
    }
  }

  try {
    const query = new URLSearchParams({
      projectId,
      limit: "1",
      teamId,
    })
    const deployments = await fetchJson(
      `https://api.vercel.com/v6/deployments?${query.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    if (!deployments.ok) {
      return {
        id: "vercel",
        label: "Vercel",
        ok: false,
        headline: "Vercel API nevrátilo platný stav",
        detail: `Deployments status ${deployments.status}.`,
        checkedAt,
      }
    }

    const deployment = deployments.data?.deployments?.[0]
    const state = String(deployment?.state ?? "neznámý stav")
    const url = deployment?.url ? `https://${deployment.url}` : "https://fkdev.xyz"

    return {
      id: "vercel",
      label: "Vercel",
      ok: state === "READY",
      headline: `Poslední deployment: ${state}`,
      detail: `${deployment?.name ?? "fk-dev"} · ${formatDateTime(deployment?.createdAt)}`,
      href: url,
      checkedAt,
    }
  } catch {
    return {
      id: "vercel",
      label: "Vercel",
      ok: false,
      headline: "Vercel API je nedostupné",
      detail: "Nepodařilo se načíst poslední deployment v časovém limitu.",
      checkedAt,
    }
  }
}

async function renderBackendSummary(): Promise<ProviderSummary> {
  const checkedAt = new Date().toISOString()
  const backendUrl =
    getSecret("RENDER_BACKEND_URL") || "https://fkdev-admin-api.onrender.com"
  const normalizedBackendUrl = backendUrl.replace(/\/$/, "")

  try {
    const [healthResult, adminStatusResult] = await Promise.allSettled([
      fetchJson(`${normalizedBackendUrl}/health`, {
        headers: {
          Accept: "application/json",
        },
      }),
      fetchJson(`${normalizedBackendUrl}/admin/status`, {
        headers: {
          Accept: "application/json",
        },
      }),
    ])

    if (healthResult.status === "rejected") {
      return {
        id: "render-backend",
        label: "Python backend",
        ok: false,
        headline: "Backend je nedostupný",
        detail: "Nepodařilo se načíst Render health endpoint v časovém limitu.",
        href: backendUrl,
        checkedAt,
      }
    }

    const health = healthResult.value
    const adminStatus =
      adminStatusResult.status === "fulfilled"
        ? adminStatusResult.value
        : { ok: false, status: 0, data: null }
    const database = adminStatus.data?.database
    const databaseDetail = adminStatus.ok
      ? `Databáze: ${
          database?.connected
            ? `online, audit log ${Number(database.audit_log_count ?? 0)} záznamů`
            : database?.configured
              ? "nastavená, ale nedostupná"
              : "není nastavená"
        }`
      : "Admin status není dostupný"

    if (!health.ok) {
      return {
        id: "render-backend",
        label: "Python backend",
        ok: false,
        headline: "Backend nevrátil platný health stav",
        detail: `Health endpoint status ${health.status}. ${databaseDetail}.`,
        href: backendUrl,
        checkedAt,
      }
    }

    return {
      id: "render-backend",
      label: "Python backend",
      ok: health.data?.status === "ok",
      headline: String(health.data?.service ?? "fkdev-admin-api"),
      detail: `Render FastAPI · ${String(
        health.data?.public_site_url ?? "https://fkdev.xyz",
      )}. ${databaseDetail}.`,
      href: backendUrl,
      checkedAt,
    }
  } catch {
    return {
      id: "render-backend",
      label: "Python backend",
      ok: false,
      headline: "Backend je nedostupný",
      detail: "Nepodařilo se načíst Render health/admin status endpoint v časovém limitu.",
      href: backendUrl,
      checkedAt,
    }
  }
}

async function providerSummaries() {
  const [github, vercel, backend] = await Promise.all([
    githubSummary(),
    vercelSummary(),
    renderBackendSummary(),
  ])

  return [vercel, github, backend]
}

async function backendAuditEvents(): Promise<AuditLogItem[]> {
  const backendUrl =
    getSecret("RENDER_BACKEND_URL") || "https://fkdev-admin-api.onrender.com"
  const backendToken = getSecret("FK_BACKEND_ADMIN_TOKEN")

  if (!backendToken) {
    return []
  }

  try {
    const response = await fetchJson(
      `${backendUrl.replace(/\/$/, "")}/admin/audit?limit=20`,
      {
        headers: {
          Accept: "application/json",
          "X-FK-Backend-Token": backendToken,
        },
      },
    )

    if (!response.ok || !Array.isArray(response.data?.events)) {
      return []
    }

    return response.data.events.map((event: any) => ({
      id: String(event.id ?? ""),
      eventType: String(event.event_type ?? "unknown"),
      actor: String(event.actor ?? "system"),
      metadata:
        event.metadata && typeof event.metadata === "object"
          ? event.metadata
          : {},
      createdAt: String(event.created_at ?? ""),
    }))
  } catch {
    return []
  }
}

async function writeProviderSnapshot(
  providers: ProviderSummary[],
  operations: OperationCheck[],
) {
  const backendUrl =
    getSecret("RENDER_BACKEND_URL") || "https://fkdev-admin-api.onrender.com"
  const backendToken = getSecret("FK_BACKEND_ADMIN_TOKEN")

  if (!backendToken) {
    return null
  }

  const checks = [...providers, ...operations]
  const failing = checks.filter((item) => !item.ok)
  const status = failing.length === 0 ? "ok" : "degraded"
  const summary =
    failing.length === 0
      ? `${checks.length} kontrol bez zjevného problému`
      : `${failing.length} z ${checks.length} kontrol vyžaduje pozornost`

  try {
    const response = await fetchJson(
      `${backendUrl.replace(/\/$/, "")}/admin/provider-snapshots`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-FK-Backend-Token": backendToken,
        },
        body: JSON.stringify({
          source: "admin_overview",
          status,
          summary,
          payload: {
            providers,
            operations,
          },
        }),
      },
    )

    return response.ok ? response.data : null
  } catch {
    return null
  }
}

async function backendProviderSnapshots(): Promise<ProviderSnapshot[]> {
  const backendUrl =
    getSecret("RENDER_BACKEND_URL") || "https://fkdev-admin-api.onrender.com"
  const backendToken = getSecret("FK_BACKEND_ADMIN_TOKEN")

  if (!backendToken) {
    return []
  }

  try {
    const response = await fetchJson(
      `${backendUrl.replace(/\/$/, "")}/admin/provider-snapshots?limit=20`,
      {
        headers: {
          Accept: "application/json",
          "X-FK-Backend-Token": backendToken,
        },
      },
    )

    if (!response.ok || !Array.isArray(response.data?.snapshots)) {
      return []
    }

    return response.data.snapshots.map((snapshot: any) => ({
      id: String(snapshot.id ?? ""),
      source: String(snapshot.source ?? "unknown"),
      status: String(snapshot.status ?? "unknown"),
      summary: String(snapshot.summary ?? ""),
      payload:
        snapshot.payload && typeof snapshot.payload === "object"
          ? snapshot.payload
          : {},
      createdAt: String(snapshot.created_at ?? ""),
    }))
  } catch {
    return []
  }
}

async function backendContentState(): Promise<{
  blocks: ContentBlock[]
  versions: ContentVersion[]
}> {
  const backendUrl =
    getSecret("RENDER_BACKEND_URL") || "https://fkdev-admin-api.onrender.com"
  const backendToken = getSecret("FK_BACKEND_ADMIN_TOKEN")

  if (!backendToken) {
    return { blocks: [], versions: [] }
  }

  try {
    const response = await fetchJson(
      `${backendUrl.replace(/\/$/, "")}/admin/content`,
      {
        headers: {
          Accept: "application/json",
          "X-FK-Backend-Token": backendToken,
        },
      },
    )

    if (!response.ok || !Array.isArray(response.data?.blocks)) {
      return { blocks: [], versions: [] }
    }

    const blocks = response.data.blocks.map((block: any) => ({
      key: String(block.key ?? ""),
      label: String(block.label ?? ""),
      area: String(block.area ?? ""),
      draftValue: String(block.draft_value ?? ""),
      publishedValue: String(block.published_value ?? ""),
      updatedAt: String(block.updated_at ?? ""),
      publishedAt: block.published_at ? String(block.published_at) : null,
    }))
    const versions = Array.isArray(response.data?.versions)
      ? response.data.versions.map((version: any) => ({
          id: String(version.id ?? ""),
          blockKey: String(version.block_key ?? ""),
          value: String(version.value ?? ""),
          action: String(version.action ?? ""),
          actor: String(version.actor ?? ""),
          createdAt: String(version.created_at ?? ""),
        }))
      : []

    return { blocks, versions }
  } catch {
    return { blocks: [], versions: [] }
  }
}

async function backendTelemetrySummary(): Promise<TelemetrySummary> {
  const backendUrl =
    getSecret("RENDER_BACKEND_URL") || "https://fkdev-admin-api.onrender.com"
  const backendToken = getSecret("FK_BACKEND_ADMIN_TOKEN")
  const emptySummary = {
    activeSessions: 0,
    events15m: 0,
    events60m: 0,
    topPages: [],
    recentEvents: [],
  }

  if (!backendToken) {
    return emptySummary
  }

  try {
    const response = await fetchJson(
      `${backendUrl.replace(/\/$/, "")}/admin/telemetry/summary`,
      {
        headers: {
          Accept: "application/json",
          "X-FK-Backend-Token": backendToken,
        },
      },
    )

    if (!response.ok || !response.data) {
      return emptySummary
    }

    const topPages = Array.isArray(response.data.top_pages)
      ? response.data.top_pages.map((page: any) => ({
          path: String(page.path ?? "/"),
          visits: Number(page.visits ?? 0),
          lastSeenAt: String(page.last_seen_at ?? ""),
        }))
      : []
    const recentEvents = Array.isArray(response.data.recent_events)
      ? response.data.recent_events.map((event: any) => ({
          eventType: String(event.event_type ?? "page_view"),
          path: String(event.path ?? "/"),
          referrer: event.referrer ? String(event.referrer) : null,
          viewport: event.viewport ? String(event.viewport) : null,
          createdAt: String(event.created_at ?? ""),
        }))
      : []

    return {
      activeSessions: Number(response.data.active_sessions ?? 0),
      events15m: Number(response.data.events_15m ?? 0),
      events60m: Number(response.data.events_60m ?? 0),
      topPages,
      recentEvents,
    }
  } catch {
    return emptySummary
  }
}

function mapOpportunity(item: any): OpportunityItem {
  return {
    id: String(item.id ?? ""),
    sourceId: String(item.source_id ?? ""),
    category: String(item.category ?? "watch"),
    title: String(item.title ?? ""),
    summary: String(item.summary ?? ""),
    url: String(item.url ?? ""),
    region: String(item.region ?? ""),
    status: String(item.status ?? "watching"),
    deadline: item.deadline ? String(item.deadline) : null,
    score: Number(item.score ?? 0),
    matchReasons: Array.isArray(item.match_reasons)
      ? item.match_reasons.map((reason: unknown) => String(reason))
      : [],
    nextAction: String(item.next_action ?? ""),
    metadata:
      item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
        ? item.metadata
        : {},
    workflowStatus: String(item.workflow_status ?? "new"),
    adminNotes: String(item.admin_notes ?? ""),
    checklist: Array.isArray(item.checklist)
      ? item.checklist
          .filter((entry: unknown) => entry && typeof entry === "object")
          .map((entry: any) => ({
            id: String(entry.id ?? ""),
            label: String(entry.label ?? ""),
            done: Boolean(entry.done),
          }))
      : [],
    nextReviewAt: item.next_review_at ? String(item.next_review_at) : null,
    decisionUpdatedAt: item.decision_updated_at
      ? String(item.decision_updated_at)
      : null,
    firstSeenAt: String(item.first_seen_at ?? ""),
    lastSeenAt: String(item.last_seen_at ?? ""),
  }
}

function mapOfficialDraft(item: any): OfficialDraftItem {
  return {
    id: String(item.id ?? ""),
    opportunityId: item.opportunity_id ? String(item.opportunity_id) : null,
    purpose: String(item.purpose ?? "eligibility_question"),
    recipient: String(item.recipient ?? ""),
    subject: String(item.subject ?? ""),
    body: String(item.body ?? ""),
    attachments: Array.isArray(item.attachments)
      ? item.attachments
          .filter((entry: unknown) => entry && typeof entry === "object")
          .map((entry: any) => ({
            id: String(entry.id ?? ""),
            label: String(entry.label ?? ""),
            done: Boolean(entry.done),
          }))
      : [],
    reviewStatus: String(item.review_status ?? "draft"),
    metadata:
      item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
        ? item.metadata
        : {},
    createdAt: String(item.created_at ?? ""),
    updatedAt: String(item.updated_at ?? ""),
  }
}

async function backendOpportunities(): Promise<OpportunityItem[]> {
  const backendUrl =
    getSecret("RENDER_BACKEND_URL") || "https://fkdev-admin-api.onrender.com"
  const backendToken = getSecret("FK_BACKEND_ADMIN_TOKEN")

  if (!backendToken) {
    return []
  }

  try {
    const response = await fetchJson(
      `${backendUrl.replace(/\/$/, "")}/admin/opportunities?limit=12`,
      {
        headers: {
          Accept: "application/json",
          "X-FK-Backend-Token": backendToken,
        },
      },
    )

    if (!response.ok || !Array.isArray(response.data?.opportunities)) {
      return []
    }

    return response.data.opportunities.map(mapOpportunity)
  } catch {
    return []
  }
}

async function refreshBackendOpportunities() {
  const backendUrl =
    getSecret("RENDER_BACKEND_URL") || "https://fkdev-admin-api.onrender.com"
  const backendToken = getSecret("FK_BACKEND_ADMIN_TOKEN")

  if (!backendToken) {
    return { ok: false, status: 503, data: null }
  }

  return fetchJson(`${backendUrl.replace(/\/$/, "")}/admin/opportunities/refresh`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-FK-Backend-Token": backendToken,
    },
  })
}

async function saveBackendOpportunityWorkflow(input: {
  opportunityId: string
  workflowStatus: string
  adminNotes: string
  checklist: Array<{ id: string; label: string; done: boolean }>
  nextReviewAt: string | null
}) {
  const backendUrl =
    getSecret("RENDER_BACKEND_URL") || "https://fkdev-admin-api.onrender.com"
  const backendToken = getSecret("FK_BACKEND_ADMIN_TOKEN")

  if (!backendToken) {
    return { ok: false, status: 503, data: null }
  }

  return fetchJson(
    `${backendUrl.replace(/\/$/, "")}/admin/opportunities/${encodeURIComponent(input.opportunityId)}/workflow`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-FK-Backend-Token": backendToken,
      },
      body: JSON.stringify({
        workflow_status: input.workflowStatus,
        admin_notes: input.adminNotes,
        checklist: input.checklist,
        next_review_at: input.nextReviewAt,
      }),
    },
  )
}

async function backendOfficialDrafts(): Promise<OfficialDraftItem[]> {
  const backendUrl =
    getSecret("RENDER_BACKEND_URL") || "https://fkdev-admin-api.onrender.com"
  const backendToken = getSecret("FK_BACKEND_ADMIN_TOKEN")

  if (!backendToken) {
    return []
  }

  try {
    const response = await fetchJson(
      `${backendUrl.replace(/\/$/, "")}/admin/official-drafts?limit=20`,
      {
        headers: {
          Accept: "application/json",
          "X-FK-Backend-Token": backendToken,
        },
      },
    )

    if (!response.ok || !Array.isArray(response.data?.drafts)) {
      return []
    }

    return response.data.drafts.map(mapOfficialDraft)
  } catch {
    return []
  }
}

async function saveBackendOfficialDraft(input: {
  id: string | null
  opportunityId: string | null
  purpose: string
  recipient: string
  subject: string
  body: string
  attachments: Array<{ id: string; label: string; done: boolean }>
  reviewStatus: string
  metadata: Record<string, unknown>
}) {
  const backendUrl =
    getSecret("RENDER_BACKEND_URL") || "https://fkdev-admin-api.onrender.com"
  const backendToken = getSecret("FK_BACKEND_ADMIN_TOKEN")

  if (!backendToken) {
    return { ok: false, status: 503, data: null }
  }

  return fetchJson(`${backendUrl.replace(/\/$/, "")}/admin/official-drafts`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-FK-Backend-Token": backendToken,
    },
    body: JSON.stringify({
      id: input.id,
      opportunity_id: input.opportunityId,
      purpose: input.purpose,
      recipient: input.recipient,
      subject: input.subject,
      body: input.body,
      attachments: input.attachments,
      review_status: input.reviewStatus,
      metadata: input.metadata,
    }),
  })
}

function officialDraftMarkdown(input: {
  recipient: string
  subject: string
  body: string
  attachments: Array<{ id: string; label: string; done: boolean }>
}) {
  const attachments =
    input.attachments.length > 0
      ? input.attachments
          .map((item) => `- [${item.done ? "x" : " "}] ${item.label}`)
          .join("\n")
      : "- bez evidovaných příloh"

  return [
    `# ${input.subject}`,
    "",
    `Adresát: ${input.recipient || "neuveden"}`,
    `Vytvořeno: ${new Date().toISOString()}`,
    "",
    "## Text",
    "",
    input.body,
    "",
    "## Přílohy",
    "",
    attachments,
  ].join("\n")
}

function driveSafeFilename(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)

  return normalized || "uredni-koncept"
}

async function googleDriveAccessToken() {
  const clientId = getSecret("FK_GOOGLE_DRIVE_CLIENT_ID")
  const clientSecret = getSecret("FK_GOOGLE_DRIVE_CLIENT_SECRET")
  const refreshToken = getSecret("FK_GOOGLE_DRIVE_REFRESH_TOKEN")
  const serviceAccountJsonBase64 = getSecret("FK_GOOGLE_SERVICE_ACCOUNT_JSON_BASE64")

  if (serviceAccountJsonBase64) {
    try {
      const serviceAccount = JSON.parse(
        Buffer.from(serviceAccountJsonBase64, "base64").toString("utf8"),
      ) as {
        client_email?: string
        private_key?: string
        token_uri?: string
      }
      const now = Math.floor(Date.now() / 1000)
      const header = toBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }))
      const claim = toBase64Url(
        JSON.stringify({
          iss: serviceAccount.client_email,
          scope: "https://www.googleapis.com/auth/drive.file",
          aud: serviceAccount.token_uri || "https://oauth2.googleapis.com/token",
          exp: now + 3600,
          iat: now,
        }),
      )
      const signer = createSign("RSA-SHA256")
      signer.update(`${header}.${claim}`)
      const signature = signer.sign(String(serviceAccount.private_key), "base64url")
      const assertion = `${header}.${claim}.${signature}`
      const response = await fetchJson(
        serviceAccount.token_uri || "https://oauth2.googleapis.com/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion,
          }).toString(),
        },
        12000,
      )
      const token = typeof response.data?.access_token === "string"
        ? response.data.access_token
        : ""

      return {
        ok: response.ok && Boolean(token),
        status: response.status,
        token,
        message: response.ok ? "" : "Google service-account token se nepodařilo získat.",
      }
    } catch {
      return { ok: false, status: 503, token: "", message: "Google service-account konfigurace není platná." }
    }
  }

  if (!clientId || !clientSecret || !refreshToken) {
    return { ok: false, status: 503, token: "", message: "Google Drive OAuth není nastavený." }
  }

  const response = await fetchJson(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }).toString(),
    },
    12000,
  )

  const token = typeof response.data?.access_token === "string"
    ? response.data.access_token
    : ""

  return {
    ok: response.ok && Boolean(token),
    status: response.status,
    token,
    message: response.ok ? "" : "Google OAuth token se nepodařilo obnovit.",
  }
}

async function uploadOfficialDraftToDrive(input: {
  recipient: string
  subject: string
  body: string
  attachments: Array<{ id: string; label: string; done: boolean }>
}) {
  const folderId = getSecret("FK_GOOGLE_DRIVE_FOLDER_ID")

  if (!folderId) {
    return { ok: false, status: 503, data: null, message: "Chybí cílová složka Google Drive." }
  }

  const tokenResult = await googleDriveAccessToken()

  if (!tokenResult.ok) {
    return {
      ok: false,
      status: tokenResult.status || 503,
      data: null,
      message: tokenResult.message,
    }
  }

  const boundary = `fkdev-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const filename = `${new Date().toISOString().slice(0, 10)}-${driveSafeFilename(input.subject)}.md`
  const metadata = {
    name: filename,
    mimeType: "text/markdown",
    parents: [folderId],
  }
  const content = officialDraftMarkdown(input)
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: text/markdown; charset=UTF-8",
    "",
    content,
    `--${boundary}--`,
    "",
  ].join("\r\n")

  const response = await fetchJson(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,mimeType",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenResult.token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
    20000,
  )

  return {
    ok: response.ok,
    status: response.status,
    data: response.data,
    message: response.ok ? "" : "Nahrání do Google Drive se nepodařilo.",
  }
}

function extractResponseText(data: any) {
  if (typeof data?.output_text === "string") {
    return data.output_text
  }

  const parts: string[] = []

  if (Array.isArray(data?.output)) {
    for (const item of data.output) {
      if (!Array.isArray(item?.content)) {
        continue
      }

      for (const content of item.content) {
        if (typeof content?.text === "string") {
          parts.push(content.text)
        }
      }
    }
  }

  return parts.join("\n").trim()
}

function sanitizeAgentChecklist(items: unknown) {
  if (!Array.isArray(items)) {
    return []
  }

  return items
    .filter((entry) => entry && typeof entry === "object")
    .map((entry: any, index) => ({
      id: String(entry.id ?? `ai-check-${index}`),
      label: String(entry.label ?? "").trim().slice(0, 240),
      done: Boolean(entry.done),
    }))
    .filter((entry) => entry.label.length > 0)
    .slice(0, 12)
}

async function runOfficialDraftAgent(input: {
  purpose: string
  recipient: string
  subject: string
  body: string
  attachments: Array<{ id: string; label: string; done: boolean }>
  opportunityTitle: string
}) {
  const apiKey = getSecret("OPENAI_API_KEY")
  const model = getSecret("FK_AI_MODEL") || "gpt-4.1-mini"

  if (!apiKey) {
    return { ok: false, status: 503, data: null, message: "OPENAI_API_KEY není nastavený." }
  }

  const response = await fetchJson(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions: [
          "Jsi soukromý administrativní AI agent pro FKdev.",
          "Pracuješ česky, věcně a konzervativně.",
          "Nevymýšlej oprávnění, splnění dotačních podmínek ani právní jistotu.",
          "Výstup musí být návrh ke kontrole, ne finální odeslání.",
          "Zachovej identitu: František Kalášek, IČO 23628588, FKdev / TopBot PwnZ(TM), služby: webové aplikace, PWA, automatizace, API integrace, datové zpracování a IT konzultace.",
        ].join("\n"),
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify({
                  task: "Zreviduj a zlepši koncept úřední komunikace pro ruční kontrolu před datovou schránkou.",
                  purpose: input.purpose,
                  recipient: input.recipient,
                  subject: input.subject,
                  body: input.body,
                  attachments: input.attachments,
                  opportunityTitle: input.opportunityTitle,
                  requiredOutput: {
                    subject: "upravený předmět",
                    body: "upravený text zprávy",
                    checklist: "kontrolní položky před odesláním",
                    notes: "stručné poznámky a rizika",
                    riskLevel: "low | medium | high",
                  },
                }),
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "official_draft_agent_result",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                subject: { type: "string" },
                body: { type: "string" },
                checklist: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      id: { type: "string" },
                      label: { type: "string" },
                      done: { type: "boolean" },
                    },
                    required: ["id", "label", "done"],
                  },
                },
                notes: {
                  type: "array",
                  items: { type: "string" },
                },
                riskLevel: {
                  type: "string",
                  enum: ["low", "medium", "high"],
                },
              },
              required: ["subject", "body", "checklist", "notes", "riskLevel"],
            },
          },
        },
      }),
    },
    30000,
  )

  if (!response.ok) {
    return { ok: false, status: response.status, data: null, message: "AI revize se nepodařila." }
  }

  try {
    const parsed = JSON.parse(extractResponseText(response.data)) as OfficialDraftAgentResult
    const result: OfficialDraftAgentResult = {
      subject: String(parsed.subject ?? input.subject).trim().slice(0, 300),
      body: String(parsed.body ?? input.body).trim().slice(0, 12000),
      checklist: sanitizeAgentChecklist(parsed.checklist),
      notes: Array.isArray(parsed.notes)
        ? parsed.notes.map((note) => String(note).trim()).filter(Boolean).slice(0, 8)
        : [],
      riskLevel: ["low", "medium", "high"].includes(String(parsed.riskLevel))
        ? parsed.riskLevel
        : "medium",
    }

    return { ok: true, status: 200, data: result, message: "" }
  } catch {
    return { ok: false, status: 502, data: null, message: "AI vrátila neplatný formát odpovědi." }
  }
}

async function saveBackendContentBlock(input: {
  key: string
  label: string
  area: string
  draftValue: string
  publish: boolean
}) {
  const backendUrl =
    getSecret("RENDER_BACKEND_URL") || "https://fkdev-admin-api.onrender.com"
  const backendToken = getSecret("FK_BACKEND_ADMIN_TOKEN")

  if (!backendToken) {
    return { ok: false, status: 503, data: null }
  }

  return fetchJson(`${backendUrl.replace(/\/$/, "")}/admin/content`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-FK-Backend-Token": backendToken,
    },
    body: JSON.stringify({
      key: input.key,
      label: input.label,
      area: input.area,
      draft_value: input.draftValue,
      publish: input.publish,
    }),
  })
}

async function checkBackendContent(value: string) {
  const backendUrl =
    getSecret("RENDER_BACKEND_URL") || "https://fkdev-admin-api.onrender.com"
  const backendToken = getSecret("FK_BACKEND_ADMIN_TOKEN")

  if (!backendToken) {
    return { ok: false, status: 503, data: null }
  }

  return fetchJson(`${backendUrl.replace(/\/$/, "")}/admin/content/check`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-FK-Backend-Token": backendToken,
    },
    body: JSON.stringify({
      value,
    }),
  })
}

async function rollbackBackendContentBlock(versionId: string) {
  const backendUrl =
    getSecret("RENDER_BACKEND_URL") || "https://fkdev-admin-api.onrender.com"
  const backendToken = getSecret("FK_BACKEND_ADMIN_TOKEN")

  if (!backendToken) {
    return { ok: false, status: 503, data: null }
  }

  return fetchJson(`${backendUrl.replace(/\/$/, "")}/admin/content/rollback`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-FK-Backend-Token": backendToken,
    },
    body: JSON.stringify({
      version_id: versionId,
    }),
  })
}

async function githubWorkflowChecks(): Promise<OperationCheck[]> {
  const checkedAt = new Date().toISOString()
  const token = getAnySecret(["GITHUB_TOKEN", "GITHUB_API_KEY"])

  if (!token) {
    return [
      {
        id: "github-actions",
        label: "GitHub Actions",
        ok: false,
        headline: "Token není nastavený",
        detail: "Chybí serverová proměnná GITHUB_TOKEN nebo GITHUB_API_KEY.",
        checkedAt,
      },
    ]
  }

  try {
    const response = await fetchJson(
      "https://api.github.com/repos/LeafyShadow696/FK-dev/actions/runs?branch=main&per_page=3",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "fkdev-admin-portal",
        },
      },
    )

    if (!response.ok || !Array.isArray(response.data?.workflow_runs)) {
      return [
        {
          id: "github-actions",
          label: "GitHub Actions",
          ok: false,
          headline: "GitHub Actions nejsou dostupné",
          detail: `Workflow runs status ${response.status}.`,
          checkedAt,
        },
      ]
    }

    const runs = response.data.workflow_runs.slice(0, 3)

    if (runs.length === 0) {
      return [
        {
          id: "github-actions-empty",
          label: "GitHub Actions",
          ok: true,
          headline: "Bez workflow běhů",
          detail: "Repozitář zatím nevrátil žádné běhy GitHub Actions pro main.",
          checkedAt,
        },
      ]
    }

    return runs.map((run: any) => {
      const status = String(run.status ?? "unknown")
      const conclusion = String(run.conclusion ?? "")
      const ok = status === "completed" && conclusion === "success"
      const name = String(run.name ?? "Workflow")
      const branch = String(run.head_branch ?? "main")

      return {
        id: `github-actions-${String(run.id ?? name)}`,
        label: "GitHub Actions",
        ok,
        headline: `${name}: ${conclusion || status}`,
        detail: `${branch} · ${formatDateTime(run.updated_at ?? run.created_at)}`,
        href: String(run.html_url ?? "https://github.com/LeafyShadow696/FK-dev/actions"),
        checkedAt,
      }
    })
  } catch {
    return [
      {
        id: "github-actions",
        label: "GitHub Actions",
        ok: false,
        headline: "GitHub Actions API je nedostupné",
        detail: "Nepodařilo se načíst poslední workflow běhy v časovém limitu.",
        checkedAt,
      },
    ]
  }
}

async function vercelDomainChecks(): Promise<OperationCheck[]> {
  const checkedAt = new Date().toISOString()
  const token = getAnySecret(["VERCEL_API_TOKEN", "VERCEL_TOKEN", "VERCEL_API_KEY"])
  const projectId = getSecret("VERCEL_PROJECT_ID") || "prj_5rwIhFXRqZ0Q0i0tiVGuSPUMVhGn"
  const teamId = getSecret("VERCEL_TEAM_ID") || "team_Q7P5ptcXkEL5SBpsQ2edIgr3"

  if (!token) {
    return [
      {
        id: "vercel-domains",
        label: "Vercel domény",
        ok: false,
        headline: "Token není nastavený",
        detail: "Chybí serverová proměnná VERCEL_TOKEN, VERCEL_API_TOKEN nebo VERCEL_API_KEY.",
        checkedAt,
      },
    ]
  }

  try {
    const response = await fetchJson(
      `https://api.vercel.com/v9/projects/${projectId}/domains?teamId=${teamId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    if (!response.ok || !Array.isArray(response.data?.domains)) {
      return [
        {
          id: "vercel-domains",
          label: "Vercel domény",
          ok: false,
          headline: "Vercel domény nejsou dostupné",
          detail: `Project domains status ${response.status}.`,
          checkedAt,
        },
      ]
    }

    return response.data.domains.map((domain: any) => {
      const name = String(domain.name ?? "neznámá doména")
      const verified = Boolean(domain.verified)
      const redirect = domain.redirect ? `redirect na ${String(domain.redirect)}` : "bez redirectu"

      return {
        id: `vercel-domain-${name}`,
        label: "Vercel doména",
        ok: verified,
        headline: name,
        detail: `${verified ? "ověřená" : "neověřená"} · ${redirect}`,
        href: `https://${name}`,
        checkedAt,
      }
    })
  } catch {
    return [
      {
        id: "vercel-domains",
        label: "Vercel domény",
        ok: false,
        headline: "Vercel Domains API je nedostupné",
        detail: "Nepodařilo se načíst stav domén v časovém limitu.",
        checkedAt,
      },
    ]
  }
}

async function operationChecks() {
  const [githubWorkflows, vercelDomains] = await Promise.all([
    githubWorkflowChecks(),
    vercelDomainChecks(),
  ])

  return [...vercelDomains, ...githubWorkflows]
}

function isAuthenticated(req: any, sessionSecret: string) {
  const token = parseCookie(req.headers.cookie, SESSION_COOKIE)

  return Boolean(token && verifySessionToken(token, sessionSecret))
}

function requireAuth(req: any, res: any, sessionSecret: string) {
  if (!isAuthenticated(req, sessionSecret)) {
    sendJson(res, 401, { authenticated: false })
    return false
  }

  return true
}

export default async function handler(req: any, res: any) {
  const action = String(req.query.action ?? "")
  const config = authConfig()

  if (action === "session") {
    if (!config.ready) {
      sendJson(res, 503, {
        authenticated: false,
        ready: false,
        message: "Admin přístup čeká na nastavení serverových proměnných.",
      })
      return
    }

    sendJson(res, 200, {
      authenticated: isAuthenticated(req, config.sessionSecret),
      ready: true,
    })
    return
  }

  if (action === "login") {
    if (req.method !== "POST") {
      sendJson(res, 405, { message: "Metoda není povolená." })
      return
    }

    if (!config.ready) {
      sendJson(res, 503, {
        message: "Admin přístup čeká na nastavení serverových proměnných.",
      })
      return
    }

    const body = readBody(req)
    const accessKey = typeof body.accessKey === "string" ? body.accessKey : ""

    if (!safeEqual(accessKey, config.accessKey)) {
      sendJson(res, 401, { message: "Přístupový klíč není správný." })
      return
    }

    const secure = req.headers["x-forwarded-proto"] === "https" ? "; Secure" : ""
    res.setHeader(
      "Set-Cookie",
      `${SESSION_COOKIE}=${encodeURIComponent(
        createSessionToken(config.sessionSecret),
      )}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`,
    )
    sendJson(res, 200, { authenticated: true })
    return
  }

  if (action === "logout") {
    if (req.method !== "POST") {
      sendJson(res, 405, { message: "Metoda není povolená." })
      return
    }

    res.setHeader(
      "Set-Cookie",
      `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    )
    sendJson(res, 200, { authenticated: false })
    return
  }

  if (action === "content") {
    if (req.method !== "POST") {
      sendJson(res, 405, { message: "Metoda není povolená." })
      return
    }

    if (!config.ready) {
      sendJson(res, 503, {
        message: "Admin přístup čeká na nastavení serverových proměnných.",
      })
      return
    }

    if (!requireAuth(req, res, config.sessionSecret)) {
      return
    }

    const body = readBody(req)
    const key = typeof body.key === "string" ? body.key.trim() : ""
    const label = typeof body.label === "string" ? body.label.trim() : ""
    const area = typeof body.area === "string" ? body.area.trim() : ""
    const draftValue =
      typeof body.draftValue === "string" ? body.draftValue.trim() : ""
    const publish = body.publish === true

    if (
      key.length < 2 ||
      key.length > 80 ||
      label.length < 2 ||
      label.length > 120 ||
      area.length < 2 ||
      area.length > 80 ||
      draftValue.length < 1 ||
      draftValue.length > 4000
    ) {
      sendJson(res, 400, { message: "Obsahový blok nemá platný formát." })
      return
    }

    const saved = await saveBackendContentBlock({
      key,
      label,
      area,
      draftValue,
      publish,
    })

    if (!saved.ok) {
      sendJson(res, saved.status || 502, {
        message:
          saved.data?.detail?.message ??
          "Nepodařilo se uložit obsah do backendu.",
        quality: saved.data?.detail?.quality,
      })
      return
    }

    sendJson(res, 200, saved.data)
    return
  }

  if (action === "opportunities-refresh") {
    if (req.method !== "POST") {
      sendJson(res, 405, { message: "Metoda není povolená." })
      return
    }

    if (!config.ready) {
      sendJson(res, 503, {
        message: "Admin přístup čeká na nastavení serverových proměnných.",
      })
      return
    }

    if (!requireAuth(req, res, config.sessionSecret)) {
      return
    }

    const refreshed = await refreshBackendOpportunities()

    if (!refreshed.ok) {
      sendJson(res, refreshed.status || 502, {
        message: "Nepodařilo se obnovit radar příležitostí.",
      })
      return
    }

    sendJson(res, 200, {
      refreshed: true,
      count: Number(refreshed.data?.count ?? 0),
      opportunities: Array.isArray(refreshed.data?.opportunities)
        ? refreshed.data.opportunities.map(mapOpportunity)
        : [],
    })
    return
  }

  if (action === "opportunity-workflow") {
    if (req.method !== "POST") {
      sendJson(res, 405, { message: "Metoda není povolená." })
      return
    }

    if (!config.ready) {
      sendJson(res, 503, {
        message: "Admin přístup čeká na nastavení serverových proměnných.",
      })
      return
    }

    if (!requireAuth(req, res, config.sessionSecret)) {
      return
    }

    const body = readBody(req)
    const opportunityId =
      typeof body.opportunityId === "string" ? body.opportunityId.trim() : ""
    const workflowStatus =
      typeof body.workflowStatus === "string" ? body.workflowStatus.trim() : "verify"
    const adminNotes =
      typeof body.adminNotes === "string" ? body.adminNotes.trim() : ""
    const nextReviewAt =
      typeof body.nextReviewAt === "string" && body.nextReviewAt.trim()
        ? body.nextReviewAt.trim()
        : null
    const checklist = Array.isArray(body.checklist)
      ? body.checklist
          .filter((entry: unknown) => entry && typeof entry === "object")
          .map((entry: any) => ({
            id: String(entry.id ?? ""),
            label: String(entry.label ?? "").trim(),
            done: Boolean(entry.done),
          }))
          .filter((entry) => entry.label.length > 0)
      : []

    if (opportunityId.length < 8 || adminNotes.length > 4000) {
      sendJson(res, 400, { message: "Neplatná příležitost nebo poznámka." })
      return
    }

    const saved = await saveBackendOpportunityWorkflow({
      opportunityId,
      workflowStatus,
      adminNotes,
      checklist,
      nextReviewAt,
    })

    if (!saved.ok || !saved.data?.opportunity) {
      sendJson(res, saved.status || 502, {
        message: "Nepodařilo se uložit stav příležitosti.",
      })
      return
    }

    sendJson(res, 200, {
      stored: true,
      opportunity: mapOpportunity(saved.data.opportunity),
    })
    return
  }

  if (action === "official-draft") {
    if (req.method !== "POST") {
      sendJson(res, 405, { message: "Metoda není povolená." })
      return
    }

    if (!config.ready) {
      sendJson(res, 503, {
        message: "Admin přístup čeká na nastavení serverových proměnných.",
      })
      return
    }

    if (!requireAuth(req, res, config.sessionSecret)) {
      return
    }

    const body = readBody(req)
    const subject = typeof body.subject === "string" ? body.subject.trim() : ""
    const draftBody = typeof body.body === "string" ? body.body.trim() : ""
    const recipient = typeof body.recipient === "string" ? body.recipient.trim() : ""
    const purpose =
      typeof body.purpose === "string" ? body.purpose.trim() : "eligibility_question"
    const reviewStatus =
      typeof body.reviewStatus === "string" ? body.reviewStatus.trim() : "draft"
    const allowedReviewStatuses = new Set([
      "draft",
      "ready_for_review",
      "ready_for_isds",
      "sent_manually",
      "archived",
    ])
    const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : null
    const opportunityId =
      typeof body.opportunityId === "string" && body.opportunityId.trim()
        ? body.opportunityId.trim()
        : null
    const attachments = Array.isArray(body.attachments)
      ? body.attachments
          .filter((entry: unknown) => entry && typeof entry === "object")
          .map((entry: any) => ({
            id: String(entry.id ?? ""),
            label: String(entry.label ?? "").trim(),
            done: Boolean(entry.done),
          }))
          .filter((entry) => entry.label.length > 0)
      : []
    const metadata =
      body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? (body.metadata as Record<string, unknown>)
        : {}

    if (subject.length < 2 || draftBody.length < 2 || draftBody.length > 12000) {
      sendJson(res, 400, { message: "Koncept nemá platný předmět nebo text." })
      return
    }

    if (!allowedReviewStatuses.has(reviewStatus)) {
      sendJson(res, 400, { message: "Koncept nemá platný stav kontroly." })
      return
    }

    const saved = await saveBackendOfficialDraft({
      id,
      opportunityId,
      purpose,
      recipient,
      subject,
      body: draftBody,
      attachments,
      reviewStatus,
      metadata,
    })

    if (!saved.ok || !saved.data?.draft) {
      sendJson(res, saved.status || 502, {
        message: "Nepodařilo se uložit úřední koncept.",
      })
      return
    }

    sendJson(res, 200, {
      stored: true,
      draft: mapOfficialDraft(saved.data.draft),
      drafts: Array.isArray(saved.data.drafts)
        ? saved.data.drafts.map(mapOfficialDraft)
        : [],
    })
    return
  }

  if (action === "official-draft-archive") {
    if (req.method !== "POST") {
      sendJson(res, 405, { message: "Metoda není povolená." })
      return
    }

    if (!config.ready) {
      sendJson(res, 503, {
        message: "Admin přístup čeká na nastavení serverových proměnných.",
      })
      return
    }

    if (!requireAuth(req, res, config.sessionSecret)) {
      return
    }

    const body = readBody(req)
    const subject = typeof body.subject === "string" ? body.subject.trim() : ""
    const draftBody = typeof body.body === "string" ? body.body.trim() : ""
    const recipient = typeof body.recipient === "string" ? body.recipient.trim() : ""
    const purpose =
      typeof body.purpose === "string" ? body.purpose.trim() : "eligibility_question"
    const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : null
    const opportunityId =
      typeof body.opportunityId === "string" && body.opportunityId.trim()
        ? body.opportunityId.trim()
        : null
    const attachments = Array.isArray(body.attachments)
      ? body.attachments
          .filter((entry: unknown) => entry && typeof entry === "object")
          .map((entry: any) => ({
            id: String(entry.id ?? ""),
            label: String(entry.label ?? "").trim(),
            done: Boolean(entry.done),
          }))
          .filter((entry) => entry.label.length > 0)
      : []
    const metadata =
      body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? (body.metadata as Record<string, unknown>)
        : {}

    if (subject.length < 2 || draftBody.length < 2 || draftBody.length > 12000) {
      sendJson(res, 400, { message: "Koncept nemá platný předmět nebo text." })
      return
    }

    const uploaded = await uploadOfficialDraftToDrive({
      recipient,
      subject,
      body: draftBody,
      attachments,
    })

    if (!uploaded.ok) {
      sendJson(res, uploaded.status || 502, {
        message: uploaded.message || "Koncept se nepodařilo archivovat do Google Drive.",
      })
      return
    }

    const saved = await saveBackendOfficialDraft({
      id,
      opportunityId,
      purpose,
      recipient,
      subject,
      body: draftBody,
      attachments,
      reviewStatus: "ready_for_isds",
      metadata: {
        ...metadata,
        archiveTarget: "google_drive",
        archivedAt: new Date().toISOString(),
        googleDriveFile: uploaded.data,
      },
    })

    if (!saved.ok || !saved.data?.draft) {
      sendJson(res, saved.status || 502, {
        message: "Archiv byl vytvořen, ale metadata konceptu se nepodařilo uložit.",
        driveFile: uploaded.data,
      })
      return
    }

    sendJson(res, 200, {
      archived: true,
      driveFile: uploaded.data,
      draft: mapOfficialDraft(saved.data.draft),
      drafts: Array.isArray(saved.data.drafts)
        ? saved.data.drafts.map(mapOfficialDraft)
        : [],
    })
    return
  }

  if (action === "official-draft-agent") {
    if (req.method !== "POST") {
      sendJson(res, 405, { message: "Metoda není povolená." })
      return
    }

    if (!config.ready) {
      sendJson(res, 503, {
        message: "Admin přístup čeká na nastavení serverových proměnných.",
      })
      return
    }

    if (!requireAuth(req, res, config.sessionSecret)) {
      return
    }

    const body = readBody(req)
    const subject = typeof body.subject === "string" ? body.subject.trim() : ""
    const draftBody = typeof body.body === "string" ? body.body.trim() : ""
    const recipient = typeof body.recipient === "string" ? body.recipient.trim() : ""
    const purpose =
      typeof body.purpose === "string" ? body.purpose.trim() : "eligibility_question"
    const opportunityTitle =
      typeof body.opportunityTitle === "string" ? body.opportunityTitle.trim() : ""
    const attachments = Array.isArray(body.attachments)
      ? body.attachments
          .filter((entry: unknown) => entry && typeof entry === "object")
          .map((entry: any) => ({
            id: String(entry.id ?? ""),
            label: String(entry.label ?? "").trim(),
            done: Boolean(entry.done),
          }))
          .filter((entry) => entry.label.length > 0)
      : []

    if (subject.length < 2 || draftBody.length < 2 || draftBody.length > 12000) {
      sendJson(res, 400, { message: "Koncept nemá platný předmět nebo text." })
      return
    }

    const result = await runOfficialDraftAgent({
      purpose,
      recipient,
      subject,
      body: draftBody,
      attachments,
      opportunityTitle,
    })

    if (!result.ok || !result.data) {
      sendJson(res, result.status || 502, {
        message: result.message || "AI agent teď není dostupný.",
      })
      return
    }

    sendJson(res, 200, {
      reviewed: true,
      result: result.data,
    })
    return
  }

  if (action === "content-check") {
    if (req.method !== "POST") {
      sendJson(res, 405, { message: "Metoda není povolená." })
      return
    }

    if (!config.ready) {
      sendJson(res, 503, {
        message: "Admin přístup čeká na nastavení serverových proměnných.",
      })
      return
    }

    if (!requireAuth(req, res, config.sessionSecret)) {
      return
    }

    const body = readBody(req)
    const value = typeof body.value === "string" ? body.value.trim() : ""

    if (value.length < 1 || value.length > 4000) {
      sendJson(res, 400, { message: "Text nemá platný formát." })
      return
    }

    const checked = await checkBackendContent(value)

    if (!checked.ok) {
      sendJson(res, checked.status || 502, {
        message: "Nepodařilo se zkontrolovat obsah.",
      })
      return
    }

    sendJson(res, 200, checked.data)
    return
  }

  if (action === "content-rollback") {
    if (req.method !== "POST") {
      sendJson(res, 405, { message: "Metoda není povolená." })
      return
    }

    if (!config.ready) {
      sendJson(res, 503, {
        message: "Admin přístup čeká na nastavení serverových proměnných.",
      })
      return
    }

    if (!requireAuth(req, res, config.sessionSecret)) {
      return
    }

    const body = readBody(req)
    const versionId =
      typeof body.versionId === "string" ? body.versionId.trim() : ""

    if (versionId.length < 8 || versionId.length > 80) {
      sendJson(res, 400, { message: "Neplatná verze pro rollback." })
      return
    }

    const rolledBack = await rollbackBackendContentBlock(versionId)

    if (!rolledBack.ok) {
      sendJson(res, rolledBack.status || 502, {
        message: "Nepodařilo se obnovit publikovanou verzi.",
      })
      return
    }

    sendJson(res, 200, rolledBack.data)
    return
  }

  if (action === "overview") {
    if (!config.ready) {
      sendJson(res, 503, {
        message: "Admin přístup čeká na nastavení serverových proměnných.",
      })
      return
    }

    if (!requireAuth(req, res, config.sessionSecret)) {
      return
    }

    const integrations = integrationStatuses()

    const [providers, auditLogs, operations, contentState, telemetry, opportunities, officialDrafts] = await Promise.all([
      providerSummaries(),
      backendAuditEvents(),
      operationChecks(),
      backendContentState(),
      backendTelemetrySummary(),
      backendOpportunities(),
      backendOfficialDrafts(),
    ])
    await writeProviderSnapshot(providers, operations)
    const providerSnapshots = await backendProviderSnapshots()

    sendJson(res, 200, {
      generatedAt: new Date().toISOString(),
      environment: process.env.VERCEL_ENV ?? "local",
      project: {
        name: "fkdev.xyz",
        canonicalUrl: "https://fkdev.xyz",
        repository: "LeafyShadow696/FK-dev",
      },
      integrations,
      providers,
      auditLogs,
      operations,
      providerSnapshots,
      contentBlocks: contentState.blocks,
      contentVersions: contentState.versions,
      telemetry,
      opportunities,
      officialDrafts,
      configuredIntegrations: integrations.filter((item) => item.configured)
        .length,
      checklist: [
        "Rozšířit Vercel stav o build logy a Web Analytics.",
        "Rozšířit live návštěvnost o denní/tydenní agregace.",
        "Doplnit parsery konkrétních zakázek a dotačních výzev do Opportunity Radaru.",
        "Přidat filtr a agregace historie provozních snapshotů.",
      ],
    })
    return
  }

  sendJson(res, 404, { message: "Neznámý admin endpoint." })
}
