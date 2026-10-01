import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser", timeout: 45000, fullyParallel: false, workers: 1,
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000", reducedMotion: "reduce", screenshot: "only-on-failure", trace: "retain-on-failure" },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } }, { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } }],
});
