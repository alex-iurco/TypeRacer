import { test, expect } from '@playwright/test';
import { CURRENT, DOMAINS } from './constants';

test('should detect correct environment', async ({ page }) => {
  // Navigate to the main page
  await page.goto('/');
  
  // Wait for the app to load
  await page.waitForSelector('body', { timeout: 10000 });
  
  // Get the current environment from the app
  const environment = await page.evaluate(async () => {
    // Access the window.__ENV__ object that should be set by your app
    return window.__ENV__ ? window.__ENV__.MODE : 'unknown';
  });
  
  console.log(`Current environment: ${environment}`);
  
  // Get the current backend URL
  const backendUrl = await page.evaluate(async () => {
    return window.__ENV__ ? window.__ENV__.BACKEND_URL : 'unknown';
  });
  
  console.log(`Backend URL: ${backendUrl}`);
  
  // Check server connectivity by making a request to the home page
  const response = await page.evaluate(async () => {
    try {
      const res = await fetch('/');
      return {
        ok: res.ok,
        status: res.status,
        url: res.url
      };
    } catch (error) {
      return { error: error.message };
    }
  });
  
  console.log('Page response:', response);
  
  // Take a screenshot for reference
  await page.screenshot({ path: 'environment-test.png', fullPage: true });
  
  // If we're in production mode, verify we're using a production URL
  if (process.env.PLAYWRIGHT_ENV === 'production') {
    // Just check that we're hitting a URL that matches our expected production domain
    expect(page.url()).toContain(DOMAINS.production.frontend);
    
    // Check if backend URL is accessible through window.__ENV__
    if (backendUrl !== 'unknown') {
      expect(backendUrl).toContain(DOMAINS.production.backend);
    }
    
    console.log('Running in production mode, URL verified');
  } else {
    // In test mode, we should be using localhost
    expect(page.url()).toContain(DOMAINS.test.frontend);
  }
}); 