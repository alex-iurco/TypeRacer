import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer;

// Connect to in-memory database for testing
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

// Clear database between tests
beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

// Disconnect and stop MongoDB instance
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

// Global test timeout
jest.setTimeout(30000); 