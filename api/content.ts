function getBackendUrl() {
  return (
    process.env.RENDER_BACKEND_URL?.trim() ||
    "https://fkdev-admin-api.onrender.com"
  ).replace(/\/$/, "")
}

function sendJson(res: any, status: number, body: unknown) {
  res.setHeader("Content-Type", "application/json; charset=utf-8")
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300")
  res.status(status).send(JSON.stringify(body))
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    sendJson(res, 405, { content: {} })
    return
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3000)

  try {
    const response = await fetch(`${getBackendUrl()}/content/published`, {
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    })
    const data = response.ok ? await response.json() : { content: {} }

    sendJson(res, 200, {
      content:
        data?.content && typeof data.content === "object" ? data.content : {},
    })
  } catch {
    sendJson(res, 200, { content: {} })
  } finally {
    clearTimeout(timeout)
  }
}
