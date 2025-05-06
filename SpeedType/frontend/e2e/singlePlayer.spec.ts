import { test, expect } from '@playwright/test';

/**
 * Single Player Test Suite
*/
test.describe('Single Player Mode', () => {
  // Add a delay before all tests in this file
  test.beforeAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
  });

  // Setup connection check for each test
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
        const status = await connectionStatus.textContent() || '';
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

  test('initializes race with countdown properly', async ({ page }) => {
    // Capture logs
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(msg.text());
    });
    
    // Initial state capture
    const initialState = await page.evaluate(() => ({
      textToType: document.querySelector('.race-text')?.textContent || 'not found',
      countdown: document.querySelector('.countdown')?.textContent || 'not found',
      raceContainer: document.querySelector('.race-container')?.className || 'not found',
      typingArea: document.querySelector('.typing-area')?.className || 'not found'
    }));
    console.log('Initial state:', initialState);
    
    // Wait for quotes to load
    await page.waitForSelector('.quotes-grid', { timeout: 10000 });
    await page.screenshot({ path: 'test-results/initialization-initial-state.png' });

    // Click start button
    const singlePlayerButton = page.getByText('Single Player');
    await singlePlayerButton.waitFor({ state: 'visible' });
    await singlePlayerButton.click();
    console.log('Single player button clicked');
    await page.screenshot({ path: 'test-results/initialization-after-start.png' });

    // Wait for countdown
    const countdown = page.locator('.countdown-overlay');
    await countdown.waitFor({ state: 'visible' });
    console.log('Countdown started');
    
    // State verification during countdown
    const countdownState = await page.evaluate(() => ({
      textToType: document.querySelector('.race-text')?.textContent || 'not found',
      countdown: document.querySelector('.countdown')?.textContent || 'not found',
      raceState: document.querySelector('.race-container')?.className || 'not found'
    }));
    console.log('Countdown state:', countdownState);
    
    // Wait for countdown to finish
    await page.waitForTimeout(5000);
    
    // Verify race start
    await page.waitForFunction(() => {
      const raceTrack = document.querySelector('.race-track');
      return raceTrack && raceTrack.getAttribute('data-race-state') === 'racing';
    }, { timeout: 15000 });
    
    // Verify typing area mounted correctly
    await page.waitForFunction(() => {
      const typingAreaContainer = document.querySelector('.typing-area-container');
      const textDisplay = document.querySelector('.text-display');
      return typingAreaContainer && textDisplay && textDisplay.textContent && textDisplay.textContent.length > 0;
    }, { timeout: 15000 });
    console.log('TypingArea mounted and initialized');
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/initialization-race-started.png' });
    
    // Verify expected console logs
    const hasRaceStartedLog = logs.some(log => log.includes('Race starting, resetting state'));
    expect(hasRaceStartedLog).toBeTruthy();
  });

  test('completes single player race from start to finish', async ({ page }) => {
    // Wait for quotes to load
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/complete-initial-state.png' });

    // Click single player button
    const singlePlayerButton = page.getByText('Single Player');
    await singlePlayerButton.waitFor({ state: 'visible' });
    await singlePlayerButton.click();
    console.log('Single player button clicked');
    await page.screenshot({ path: 'test-results/complete-after-start-click.png' });

    // Wait for countdown
    const countdown = page.locator('.countdown-overlay');
    await countdown.waitFor({ state: 'visible' });
    console.log('Countdown started');
    await page.screenshot({ path: 'test-results/complete-countdown.png' });

    // Wait for countdown to finish and race track to appear
    await page.waitForTimeout(5000); // Wait for 5s countdown
    const raceTrack = page.locator('.race-track');
    await raceTrack.waitFor({ state: 'visible' });
    console.log('Race track visible');
    await page.screenshot({ path: 'test-results/complete-race-track.png' });

    // Verify typing area container is visible
    const typingArea = page.locator('.typing-area-container');
    await typingArea.waitFor({ state: 'visible' });
    console.log('Typing area container visible');

    // Wait for text to be loaded
    await page.waitForFunction(() => {
      const textDisplay = document.querySelector('.typing-area-container .text-display');
      return textDisplay && textDisplay.textContent && textDisplay.textContent.length > 0;
    }, { timeout: 10000 });
    console.log('Text loaded in typing area');
    
    // Wait for race to start
    await page.waitForFunction(() => {
      const raceState = document.querySelector('.race-track')?.getAttribute('data-race-state');
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
    await page.screenshot({ path: 'test-results/complete-typing.png' });

    // Wait for race completion
    await page.waitForSelector('.race-complete', { state: 'visible', timeout: 10000 });
    console.log('Race completed');
    await page.screenshot({ path: 'test-results/complete-finished.png' });
    
    // Final state validation
    const finalState = await page.evaluate(() => ({
      typingArea: document.querySelector('.typing-area')?.className || 'not found',
      textDisplay: document.querySelector('.text-display')?.textContent || 'not found',
      typingInput: document.querySelector('.typing-input')?.getAttribute('disabled') || 'not found',
      wpm: document.querySelector('.wpm-display')?.textContent || 'not found'
    }));
    console.log('Final state:', finalState);
    
    // Verify WPM is displayed - Fix for multiple elements with same class
    // Use a more specific selector to get just one WPM display element
    const wpmText = await page.locator('.race-complete .wpm-display').textContent();
    expect(wpmText).toMatch(/\d+\s*WPM/);
  });

  test('allows selecting and using custom text', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Find the actual textarea inside the custom-text-input container
    // Use getByRole for better accessibility and robustness
    const customTextArea = page.getByRole('textbox', { name: 'Or type your own text here...' });
    await customTextArea.waitFor({ state: 'visible' });
    const testText = 'This is a custom text for typing test';
    await customTextArea.fill(testText);
    
    // Click the actual button to start the race
    const startButton = page.getByRole('button', { name: 'Single Player' });
    await startButton.click();
    
    // Wait for countdown
    const countdown = page.locator('.countdown-overlay');
    await countdown.waitFor({ state: 'visible' });
    
    // Wait for countdown to finish
    await page.waitForTimeout(5000);
    
    // Verify the text display contains our custom text
    await page.waitForFunction((text) => {
      const textDisplay = document.querySelector('.text-display');
      return textDisplay && textDisplay.textContent && textDisplay.textContent.includes(text);
    }, testText, { timeout: 10000 });
    
    // Type the text
    const input = page.locator('.typing-input');
    await input.waitFor({ state: 'visible' });
    await input.type(testText, { delay: 50 });
    
    // Wait for race completion
    await page.waitForSelector('.race-complete', { state: 'visible', timeout: 10000 });
    console.log('Race with custom text completed');
  });

  test('debug: observe live WPM and Progress during race', async ({ page }) => {
    // --- 1. Start Race --- 
    console.log('--- Starting Race for Debugging --- ');
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    try {
      const connectionStatus = page.locator('.connection-status');
      await connectionStatus.waitFor({ state: 'visible', timeout: 30000 });
      await page.waitForFunction(() => {
        const status = document.querySelector('.connection-status');
        return status && status.textContent === 'Connected';
      }, { timeout: 10000 });
      console.log('Connection verified.');
    } catch (error) {
      console.error('Failed to verify socket connection');
      await page.screenshot({ path: 'debug-test-connection-failure.png' });
      throw error;
    }
    
    const singlePlayerButton = page.getByText('Single Player');
    await singlePlayerButton.waitFor({ state: 'visible' });
    await singlePlayerButton.click();
    console.log('Single player button clicked');
    
    const countdown = page.locator('.countdown-overlay');
    await countdown.waitFor({ state: 'visible' });
    console.log('Countdown visible');
    await page.waitForTimeout(5000); // Wait for countdown
    
    await page.waitForFunction(() => {
      const raceTrack = document.querySelector('.race-track');
      return raceTrack && raceTrack.getAttribute('data-race-state') === 'racing';
    }, { timeout: 15000 });
    console.log('Race state is "racing"');

    await page.waitForFunction(() => {
      const textDisplay = document.querySelector('.text-display');
      return textDisplay && textDisplay.textContent && textDisplay.textContent.length > 0;
    }, { timeout: 10000 });
    const text = await page.evaluate(() => document.querySelector('.text-display')?.textContent || '');
    console.log('Text to type acquired:', text);
    expect(text.length).toBeGreaterThan(0);

    // --- 2. Type and Log --- 
    const input = page.locator('.typing-input');
    await input.waitFor({ state: 'visible' });
    console.log('Typing input visible');

    const wpmSelector = '.race-track .car-lane >> nth=0 >> .wpm-display'; // Target first racer's WPM
    const progressSelector = '.race-track .car-lane >> nth=0 >> .progress-display'; // Target first racer's Progress

    console.log('--- Starting Typing and Logging --- ');
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      await input.type(char, { delay: 50 }); // Small delay for observation

      // Log status every 5 characters
      if ((i + 1) % 5 === 0 || i === text.length - 1) {
        const currentWpmText = await page.locator(wpmSelector).textContent() || 'N/A';
        const currentProgressText = await page.locator(progressSelector).textContent() || 'N/A';
        console.log(`Char ${i + 1}/${text.length}: WPM Display="${currentWpmText}", Progress Display="${currentProgressText}"`);
      }
    }

    console.log('--- Typing Complete --- ');

    // --- 3. Final Check (Optional) ---
    await page.waitForSelector('.race-complete', { state: 'visible', timeout: 15000 });
    const finalWpmText = await page.locator('.race-complete .wpm-display').textContent();
    console.log(`Final WPM displayed in completion screen: ${finalWpmText}`);

    // No assertions for now, just observation
  });
});