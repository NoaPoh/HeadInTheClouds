import request from 'supertest';
import { Server as HttpServer } from 'http';
import mongoose from 'mongoose';
import serverPromise from '../server';
import { IUser } from '../schemas/user.schema';

describe('User tests', () => {
  let app: HttpServer;

  let accessToken: string;

  let userId: string;

  const email = `${Math.floor(Math.random() * 1000)}@yeah`;

  beforeAll(async () => {
    app = (await serverPromise).server;

    const res = await request(app).post('/api/auth/register').send({
      email,
      username: 'test user',
      password: 'password',
    });

    userId = res.body._id;
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
    const response = await request(app)
      .delete(`/api/users/${userId}`)
      .set('Authorization', `JWT ${accessToken}`);

    await mongoose.connection.close();
  });

  describe('GET /users', () => {
    it('should return all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `JWT ${accessToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);

      response.body.forEach((user: any) => {
        expect(user._id).toBeDefined();
        expect(user.username).toBeDefined();
        expect(user.email).toBeDefined();
        expect(user.password).toBeDefined();
      });
    });
  });

  describe('GET /users/:id', () => {
    it('should return a user by ID', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `JWT ${accessToken}`);
      expect(response.status).toBe(200);
      expect(response.body.email).toBe(email);
      expect(response.body.username).toBeDefined();
    });
  });

  describe('PUT /users/:id', () => {
    it('should update a user without a file', async () => {
      const updatedUser = {
        username: 'Updated User',
      } as IUser;

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send(updatedUser)
        .set('Accept', 'application/json')
        .set('Authorization', `JWT ${accessToken}`);
      expect(response.status).toBe(200);
      expect(response.body.username).toBe(updatedUser.username);
      expect(response.body._id).toBe(userId);
    });

    it('should update a user with a file', async () => {
      const updatedUser = {
        username: 'Updated User',
      } as IUser;

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `JWT ${accessToken}`)
        .field('username', updatedUser.username)
        .attach('profilePicture', `${__dirname}/assets/tiger.jpg`);

      expect(response.status).toBe(200);
      expect(response.body.username).toBe(updatedUser.username);
      expect(response.body._id).toBe(userId);
      expect(response.body.profilePicture.startsWith('/media/')).toBeTruthy();
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete a user by ID', async () => {
      const response = await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `JWT ${accessToken}`);
      expect(response.status).toBe(200);
      expect(response.body.deletedUserId).toBe(userId);

      const userResponse = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `JWT ${accessToken}`);
      expect(userResponse.status).toBe(404);
    });
  });
});
