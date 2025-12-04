import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 0 : 0,
  /* Use single worker always */
  workers: 2,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'https://app-test-finnair-fra-frontend-f7byg3hef7abafat.germanywestcentral-01.azurewebsites.net/en',

    /* Set viewport to null to use the full browser window size */
    viewport: null,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Global timeout for each action */
    actionTimeout: 50000,
    
    /* Global timeout for navigation */
    navigationTimeout: 30000,
    
    /* Ignore HTTPS certificate errors */
    ignoreHTTPSErrors: true,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
      use: {
        channel: 'chrome',
        headless: false,
        viewport: null,
        launchOptions: {
          args: [
            '--start-maximized',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--ignore-certificate-errors-spki-list',
            '--disable-web-security',
            '--allow-running-insecure-content'
          ]
        }
      },
    },
    {
      name: 'auth-only',
      testMatch: '**/auth-setup.spec.ts',
      use: {
        channel: 'chrome',
        headless: false,
        viewport: null,
        launchOptions: {
          args: [
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--ignore-certificate-errors-spki-list',
            '--disable-web-security',
            '--allow-running-insecure-content'
          ]
        }
      },
    },
    {
      name: 'chromium',
      use: { 
        channel: 'chrome',
        /* Always run in headed mode */
        headless: false,
        
        /* Set viewport to null to use the full browser window size */
        viewport: null,

        /* Chrome-specific args to ignore certificate errors */
        launchOptions: {
          args: [
            '--start-maximized',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--ignore-certificate-errors-spki-list',
            '--disable-web-security',
            '--allow-running-insecure-content'
          ]
        }
      },

    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },

  /* Global test timeout */
  timeout: 180000, // 120 seconds (2 minutes)

  /* Maximum failures before stopping test run */
  maxFailures: undefined,

  /* Output folder for test artifacts */
  outputDir: 'test-results/',

  /* Expect timeout for assertions */
  expect: {
    timeout: 10000
  }
});