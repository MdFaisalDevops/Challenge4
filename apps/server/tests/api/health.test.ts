import request from 'supertest';
import { app } from '../../src/index';

// Mock Firestore queries to avoid hitting live databases during tests
jest.mock('../../src/config/firestore', () => {
  return {
    db: {
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ status: 'HEALTHY' }),
      }),
    },
  };
});

describe('API Health Check Integration Tests', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });

  it('should return 200 OK and match standard health check schemas', async () => {
    const res = await request(app).get('/health');
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'UP');
    expect(res.body.services).toHaveProperty('express', 'HEALTHY');
    expect(res.body.services).toHaveProperty('firestore', 'CONNECTED');
  });

  it('should return 404 for invalid REST endpoints', async () => {
    const res = await request(app).get('/api/v1/invalid-route-stub');
    expect(res.status).toBe(404);
  });
});
