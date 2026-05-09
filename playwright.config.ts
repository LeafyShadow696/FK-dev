import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "https://fkdev.xyz",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 5"], channel: "chrome" },
    },
  ],
})
