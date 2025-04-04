import { PlaywrightTestConfig, devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './e2e',
  timeout: 60000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['list']
  ],
  use: {
    headless: true,
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'on',
    navigationTimeout: 30000,
    actionTimeout: 15000,
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 }
      },
    }
  ],
};

export default config; 