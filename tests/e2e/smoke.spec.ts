import { expect, test } from "@playwright/test"

const routes = [
  { path: "/", h1: "František Kalášek" },
  { path: "/sluzby", h1: "Digitální řešení a automatizace" },
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

  await expect(page.getByRole("link", { name: "Napsat e-mail" }).first()).toBeVisible()
  await expect(page.getByRole("link", { name: "Zavolat" }).first()).toBeVisible()
  await expect(page.locator("canvas")).toHaveCount(1)
})

test("mobile navigation opens", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")
  await page.getByRole("button", { name: "Otevřít menu" }).click()

  await expect(page.getByRole("navigation", { name: "Mobilní" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Kontakt" }).last()).toBeVisible()
})
