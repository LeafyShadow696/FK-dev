/**
 * GET /api/health
 *
 * Lightweight uptime / health-check endpoint.
 *
 * Runs on the Vercel Edge runtime:
 * - extremely low cold start
 * - no Node-specific APIs required
 * - no environment variables required
 * - safe to call from monitoring services (UptimeRobot, BetterStack, etc.)
 *
 * Returns:
 *   {
 *     ok: true,
 *     service: "fkdev.xyz",
 *     timestamp: "<ISO 8601>",
 *     region: "<edge region>"
 *   }
 *
 * No personal data is returned. No request body is accepted or stored.
 */

export const config = {
  runtime: "edge",
}

export default function handler(): Response {
  const body = {
    ok: true,
    service: "fkdev.xyz",
    timestamp: new Date().toISOString(),
    region: process.env.VERCEL_REGION ?? "local",
  }

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=60, stale-while-revalidate=600",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
    },
  })
}
