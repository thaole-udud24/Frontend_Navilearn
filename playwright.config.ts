import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  // Both spec files log in with the same two shared test accounts and hit the same real dev
  // backend — running them in parallel workers causes login race/timeout flakiness.
  workers: 1,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'e2e/report.json' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
