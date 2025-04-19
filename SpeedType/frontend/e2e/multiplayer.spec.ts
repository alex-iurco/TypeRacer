import { test, expect } from '@playwright/test';

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