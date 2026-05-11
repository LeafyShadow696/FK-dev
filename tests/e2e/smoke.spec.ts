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

  await expect(page.locator("section").first().locator('[data-testid="fk-monogram"]')).toHaveCount(0)
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
  await expect(page.locator('a[href="/frantisek-kalasek.vcf"]').first()).toBeVisible()
})

test("vCard file exposes public contact details", async ({ request }) => {
  const response = await request.get("/frantisek-kalasek.vcf")
  const vcard = await response.text()

  expect(response.status()).toBe(200)
  expect(vcard).toContain("BEGIN:VCARD")
  expect(vcard).toContain("FN:František Kalášek")
  expect(vcard).toContain("ORG:TopBot PwnZ™")
  expect(vcard).toContain("EMAIL;TYPE=INTERNET,WORK:FandaKalasek@icloud.com")
  expect(vcard).toContain("TEL;TYPE=CELL,VOICE:+420722426195")
  expect(vcard).toContain("PHOTO;VALUE=URI:https://fkdev.xyz/brand/fk-vcard-logo.png")
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

test("mobile monograms render supplied brand assets", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")

  await expect(page.locator('header [data-testid="fk-monogram"]')).toBeVisible()
  await expect(page.locator('#vizitka [data-testid="fk-monogram"]')).toBeVisible()

  const logoChecks = await page.evaluate(() => {
    const logos = [
      document.querySelector('header [data-testid="fk-monogram"]'),
      document.querySelector('#vizitka [data-testid="fk-monogram"]'),
    ].filter((logo): logo is Element => logo instanceof Element)

    return logos.map((logo) => {
      const rect = logo.getBoundingClientRect()
      const images = Array.from(logo.querySelectorAll("img")).map((img) => ({
        src: img.getAttribute("src"),
        display: window.getComputedStyle(img).display,
        width: img.naturalWidth,
        height: img.naturalHeight,
      }))

      return {
        images,
        visibleBox: rect.width > 0 && rect.height > 0,
      }
    })
  })

  expect(logoChecks).toHaveLength(2)

  for (const item of logoChecks) {
    expect(item.visibleBox).toBe(true)
    expect(item.images).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: "/brand/fk-mark-light-transparent.png",
          width: 460,
          height: 285,
        }),
        expect.objectContaining({
          src: "/brand/fk-mark-dark-transparent.png",
          width: 460,
          height: 285,
        }),
      ]),
    )
    expect(item.images.filter((image) => image.display !== "none")).toHaveLength(1)
  }
})

test("theme toggle persists the selected color mode", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "fkdev-consent-v1",
      JSON.stringify({
        decided: true,
        preferences: true,
        analytics: false,
        updatedAt: "2026-05-10T00:00:00.000Z",
      }),
    )
    window.localStorage.setItem("theme", "dark")
  })
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

  await page
    .getByRole("button", { name: "Použít systémový režim" })
    .first()
    .click()

  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem("theme")))
    .toBe("system")
})

test("dark mode is the default color mode", async ({ page }) => {
  await page.goto("/")

  await expect(page.locator("html")).toHaveClass(/dark/)
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    "#0a0a0c",
  )
})

test("business profile logo exports are available", async ({ request }) => {
  const files = [
    "/brand/fk-business-logo-google-720.png",
    "/brand/fk-business-logo-google-720-white.png",
    "/brand/fk-business-logo-apple-1024.png",
    "/brand/fk-business-logo-apple-1024-dark.png",
  ]

  for (const file of files) {
    const response = await request.get(file)
    expect(response.status()).toBe(200)
    expect(response.headers()["content-type"]).toContain("image/png")
  }
})

test("cookie preferences can be saved and reopened", async ({ page }) => {
  await page.goto("/")

  await expect(page.getByText("Soukromí a nastavení webu")).toBeVisible()
  await page.getByRole("button", { name: "Nastavit" }).click()

  await expect(page.getByRole("dialog", { name: "Správa souhlasu" })).toBeVisible()
  await page
    .locator("label")
    .filter({ hasText: "Předvolby" })
    .locator('input[type="checkbox"]')
    .check()
  await page
    .locator("label")
    .filter({ hasText: "Analytika" })
    .locator('input[type="checkbox"]')
    .uncheck()
  await page.getByRole("button", { name: "Uložit nastavení" }).click()

  await expect(page.getByText("Soukromí a nastavení webu")).toBeHidden()
  await expect
    .poll(() =>
      page.evaluate(() => window.localStorage.getItem("fkdev-consent-v1")),
    )
    .toContain('"preferences":true')
  await expect
    .poll(() =>
      page.evaluate(() => window.localStorage.getItem("fkdev-consent-v1")),
    )
    .toContain('"analytics":false')

  await page.getByRole("button", { name: "Nastavení cookies" }).click()
  await expect(page.getByRole("dialog", { name: "Správa souhlasu" })).toBeVisible()
})

test("home page exposes production SEO metadata", async ({ page }) => {
  await page.goto("/")

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://fkdev.xyz/",
  )
  await expect(page.locator('link[rel="alternate"][type="text/plain"]')).toHaveAttribute(
    "href",
    "/llms.txt",
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

test("AI summary is available as static text", async ({ request }) => {
  const response = await request.get("/llms.txt")
  const text = await response.text()

  expect(response.status()).toBe(200)
  expect(response.headers()["content-type"]).toContain("text/plain")
  expect(text).toContain("Canonical production URL: https://fkdev.xyz/")
  expect(text).toContain("https://fkdev.xyz/sitemap.xml")
  expect(text).toContain("Web applications")
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
