import { defineConfig, devices } from '@playwright/test'

// En la nube de Claude Code el Chromium ya viene instalado en /opt/pw-browsers/chromium.
// En tu compu, dejá PLAYWRIGHT_CHROMIUM vacío y corré una vez `npx playwright install chromium`.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM || undefined

export default defineConfig({
  testDir: 'e2e',
  use: {
    baseURL: 'http://localhost:4173',
    launchOptions: { executablePath },
  },
  projects: [
    { name: 'celular', use: { ...devices['Pixel 5'], launchOptions: { executablePath } } },
    {
      name: 'escritorio',
      use: { ...devices['Desktop Chrome'], launchOptions: { executablePath } },
    },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
