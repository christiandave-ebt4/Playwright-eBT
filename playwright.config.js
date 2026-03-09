// @ts-check
const { defineConfig, devices } = require('@playwright/test');
require('dotenv').config();

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  // shared settings (applies to all projects unless overridden)
  use: {
    headless: true,
    trace: 'on-first-retry',
  },

  projects: [
    // 1) runs once to generate storageState.json
    {
      name: 'setup',
      testMatch: /auth\.setup\.js/,
      use: { ...devices['Desktop Firefox'] },
    },

    // 2) all your real tests run here, already logged in
    {
      name: 'eBT',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'storageState.json',
      },
    },
  ],
});