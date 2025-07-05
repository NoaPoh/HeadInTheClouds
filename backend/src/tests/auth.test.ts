import request from 'supertest';
import { Server as HttpServer } from 'http';
import { Chance } from 'chance';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../config/database';
import { User } from '../entities/user.entity';
import { generateToken } from '../controllers/auth.controller';
import serverPromise from '../server';

const chance = new Chance();

let app: HttpServer;

describe('Auth tests', () => {
  const userRepository = AppDataSource.getRepository(User);
  
  let user: User;
  let accessToken: string;
  let refreshToken: string;

  const userEmail = chance.email();
  const userPassword = 'gofanvikam'; // random password
  const encryptedPassword =
    '$2b$10$nq.NXuRhD0jNzkf.4mZyIO.t0Wsj5wIrrY0QYWflE7ESXyJ7srS1q';

  beforeAll(async () => {
    app = await serverPromise;
    await AppDataSource.initialize();
  });

  afterAll(async () => {
    await userRepository.clear();
    await AppDataSource.destroy();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await userRepository.clear();

    user = await userRepository.save({
      username: chance.name(),
      email: userEmail,
      password: encryptedPassword,
      _id: uuidv4(),
    });

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
      const username = chance.name();
      const email = chance.email();
      const password = 'test1234';

      const res = await request(app)
        .post('/auth/register')
        .send({ username, email, password });

      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty('username', username);
      expect(res.body.user).toHaveProperty('email', email);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should not register a user with existing email', async () => {
      const res = await request(app).post('/auth/register').send({
        username: chance.name(),
        email: userEmail,
        password: 'test1234',
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Username or email already exists');
    });
  });

  describe('login user', () => {
    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: userEmail, password: 'test1234' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user).toHaveProperty('email', userEmail);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should not login with incorrect password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: userEmail, password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should not login with non-existent email', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'test1234' });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'User not found');
    });
  });

  describe('refresh token', () => {
    it('should refresh access token with valid refresh token', async () => {
      const loginRes = await request(app)
        .post('/auth/login')
        .send({ email: userEmail, password: 'test1234' });

      const refreshToken = loginRes.headers['set-cookie'][0]
        .split(';')[0]
        .split('=')[1];

      const res = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });

    it('should not refresh access token with invalid refresh token', async () => {
      const res = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalidtoken' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message', 'Invalid refresh token');
    });
  });

  describe('logout user', () => {
    it('should logout user', async () => {
      const loginRes = await request(app)
        .post('/auth/login')
        .send({ email: userEmail, password: 'test1234' });

      const refreshToken = loginRes.headers['set-cookie'][0]
        .split(';')[0]
        .split('=')[1];

      const res = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Logged out successfully');

      // Verify the refresh token was removed
      const updatedUser = await userRepository.findOne({
        where: { id: user.id },
        select: ['tokens']
      });
      expect(updatedUser?.tokens).not.toContain(refreshToken);
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
