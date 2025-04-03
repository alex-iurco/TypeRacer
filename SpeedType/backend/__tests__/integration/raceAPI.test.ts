import request from 'supertest';
import { app } from '../../server';
import { createTestUser, cleanupTestUser } from '../helpers/userHelper';

describe('Race API', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await createTestUser();
  });

  afterEach(async () => {
    await cleanupTestUser(testUser.id);
  });

  describe('POST /api/races', () => {
    it('creates new race successfully', async () => {
      const response = await request(app)
        .post('/api/races')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          type: 'multiplayer',
          maxPlayers: 2
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('raceId');
      expect(response.body).toHaveProperty('quote');
    });

    it('returns 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/races')
        .send({
          type: 'multiplayer',
          maxPlayers: 2
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/races/:id', () => {
    it('retrieves race details', async () => {
      // First create a race
      const createResponse = await request(app)
        .post('/api/races')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          type: 'multiplayer',
          maxPlayers: 2
        });

      const raceId = createResponse.body.raceId;

      // Then get its details
      const response = await request(app)
        .get(`/api/races/${raceId}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', raceId);
      expect(response.body).toHaveProperty('players');
      expect(response.body).toHaveProperty('status');
    });

    it('returns 404 for non-existent race', async () => {
      const response = await request(app)
        .get('/api/races/nonexistent')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(response.status).toBe(404);
    });
  });
}); 