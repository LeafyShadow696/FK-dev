import { expect, test } from "@playwright/test"

const routes = [
  { path: "/", h1: "František Kalášek" },
  { path: "/sluzby", h1: "Digitální řešení a automatizace" },
  { path: "/spoluprace", h1: "Od prvního zadání po předání řešení" },
  { path: "/priklady", h1: "Problémy a scénáře" },
  { path: "/kontakt", h1: "Spojme se a něco postavme" },
  { path: "/cookies", h1: "Zásady používání cookies" },
  { path: "/ochrana-osobnich-udaju", h1: "Ochrana osobních údajů" },
  { path: "/podminky-pouziti", h1: "Podmínky použití webu" },
]

test.describe("production routes", () => {
  for (const route of routes) {
    test(`${route.path} renders`, async ({ page }) => {
      const response = await page.goto(route.path)

      expect(response?.status()).toBe(200)
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        route.h1,
      )
      await expect(page).toHaveTitle(/František Kalášek|Služby|Kontakt|cookies|údajů|Podmínky/)
    })
  }
})

test("home page has primary contact actions", async ({ page }) => {
  await page.goto("/")

  await expect(page.getByText("Typické situace", { exact: true })).toBeVisible()
  await expect(page.getByText("Ruční práce bere čas")).toBeVisible()
  await expect(page.getByRole("link", { name: "Další typické situace" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Všechny služby" })).toBeVisible()
  await expect(page.getByText("Pojďme to probrat")).toBeVisible()
  await expect(page.getByRole("link", { name: "Napsat e-mail" }).first()).toBeVisible()
  await expect(page.getByRole("link", { name: "Chci konzultaci" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Zavolat" }).first()).toBeVisible()
  await expect(page.locator("canvas")).toHaveCount(1)
})

test("services page explains fit, outputs, and examples", async ({ page }) => {
  await page.goto("/sluzby")

  await expect(page.getByText("Weby a PWA")).toBeVisible()
  await expect(page.getByText("Automatizace a interní nástroje")).toBeVisible()
  await expect(page.getByText("Technické konzultace a provoz")).toBeVisible()
  await expect(page.getByText("Kdy se hodí").first()).toBeVisible()
  await expect(page.getByText("Výstup").first()).toBeVisible()
  await expect(page.getByRole("link", { name: "Jak probíhá spolupráce" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Příklady řešení" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Poslat zadání" })).toBeVisible()
})

test("collaboration page contains process and FAQ", async ({ page }) => {
  await page.goto("/spoluprace")

  await expect(page.getByText("Konzultace nebo audit")).toBeVisible()
  await expect(page.getByText("Návrh postupu")).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Co má být na konci hotové" }),
  ).toBeVisible()
  await expect(page.getByText("Časté otázky před spoluprací")).toBeVisible()
})

test("examples page contains scenarios and CTA", async ({ page }) => {
  await page.goto("/priklady")

  await expect(page.getByText("Ruční práce bere čas")).toBeVisible()
  await expect(page.getByText("Automatizace opakované agendy")).toBeVisible()
  await expect(page.getByText("Automatizace tabulkového procesu")).toBeVisible()
  await expect(page.getByText("API propojení nástrojů")).toBeVisible()
  await expect(page.getByRole("link", { name: "Popsat problém" })).toBeVisible()
})

test("contact page provides brief guidance and copy actions", async ({ page }) => {
  await page.goto("/kontakt")

  await expect(page.getByText("Co poslat pro rychlejší návrh postupu")).toBeVisible()
  await expect(page.getByText("Co řešíte a proč je to teď důležité")).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Javorek 54, 592 03 Javorek, Česko" }).first(),
  ).toHaveAttribute("href", /google\.com\/maps/)
  await expect(page.getByRole("button", { name: "Zkopírovat e-mail" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Zkopírovat šablonu" })).toBeVisible()
})

test("footer exposes embedded map and map links", async ({ page }) => {
  await page.goto("/")

  await expect(page.getByRole("heading", { name: "Kontaktní adresa" })).toBeVisible()
  await expect(page.locator('iframe[title^="Mapa:"]')).toHaveAttribute(
    "src",
    /google\.com\/maps/,
  )
  await expect(
    page.getByRole("link", { name: /Javorek 54/ }).last(),
  ).toHaveAttribute("target", "_blank")
})

test("mobile navigation opens", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")

  await expect(page.getByRole("link", { name: /František Kalášek/ }).first()).toBeVisible()
  await page.getByRole("button", { name: "Otevřít menu" }).click()

  await expect(page.getByRole("navigation", { name: "Mobilní" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Spolupráce" }).last()).toBeVisible()
  await expect(page.getByRole("link", { name: "Příklady" }).last()).toBeVisible()
  await expect(page.getByRole("link", { name: "Kontakt" }).last()).toBeVisible()
})

test("mobile monograms use render-safe unique gradients", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")

  await expect(page.locator('header [data-testid="fk-monogram"]')).toBeVisible()
  await expect(page.locator('#vizitka [data-testid="fk-monogram"]')).toBeVisible()

  const gradientChecks = await page.evaluate(() => {
    const svgs = [
      document.querySelector('header [data-testid="fk-monogram"]'),
      document.querySelector('#vizitka [data-testid="fk-monogram"]'),
    ].filter((svg): svg is Element => svg instanceof Element)

    return svgs.map((svg) => {
      const gradient = svg.querySelector("linearGradient")
      const gradientId = gradient?.getAttribute("id") ?? ""
      const stroke = svg.querySelector("g")?.getAttribute("stroke") ?? ""
      const stopColors = Array.from(svg.querySelectorAll("stop")).map((stop) =>
        stop.getAttribute("stop-color") ?? "",
      )
      const rect = svg.getBoundingClientRect()

      return {
        gradientId,
        stroke,
        stopColors,
        visibleBox: rect.width > 0 && rect.height > 0,
      }
    })
  })

  expect(gradientChecks).toHaveLength(2)
  expect(new Set(gradientChecks.map((item) => item.gradientId)).size).toBe(
    gradientChecks.length,
  )

  for (const item of gradientChecks) {
    expect(item.visibleBox).toBe(true)
    expect(item.gradientId).toMatch(/^fk-grad-/)
    expect(item.stroke).toBe(`url(#${item.gradientId})`)
    expect(item.stopColors).toEqual(["#f25aa6", "#8c5add", "#3ed9cf"])
  }
})

test("theme toggle persists the selected color mode", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("theme", "dark"))
  await page.goto("/")

  await expect(page.locator("html")).toHaveClass(/dark/)
  await page
    .getByRole("button", { name: "Přepnout na světlý režim" })
    .first()
    .click()

  await expect(page.locator("html")).toHaveClass(/light/)
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    "#f7f6fb",
  )
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem("theme")))
    .toBe("light")
})

test("home page exposes production SEO metadata", async ({ page }) => {
  await page.goto("/")

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://fkdev.xyz/",
  )
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://fkdev.xyz/opengraph.jpg",
  )
  const jsonLd = await page
    .locator('script[type="application/ld+json"]')
    .evaluate((script) => script.textContent ?? "")
  expect(jsonLd).toContain("ProfessionalService")
  expect(jsonLd).toContain("https://schema.org")
})

test("web manifest uses installable png icons", async ({ page, request }) => {
  await page.goto("/")

  const manifestHref = await page
    .locator('link[rel="manifest"]')
    .getAttribute("href")
  expect(manifestHref).toBe("/site.webmanifest")

  const response = await request.get(manifestHref!)
  expect(response.status()).toBe(200)
  const manifest = (await response.json()) as {
    icons: Array<{ src: string; sizes: string; type: string; purpose?: string }>
  }

  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        src: "/pwa-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      }),
      expect.objectContaining({
        src: "/pwa-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      }),
    ]),
  )
})
