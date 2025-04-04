import request from 'supertest';
import { setupTestDB, teardownTestDB, getApp } from '../../test/helpers/setup';

describe('Race API', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('Health Check', () => {
    it('should return ok status', async () => {
      const response = await request(getApp())
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });
}); 