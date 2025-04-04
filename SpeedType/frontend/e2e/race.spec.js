import { test, expect } from '@playwright/test';

test('race initialization and countdown', async ({ page }) => {
  // Capture console logs
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    console.log(`Browser console: ${text}`);
    logs.push(text);
  });
  
  // Navigate to the app
  await page.goto('http://localhost:3000');
  console.log('Navigated to app');
  
  // Wait for the app to load
  await page.waitForSelector('.app-container', { timeout: 10000 });
  console.log('App container loaded');
  
  // Wait for quotes to load
  await page.waitForSelector('.quotes-grid', { timeout: 10000 });
  console.log('Quotes loaded');
  
  // Log initial state
  const initialState = await page.evaluate(() => {
    const elements = {
      textToType: document.querySelector('.race-text'),
      countdown: document.querySelector('.countdown'),
      raceContainer: document.querySelector('.race-container'),
      typingArea: document.querySelector('.typing-area')
    };
    return {
      textToType: elements.textToType?.textContent || 'not found',
      countdown: elements.countdown?.textContent || 'not found',
      raceState: elements.raceContainer?.className || 'not found',
      typingArea: elements.typingArea?.className || 'not found'
    };
  });
  console.log('Initial state:', initialState);
  
  // Click the start race button
  const startButton = await page.waitForSelector('button:has-text("Start Single Player Race")', { timeout: 5000 });
  if (!startButton) {
    throw new Error('Start button not found');
  }
  await startButton.click();
  console.log('Clicked start race button');
  
  // Wait for countdown to appear
  await page.waitForSelector('.countdown-overlay', { timeout: 5000 });
  console.log('Countdown overlay appeared');
  
  // Wait for text to appear in the countdown overlay
  const textFound = await page.waitForSelector('.countdown-overlay .race-text', { timeout: 5000 });
  if (!textFound) {
    throw new Error('Race text did not appear in countdown overlay');
  }
  console.log('Race text appeared in countdown overlay');
  
  // Log state after text appears
  const textState = await page.evaluate(() => {
    const elements = {
      textToType: document.querySelector('.race-text'),
      countdown: document.querySelector('.countdown'),
      raceContainer: document.querySelector('.race-container'),
      typingArea: document.querySelector('.typing-area')
    };
    return {
      textToType: elements.textToType?.textContent || 'not found',
      countdown: elements.countdown?.textContent || 'not found',
      raceState: elements.raceContainer?.className || 'not found',
      typingArea: elements.typingArea?.className || 'not found'
    };
  });
  console.log('State after text appears:', textState);
  
  // Wait for countdown to complete
  await page.waitForFunction(() => {
    const countdown = document.querySelector('.countdown');
    return countdown && countdown.textContent === '0';
  }, { timeout: 5000 });
  console.log('Countdown completed');
  
  // Wait for TypingArea to be mounted and initialized
  await page.waitForFunction(() => {
    const typingArea = document.querySelector('.typing-area');
    const textDisplay = document.querySelector('.text-display');
    return typingArea && textDisplay && textDisplay.textContent.length > 0;
  }, { timeout: 5000 });
  console.log('TypingArea mounted and initialized');
  
  // Wait for race to start
  await page.waitForFunction(() => {
    const raceContainer = document.querySelector('.race-container');
    const typingInput = document.querySelector('.typing-area input');
    return raceContainer && 
           raceContainer.className.includes('racing') && 
           typingInput && 
           !typingInput.disabled;
  }, { timeout: 5000 });
  console.log('Race started');
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'race-debug.png' });
  console.log('Screenshot saved as race-debug.png');
  
  // Log the final state
  const finalState = await page.evaluate(() => {
    const elements = {
      textToType: document.querySelector('.race-text'),
      countdown: document.querySelector('.countdown'),
      raceContainer: document.querySelector('.race-container'),
      typingArea: document.querySelector('.typing-area'),
      textDisplay: document.querySelector('.text-display'),
      typingInput: document.querySelector('.typing-area input')
    };
    return {
      textToType: elements.textToType?.textContent || 'not found',
      countdown: elements.countdown?.textContent || 'not found',
      raceState: elements.raceContainer?.className || 'not found',
      typingArea: elements.typingArea?.className || 'not found',
      textDisplay: elements.textDisplay?.textContent || 'not found',
      typingInput: elements.typingInput?.disabled || 'not found'
    };
  });
  console.log('Final state:', finalState);
  
  // Check if we have the expected logs
  const hasTextChangedLog = logs.some(log => log.includes('Text changed:'));
  const hasRaceStartedLog = logs.some(log => log.includes('Race started:'));
  const hasRenderingTextLog = logs.some(log => log.includes('Rendering text:'));
  
  if (!hasTextChangedLog || !hasRaceStartedLog || !hasRenderingTextLog) {
    console.log('Missing expected logs:', {
      hasTextChangedLog,
      hasRaceStartedLog,
      hasRenderingTextLog
    });
    throw new Error('Missing expected TypingArea initialization logs');
  }
}); 