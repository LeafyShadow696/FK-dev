import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"

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
      label: "Cloud storage",
      configured: Boolean(getSecret("FK_STORAGE_CONNECTION")),
      description: "Bezpečné ukládání souborů, exportů a budoucích assetů.",
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

async function fetchJson(url: string, init: RequestInit) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

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
    const [health, adminStatus] = await Promise.all([
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
      ok: health.data?.status === "ok" && (adminStatus.ok || adminStatus.status === 404),
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

    const providers = await providerSummaries()

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
      configuredIntegrations: integrations.filter((item) => item.configured)
        .length,
      checklist: [
        "Ověřit Render Postgres přes backend endpoint /admin/status.",
        "Nastavit FK_BACKEND_ADMIN_TOKEN pro chráněné backend audit zápisy.",
        "Rozšířit GitHub stav o workflow a poslední běhy CI.",
        "Rozšířit Vercel stav o domény, build logy a Web Analytics.",
        "Přidat první read-only admin data z PostgreSQL do portálu.",
      ],
    })
    return
  }

  sendJson(res, 404, { message: "Neznámý admin endpoint." })
}
