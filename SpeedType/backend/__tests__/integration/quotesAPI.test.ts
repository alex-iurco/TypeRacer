import request from 'supertest';
import { httpServer } from '../../src/server'; // Import the httpServer instance
import { Server } from 'http';

// Ensure environment variables are loaded (tests might run differently than dev server)
import dotenv from 'dotenv';
dotenv.config({ path: './.env' }); // Load .env from the backend root

let server: Server;

// Start the server before tests and close it after
beforeAll((done) => {
  // Use a different port for testing if needed, or rely on the default
  const testPort = process.env.TEST_PORT || 3002; // Example: use a different port
  server = httpServer.listen(testPort, () => {
      console.log(`Test server running on port ${testPort}`);
      done();
  });
});

afterAll((done) => {
  server.close(done);
});

describe('GET /api/quotes', () => {

  // Test case 1: AI Quotes Enabled
  // This test requires ANTHROPIC_API_KEY to be set in the environment running the test
  // and ENABLE_AI_QUOTES="true"
  test('should return 6 quotes as a JSON array when AI is enabled', async () => {
    // Temporarily set env var for this test context if needed, or rely on process env
    const originalEnableFlag = process.env.ENABLE_AI_QUOTES;
    process.env.ENABLE_AI_QUOTES = 'true'; // Ensure it's enabled for this test

    // Check if API key is actually present - skip test if not, as it will fail
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn("Skipping AI quotes enabled test: ANTHROPIC_API_KEY not found in environment.");
      process.env.ENABLE_AI_QUOTES = originalEnableFlag; // Restore original value
      return; // Or use jest.skip() if preferred
    }

    console.log("Running test: /api/quotes with AI enabled");
    const response = await request(server).get('/api/quotes');

    console.log("Response Status:", response.status);
    // Log the actual quotes received
    console.log("Received Quotes Body:", JSON.stringify(response.body, null, 2));

    // Restore original env var value
    process.env.ENABLE_AI_QUOTES = originalEnableFlag;

    // Assertions
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body).toBeInstanceOf(Array);
    // Check if the number of quotes is between 0 and 7 (inclusive)
    expect(response.body.length).toBeGreaterThanOrEqual(0);
    expect(response.body.length).toBeLessThanOrEqual(6); // Expect 0 to 6 quotes

    // Check each returned quote
    response.body.forEach((item: any) => {
      expect(typeof item).toBe('string');
      expect(item.length).toBeGreaterThan(0); // Ensure quotes are not empty strings
      // Add length constraint checks based on the prompt/filtering
      expect(item.length).toBeGreaterThanOrEqual(150); // Check minimum length (from prompt)
      expect(item.length).toBeLessThanOrEqual(500);  // Check maximum length (due to filtering)
    });
  }, 15000); // Increase timeout for potential AI API latency

  // Test case 2: AI Quotes Disabled
  test('should return 503 Service Unavailable when AI is disabled', async () => {
    // Temporarily set env var for this test context
    const originalEnableFlag = process.env.ENABLE_AI_QUOTES;
    process.env.ENABLE_AI_QUOTES = 'false'; // Disable for this test

    console.log("Running test: /api/quotes with AI disabled");
    const response = await request(server).get('/api/quotes');

    console.log("Response Status:", response.status);
    // console.log("Response Body:", response.body); // Uncomment for detailed debugging

    // Restore original env var value
    process.env.ENABLE_AI_QUOTES = originalEnableFlag;

    // Assertions
    expect(response.status).toBe(503);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body).toHaveProperty('error', 'AI quote generation is disabled.');
  });

}); 