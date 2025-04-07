import { PlaywrightTestConfig, devices } from '@playwright/test';

// Check if we're running in production mode
// @ts-ignore - process is available in Node.js environment
const isProduction = process.env.PLAYWRIGHT_ENV === 'production';

const config: PlaywrightTestConfig = {
  testDir: './e2e',
  timeout: 60000,
  // @ts-ignore - process is available in Node.js environment
  forbidOnly: !!process.env.CI,
  // @ts-ignore - process is available in Node.js environment
  retries: process.env.CI ? 2 : 1,
  // @ts-ignore - process is available in Node.js environment
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['list']
  ],
  use: {
    headless: true,
    // For production tests, use the actual production URL
    baseURL: isProduction ? 'https://speedtype-frontend-production.up.railway.app' : 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'on',
    navigationTimeout: 30000,
    actionTimeout: 15000,
  },
  // Only start local server if not testing against production
  ...(isProduction ? {} : {
    webServer: {
      command: 'npm run dev -- --mode test',
      url: 'http://localhost:3000',
      // @ts-ignore - process is available in Node.js environment
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  }),
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