/**
 * @deprecated This file is being replaced by singlePlayer.spec.ts and multiplayer.spec.ts
 * Please use the new consolidated test files instead.
 * This file will be removed in a future update.
 */

import { test, expect } from '@playwright/test';

test.describe('Race Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Enable debug logging with timestamps
    page.on('console', msg => {
      const timestamp = new Date().toISOString();
      console.log(`${timestamp} - Browser console:`, msg.text());
    });
    page.on('pageerror', err => console.error('Browser error:', err));
    
    console.log('Navigating to race page...');
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    console.log('Page loaded');

    // Wait for socket connection by checking connection status
    try {
      const connectionStatus = page.locator('.connection-status');
      await connectionStatus.waitFor({ state: 'visible', timeout: 30000 });
      
      // Wait for Connected status with retry logic
      let isConnected = false;
      let attempts = 0;
      const maxAttempts = 5;
      
      while (!isConnected && attempts < maxAttempts) {
        const status = await connectionStatus.textContent();
        console.log(`Connection status attempt ${attempts + 1}: ${status}`);
        
        if (status === 'Connected') {
          isConnected = true;
          console.log('Successfully connected to server');
        } else {
          attempts++;
          console.log(`Waiting for connection, attempt ${attempts}/${maxAttempts}`);
          await page.waitForTimeout(2000); // Wait 2 seconds between checks
        }
      }
      
      if (!isConnected) {
        throw new Error('Not connected to server after multiple attempts');
      }
    } catch (error) {
      console.error('Failed to verify socket connection');
      await page.screenshot({ path: 'connection-failure.png' });
      throw error;
    }
  });

  // Test cases removed as they are moved to singlePlayer.spec.ts and multiplayer.spec.ts
  // test('completes single player race', async ({ page }) => { ... });
  // test('handles multiplayer race', async ({ browser }) => { ... });
}); 