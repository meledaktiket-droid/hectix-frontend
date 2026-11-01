import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  timeout: 180_000,
  expect: { timeout: 20_000 },
  globalSetup: "./global-setup.ts",
  globalTeardown: "./global-teardown.ts",
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 30_000,
    navigationTimeout: 90_000,
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
    viewport: { width: 1366, height: 900 },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 900 } } }],
});
