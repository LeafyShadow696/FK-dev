import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"

const SESSION_COOKIE = "fk_admin_session"
const SESSION_TTL_SECONDS = 60 * 60 * 8

type IntegrationStatus = {
  id: string
  label: string
  configured: boolean
  description: string
}

function getSecret(name: string) {
  return process.env[name]?.trim() ?? ""
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
  return [
    {
      id: "vercel",
      label: "Vercel",
      configured: Boolean(getSecret("VERCEL_API_TOKEN")),
      description: "Deploymenty, domény, build logy a produkční stav.",
    },
    {
      id: "github",
      label: "GitHub",
      configured: Boolean(getSecret("GITHUB_TOKEN")),
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
      configured: Boolean(getSecret("RAILWAY_API_TOKEN")),
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
  ]
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

export default function handler(req: any, res: any) {
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

    sendJson(res, 200, {
      generatedAt: new Date().toISOString(),
      environment: process.env.VERCEL_ENV ?? "local",
      project: {
        name: "fkdev.xyz",
        canonicalUrl: "https://fkdev.xyz",
        repository: "LeafyShadow696/FK-dev",
      },
      integrations,
      configuredIntegrations: integrations.filter((item) => item.configured)
        .length,
      checklist: [
        "Nastavit produkční admin env proměnné.",
        "Doplnit databázi pro audit log a nastavení portálu.",
        "Napojit čtení deploymentů z Vercel API.",
        "Napojit GitHub stav repozitáře a workflow.",
        "Rozhodnout, zda backend poběží na Vercelu, Renderu nebo Railway.",
      ],
    })
    return
  }

  sendJson(res, 404, { message: "Neznámý admin endpoint." })
}
