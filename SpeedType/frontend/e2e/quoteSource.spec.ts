import { test, expect } from '@playwright/test';
// import { fallbackQuotes } from '../src/App'; // Cannot import directly

test.describe('Quote Sourcing Logic', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      // Print all browser console messages to the terminal
      console.log(`[Browser console] ${msg.type()}: ${msg.text()}`);
    });
  });


  test('Scenario 1: AI Quotes Enabled & Successful', async ({ page }) => {
    // Assumption: Backend is running with ENABLE_AI_QUOTES=true and valid API key
    
    await page.goto('/'); // Navigate to the root/start page

    // Wait for the quote cards to be visible (ensures quotes are loaded)
    await page.waitForSelector('.quote-card p'); 

    // Get the text content of the first displayed quote
    const displayedQuoteElements = await page.locator('.quote-card p').all();
    expect(displayedQuoteElements.length).toBeGreaterThan(0); 

    const displayedQuoteText = await displayedQuoteElements[0].textContent();
    console.log('Displayed Quote (AI Enabled Test):', displayedQuoteText); 
    expect(displayedQuoteText).toBeTruthy(); 

    // Assertion: The displayed quote should be reasonably long (indicative of AI source)
    expect((displayedQuoteText as string).length).toBeGreaterThan(100);
  });

  // TODO: Add Scenario 2: AI Quotes Disabled
  // TODO: Add Scenario 3: AI Quotes Enabled but API Fails

}); 