import request from 'supertest';
import { Server as HttpServer } from 'http';
import { AppDataSource } from '../config/database';
import { User } from '../entities/user.entity';
import serverPromise from '../server';
import { DataSource } from 'typeorm';

describe('User tests', () => {
  let app: HttpServer;
  let dataSource: DataSource;
  let accessToken: string;
  let userId: string;
  const email = `${Math.random().toString(36).substring(2, 11)}@test.com`;

  beforeAll(async () => {
    app = await serverPromise;
    dataSource = AppDataSource;
    await dataSource.initialize();

    // Create test user
    const res = await request(app).post('/auth/register').send({
      email,
      username: 'test user',
      password: 'password',
    });

    userId = res.body.user.id;
    accessToken = res.body.accessToken;
  });

  async function login(customEmail = email) {
    const res = await request(app).post('/api/auth/login').send({
      email: customEmail,
      password: 'password',
    });

    return res.body.accessToken;
  }

  beforeEach(async () => {
    accessToken = await login();
  });

  afterAll(async () => {
    // Clean up test data
    await dataSource.destroy();
  });

  describe('GET /users', () => {
    it('should return all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((user: any) => {
        expect(user.id).toBeDefined();
        expect(user.username).toBeDefined();
        expect(user.email).toBeDefined();
      });
    });
  });

  describe('GET /users/:id', () => {
    it('should return a single user', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(userId);
      expect(response.body.username).toBe('test user');
      expect(response.body.email).toBe(email);
    });
  });

  describe('PUT /users/:id', () => {
    it('should update a user', async () => {
      const updatedData = {
        username: 'updated user',
        bio: 'Test bio',
      };

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.username).toBe(updatedData.username);
      expect(response.body.bio).toBe(updatedData.bio);
    });

    it('should update a user with a file', async () => {
      const updatedUser = {
        username: 'Updated User',
      } as any;

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .field('username', updatedUser.username)
        .attach('profilePicture', `${__dirname}/assets/tiger.jpg`);

      expect(response.status).toBe(200);
      expect(response.body.username).toBe(updatedUser.username);
      expect(response.body.id).toBe(userId);
      expect(response.body.profilePicture.startsWith('/media/')).toBeTruthy();
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete a user', async () => {
      // Create a new user to delete
      const newUser = await request(app).post('/auth/register').send({
        email: `delete-${Math.random().toString(36).substring(2, 7)}@test.com`,
        username: 'user to delete',
        password: 'password',
      });

      const deleteResponse = await request(app)
        .delete(`/api/users/${newUser.body.user.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.id).toBe(newUser.body.user.id);

      // Verify the user was deleted
      const getResponse = await request(app)
        .get(`/api/users/${newUser.body.user.id}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(getResponse.status).toBe(404);
    });
  });
});
