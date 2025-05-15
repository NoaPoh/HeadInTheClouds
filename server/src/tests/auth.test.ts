import request from 'supertest';
import serverPromise from '../server';
import { Server as HttpServer } from 'http';
import mongoose from 'mongoose';
import { Chance } from 'chance';
import { generateToken } from '../controllers/auth.controller';
import { userSchema } from '../schemas/user.schema';
import { v4 as uuidv4 } from 'uuid';

const chance = new Chance();

let app: HttpServer;

describe('Auth tests', () => {
  const UserModel = mongoose.model('User', userSchema);

  let user;

  let accessToken: string;
  let refreshToken: string;

  const userEmail = chance.email();
  const userPassword = 'gofanvikam'; // random password
  const encryptedPassword =
    '$2b$10$nq.NXuRhD0jNzkf.4mZyIO.t0Wsj5wIrrY0QYWflE7ESXyJ7srS1q';

  beforeAll(async () => {
    app = (await serverPromise).server;

    user = await new UserModel({
      username: chance.name(),
      email: userEmail,
      password: encryptedPassword,
      _id: uuidv4(),
    }).save();
  });

  beforeEach(async () => {
    accessToken = generateToken(
      user._id,
      process.env.ACCESS_TOKEN_SECRET,
      '1h'
    );

    refreshToken = generateToken(
      user._id,
      process.env.REFRESH_TOKEN_SECRET,
      '1h'
    );

    user.tokens.push(refreshToken);
    await user.save();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('restrict access without token', () => {
    it('should return 401', async () => {
      const response = await request(app).get('/api/posts/feed');
      expect(response.status).toBe(401);
    });
  });

  describe('restrict access with invalid token', () => {
    it('should return 401', async () => {
      const response = await request(app)
        .get('/api/posts/feed')
        .set('Authorization', 'JWT invalidtoken');
      expect(response.status).toBe(401);
    });
  });

  describe('register user', () => {
    it('should register a new user', async () => {
      const email = chance.email();
      const password = chance.word({ length: 10 });

      const response = await request(app).post('/api/auth/register').send({
        username: 'username',
        email,
        password,
      });
      expect(response.status).toBe(201);
      expect(response.body.email).toBe(email);
    });
  });

  describe('login user', () => {
    it('should login a user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: userEmail, password: userPassword });

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    it('should not login a user with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: userEmail, password: 'wrongpassword' });
      expect(response.status).toBe(400);
    });

    it('should not login a user with missing credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({});
      expect(response.status).toBe(400);
    });

    it('should not login a user that does not exist', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nono', password: 'nono' });
      expect(response.status).toBe(404);
    });
  });

  describe('Using access token', () => {
    it('should get all posts using access token', async () => {
      const response = await request(app)
        .get('/api/posts/feed')
        .set('Authorization', `JWT ${accessToken}`);
      expect(response.status).toBe(200);
    });

    it('should not get all posts with timed out token', async () => {
      const expiredAccessToken = generateToken(
        chance.guid(),
        process.env.ACCESS_TOKEN_SECRET,
        '1s'
      );

      await new Promise((resolve) => setTimeout(resolve, 1010));

      const response = await request(app)
        .get('/api/posts/feed')
        .set('Authorization', `JWT ${expiredAccessToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('refresh token', () => {
    it('should refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `JWT ${refreshToken}`);

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeDefined();
    });

    it('should not refresh token with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', 'JWT invalidtoken');
      expect(response.status).toBe(403);
    });

    it('should not refresh token without token', async () => {
      const response = await request(app).post('/api/auth/refresh');
      expect(response.status).toBe(401);
    });
  });

  describe('logout user', () => {
    it('should logout a user', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `JWT ${accessToken}`);

      expect(response.status).toBe(200);
    });
  });
});
