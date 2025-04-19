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

  test('completes single player race', async ({ page }) => {
    // Wait for quotes to load
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/initial-state.png' });

    // Click single player button
    const singlePlayerButton = page.getByText('Start Single Player Race');
    await singlePlayerButton.waitFor({ state: 'visible' });
    await singlePlayerButton.click();
    console.log('Single player button clicked');
    await page.screenshot({ path: 'test-results/after-start-click.png' });

    // Wait for countdown
    const countdown = page.locator('.countdown-overlay');
    await countdown.waitFor({ state: 'visible' });
    console.log('Countdown started');
    await page.screenshot({ path: 'test-results/countdown.png' });

    // Wait for countdown to finish and race track to appear
    await page.waitForTimeout(5000); // Wait for 5s countdown
    const raceTrack = page.locator('.race-track');
    await raceTrack.waitFor({ state: 'visible' });
    console.log('Race track visible');
    await page.screenshot({ path: 'test-results/race-track.png' });

    // Verify typing area container is visible
    const typingArea = page.locator('.typing-area-container');
    await typingArea.waitFor({ state: 'visible' });
    console.log('Typing area container visible');

    // Wait for text to be loaded
    await page.waitForFunction(() => {
      const textDisplay = document.querySelector('.typing-area-container .text-display');
      console.log('Text display found:', textDisplay);
      console.log('Text content:', textDisplay?.textContent);
      return textDisplay && textDisplay.textContent && textDisplay.textContent.length > 0;
    }, { timeout: 10000 });
    console.log('Text loaded in typing area');
    
    // Wait for race to start
    await page.waitForFunction(() => {
      const raceState = document.querySelector('.race-track')?.getAttribute('data-race-state');
      console.log('Race state:', raceState);
      return raceState === 'racing';
    }, { timeout: 10000 });
    console.log('Race started');
    
    // Type some text
    const input = page.locator('.typing-input');
    await input.waitFor({ state: 'visible' });
    console.log('Input field visible');

    // Get the text to type
    const text = await page.evaluate(() => {
      const textDisplay = document.querySelector('.text-display');
      return textDisplay?.textContent || '';
    });
    console.log('Text to type:', text);

    // Type each word followed by a space
    const words = text.split(' ');
    for (const word of words) {
      await input.type(word + ' ', { delay: 50 });
    }
    console.log('Text typed');
    await page.screenshot({ path: 'test-results/typing.png' });

    // Wait for race completion
    await page.waitForSelector('.race-complete', { state: 'visible', timeout: 10000 });
    console.log('Race completed');
    await page.screenshot({ path: 'test-results/complete.png' });
  });

  test('handles multiplayer race', async ({ browser }) => {
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext()
    ]);
    
    const [player1Page, player2Page] = await Promise.all([
      contexts[0].newPage(),
      contexts[1].newPage()
    ]);

    try {
      // Enable debug logging with timestamps
      for (const page of [player1Page, player2Page]) {
        page.on('console', msg => {
          const timestamp = new Date().toISOString();
          console.log(`${timestamp} - Player console:`, msg.text());
        });
        page.on('pageerror', err => console.error('Player error:', err));
      }

      // Navigate both players to the multiplayer page with better error handling
      console.log('Navigating both players to multiplayer page...');
      await Promise.all([
        player1Page.goto('/race/multiplayer', { waitUntil: 'load' }),
        player2Page.goto('/race/multiplayer', { waitUntil: 'load' })
      ]);
      
      // Wait for content to be visible before continuing
      await Promise.all([
        player1Page.waitForSelector('.multiplayer-waiting', { state: 'visible', timeout: 10000 }),
        player2Page.waitForSelector('.multiplayer-waiting', { state: 'visible', timeout: 10000 })
      ]);
      console.log('Both players at multiplayer page');

      // Take screenshots to debug
      await Promise.all([
        player1Page.screenshot({ path: 'test-results/multiplayer-initial-p1.png' }),
        player2Page.screenshot({ path: 'test-results/multiplayer-initial-p2.png' })
      ]);

      // Wait for connection status with retry logic for both pages
      for (const page of [player1Page, player2Page]) {
        let isConnected = false;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (!isConnected && attempts < maxAttempts) {
          const connectionStatus = page.locator('.connection-status');
          await connectionStatus.waitFor({ state: 'visible', timeout: 5000 });
          const status = await connectionStatus.textContent();
          console.log(`Connection status attempt ${attempts + 1}: ${status}`);
          
          if (status === 'Connected') {
            isConnected = true;
            console.log('Successfully connected to server');
          } else {
            attempts++;
            console.log(`Waiting for connection, attempt ${attempts}/${maxAttempts}`);
            await page.waitForTimeout(1000); // Wait 1 second between checks
          }
        }
        
        if (!isConnected) {
          throw new Error('Failed to connect to server after multiple attempts');
        }
      }
      console.log('Both players connected');

      // Click ready buttons with retry logic
      const readyButton = '.ready-button';
      
      // Wait for ready buttons to be visible
      await Promise.all([
        player1Page.waitForSelector(readyButton, { state: 'visible', timeout: 10000 }),
        player2Page.waitForSelector(readyButton, { state: 'visible', timeout: 10000 })
      ]);
      console.log('Ready buttons visible');
      
      // Take screenshots to confirm ready buttons are visible
      await Promise.all([
        player1Page.screenshot({ path: 'test-results/multiplayer-ready-p1.png' }),
        player2Page.screenshot({ path: 'test-results/multiplayer-ready-p2.png' })
      ]);
      
      // Click the ready buttons
      await Promise.all([
        player1Page.click(readyButton),
        player2Page.click(readyButton)
      ]);
      console.log('Both players clicked ready');

      // Wait for countdown with longer timeout
      const countdown = '.countdown-overlay';
      await Promise.all([
        player1Page.waitForSelector(countdown, { state: 'visible', timeout: 15000 }),
        player2Page.waitForSelector(countdown, { state: 'visible', timeout: 15000 })
      ]);
      console.log('Countdown started for both players');
      
      // Take screenshots to confirm countdown is visible
      await Promise.all([
        player1Page.screenshot({ path: 'test-results/multiplayer-countdown-p1.png' }),
        player2Page.screenshot({ path: 'test-results/multiplayer-countdown-p2.png' })
      ]);

      // Wait for race to start (5s countdown)
      await Promise.all([
        player1Page.waitForTimeout(5000),
        player2Page.waitForTimeout(5000)
      ]);
      console.log('Countdown finished');

      // Wait for typing areas to be visible
      await Promise.all([
        player1Page.locator('.typing-area-container').waitFor({ state: 'visible' }),
        player2Page.locator('.typing-area-container').waitFor({ state: 'visible' })
      ]);
      console.log('Typing areas visible');

      // Wait for text to be loaded
      for (const page of [player1Page, player2Page]) {
        await page.waitForFunction(() => {
          const textDisplay = document.querySelector('.typing-area-container .text-display');
          console.log('Text display found:', textDisplay);
          console.log('Text content:', textDisplay?.textContent);
          return textDisplay && textDisplay.textContent && textDisplay.textContent.length > 0;
        }, { timeout: 10000 });
      }
      console.log('Text loaded for both players');

      // Wait for race to start
      await Promise.all([
        player1Page.waitForFunction(() => {
          const raceState = document.querySelector('.race-track')?.getAttribute('data-race-state');
          console.log('Race state:', raceState);
          return raceState === 'racing';
        }, { timeout: 10000 }),
        player2Page.waitForFunction(() => {
          const raceState = document.querySelector('.race-track')?.getAttribute('data-race-state');
          console.log('Race state:', raceState);
          return raceState === 'racing';
        }, { timeout: 10000 })
      ]);
      console.log('Race started for both players');

      // Wait for input fields to be visible
      await Promise.all([
        player1Page.locator('.typing-input').waitFor({ state: 'visible' }),
        player2Page.locator('.typing-input').waitFor({ state: 'visible' })
      ]);
      console.log('Input fields visible');

      // Type text for both players
      const input = '.typing-input';
      await Promise.all([
        (async () => {
          const text1 = await player1Page.evaluate(() => {
            const textDisplay = document.querySelector('.text-display');
            return textDisplay?.textContent || '';
          });
          const words1 = text1.split(' ');
          for (const word of words1) {
            await player1Page.type(input, word + ' ', { delay: 50 });
          }
        })(),
        (async () => {
          const text2 = await player2Page.evaluate(() => {
            const textDisplay = document.querySelector('.text-display');
            return textDisplay?.textContent || '';
          });
          const words2 = text2.split(' ');
          for (const word of words2) {
            await player2Page.type(input, word + ' ', { delay: 50 });
          }
        })()
      ]);
      console.log('Both players typed text');

      // Wait for race completion
      await Promise.all([
        player1Page.waitForSelector('.race-complete', { state: 'visible', timeout: 10000 }),
        player2Page.waitForSelector('.race-complete', { state: 'visible', timeout: 10000 })
      ]);
      console.log('Race completed for both players');

      // Take final screenshots
      await Promise.all([
        player1Page.screenshot({ path: 'test-results/multiplayer-p1-complete.png' }),
        player2Page.screenshot({ path: 'test-results/multiplayer-p2-complete.png' })
      ]);
    } finally {
      await Promise.all(contexts.map(context => context.close()));
    }
  });
}); 