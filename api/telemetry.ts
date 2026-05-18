function getBackendUrl() {
  return (
    process.env.RENDER_BACKEND_URL?.trim() ||
    "https://fkdev-admin-api.onrender.com"
  ).replace(/\/$/, "")
}

function getBackendToken() {
  return process.env.FK_BACKEND_ADMIN_TOKEN?.trim() ?? ""
}

function sendJson(res: any, status: number, body: unknown) {
  res.setHeader("Content-Type", "application/json; charset=utf-8")
  res.setHeader("Cache-Control", "no-store")
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

  return req.body && typeof req.body === "object"
    ? (req.body as Record<string, unknown>)
    : {}
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : ""
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    sendJson(res, 405, { stored: false })
    return
  }

  const backendToken = getBackendToken()

  if (!backendToken) {
    sendJson(res, 202, { stored: false })
    return
  }

  const body = readBody(req)
  const sessionId = cleanText(body.sessionId, 80)
  const eventType = cleanText(body.eventType, 40)
  const path = cleanText(body.path, 240)
  const referrer = cleanText(body.referrer, 240)
  const viewport = cleanText(body.viewport, 80)

  if (sessionId.length < 12 || eventType.length < 2 || path.length < 1) {
    sendJson(res, 400, { stored: false })
    return
  }

  try {
    const response = await fetch(`${getBackendUrl()}/admin/telemetry`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-FK-Backend-Token": backendToken,
      },
      body: JSON.stringify({
        session_id: sessionId,
        event_type: eventType,
        path,
        referrer: referrer || null,
        viewport: viewport || null,
        metadata: {
          source: "fkdev.xyz",
        },
      }),
    })

    sendJson(res, response.ok ? 202 : 502, { stored: response.ok })
  } catch {
    sendJson(res, 202, { stored: false })
  }
}
