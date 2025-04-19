/**
 * @deprecated This file is being replaced by singlePlayer.spec.ts
 * Please use the new consolidated test files instead.
 * This file will be removed in a future update.
 */

import { test, expect } from '@playwright/test';

test('race initialization and countdown', async ({ page }) => {
  // Capture console logs
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    console.log(`Browser console: ${text}`);
    logs.push(text);
  });
  
  // Navigate to the app - use baseURL from config
  await page.goto('/');
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
  await page.waitForTimeout(5000); // Wait for the full countdown duration
  
  // Instead of waiting for countdown to be "0", wait for countdown overlay to disappear
  await page.waitForFunction(() => {
    // Check if race-track exists and has racing state
    const raceTrack = document.querySelector('.race-track');
    return raceTrack && raceTrack.getAttribute('data-race-state') === 'racing';
  }, { timeout: 15000 });
  console.log('Countdown completed');
  
  // Wait for TypingArea to be mounted and initialized
  await page.waitForFunction(() => {
    const typingAreaContainer = document.querySelector('.typing-area-container');
    const textDisplay = document.querySelector('.text-display');
    return typingAreaContainer && textDisplay && textDisplay.textContent.length > 0;
  }, { timeout: 15000 });
  console.log('TypingArea mounted and initialized');
  
  // Wait for race to start
  await page.waitForFunction(() => {
    const raceTrack = document.querySelector('.race-track');
    const typingInput = document.querySelector('.typing-input');
    return raceTrack && 
           raceTrack.getAttribute('data-race-state') === 'racing' && 
           typingInput && 
           !typingInput.disabled;
  }, { timeout: 15000 });
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