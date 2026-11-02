import { defineConfig } from "@playwright/test";

// Smoke test of the demo path. Runs against an ALREADY RUNNING app (see README, "Smoke test").
export default defineConfig({
  testDir: "e2e",
  outputDir: "test-results/artifacts",
  reporter: "list",
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    viewport: { width: 390, height: 844 }, // phone
  },
});
