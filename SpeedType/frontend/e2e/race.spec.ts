import { test, expect } from '@playwright/test';

test.describe('Race Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/race');
  });

  test('completes single player race', async ({ page }) => {
    // Wait for the page to be ready
    await expect(page.locator('[data-testid="typing-input"]')).toBeVisible();

    // Start race
    await page.click('[data-testid="start-button"]');

    // Type the text
    await page.fill('[data-testid="typing-input"]', 'test text');

    // Verify race completion
    await expect(page.locator('[data-testid="race-complete"]')).toBeVisible();

    // Check WPM calculation
    const wpm = await page.locator('[data-testid="wpm-display"]');
    await expect(wpm).toBeVisible();
    const wpmText = await wpm.textContent();
    expect(Number(wpmText)).toBeGreaterThan(0);
  });

  test('handles multiplayer race', async ({ browser }) => {
    // Create two browser contexts for two players
    const player1Context = await browser.newContext();
    const player2Context = await browser.newContext();

    const player1Page = await player1Context.newPage();
    const player2Page = await player2Context.newPage();

    // Navigate both players to multiplayer race
    await player1Page.goto('/race/multiplayer');
    await player2Page.goto('/race/multiplayer');

    // Wait for both players to be connected
    await expect(player1Page.locator('[data-testid="player-list"]')).toBeVisible();
    await expect(player2Page.locator('[data-testid="player-list"]')).toBeVisible();

    // Ready up both players
    await player1Page.click('[data-testid="ready-button"]');
    await player2Page.click('[data-testid="ready-button"]');

    // Verify race starts for both players
    await expect(player1Page.locator('[data-testid="countdown"]')).toBeVisible();
    await expect(player2Page.locator('[data-testid="countdown"]')).toBeVisible();

    // Clean up
    await player1Context.close();
    await player2Context.close();
  });
}); 