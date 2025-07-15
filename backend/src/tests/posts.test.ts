import request from 'supertest';
import { Server as HttpServer } from 'http';
import mongoose from 'mongoose';
import { IPost, IPostForFeed } from '../schemas/post.schema';
import serverPromise from '../server';

describe('posts tests', () => {
  let app: HttpServer;

  let postAuthorId: string;
  let accessToken: string;
  const email = `${Math.floor(Math.random() * 1000)}@yeah`;
  const anotherEmail = `${Math.floor(Math.random() * 1000)}@yeah`;

  beforeAll(async () => {
    app = (await serverPromise).server;

    const registrationResponse1 = await request(app)
      .post('/api/auth/register')
      .send({
        email,
        username: 'test user',
        password: 'password',
      });

    postAuthorId = registrationResponse1.body._id;

    await request(app).post('/api/auth/register').send({
      email: anotherEmail,
      username: 'another test user',
      password: 'password',
    });
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
    await request(app).delete(`/api/users/${postAuthorId}`);
    await mongoose.connection.close();
  });

  describe('POST /posts', () => {
    it('should create a new post without file', async () => {
      const newPost: IPost = {
        userId: postAuthorId,
        bookTitle: 'Hello, World!',
        content: 'This is a test post',
        imageUrl:
          'https://cdn.myanimelist.net/s/common/uploaded_files/1455542413-6b19ce62d01ef05368166ff6db661484.png',
      } as IPost;

      const response = await request(app)
        .post('/api/posts')
        .send(newPost)
        .set('Authorization', `JWT ${accessToken}`);
      expect(response.status).toBe(201);
      expect(response.body.userId).toBe(newPost.userId);
      expect(response.body.bookTitle).toBe(newPost.bookTitle);
      expect(response.body.content).toBe(newPost.content);
      expect(response.body.imageUrl).toBe(newPost.imageUrl);
      expect(response.body._id).toBeDefined();
    });

    it('should create a new post with file', async () => {
      const newPost: IPost = {
        userId: postAuthorId,
        bookTitle: 'Hello, World!',
        content: 'This is a test post',
      } as IPost;

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `JWT ${accessToken}`)
        .set('Accept', 'multipart/form-data')
        .field('bookTitle', newPost.bookTitle)
        .field('content', newPost.content)
        .attach('imageFile', `${__dirname}/assets/tiger.jpg`);

      expect(response.status).toBe(201);
      expect(response.body.userId).toBe(newPost.userId);
      expect(response.body.bookTitle).toBe(newPost.bookTitle);
      expect(response.body.content).toBe(newPost.content);
      expect(response.body.imageUrl.startsWith(`/media/`)).toBeTruthy();
      expect(response.body._id).toBeDefined();
    });
  });

  describe('GET /posts/feed', () => {
    it('should return posts for the feed', async () => {
      const response = await request(app)
        .get('/api/posts/feed')
        .set('Authorization', `JWT ${accessToken}`);
      expect(response.status).toBe(200);
      expect(response.body.posts).toBeInstanceOf(Array);
      expect(response.body.totalPages).toBeGreaterThan(0);

      response.body.posts.forEach((post: IPostForFeed) => {
        expect(post._id).toBeDefined();
        expect(post.userId).toBeDefined();
        expect(post.bookTitle).toBeDefined();
        expect(post.content).toBeDefined();
        expect(post.imageUrl).toBeDefined();
        expect(post.likesCount).toBeDefined();
        expect(post.commentsCount).toBeDefined();
      });
    });
  });

  describe('GET /posts/user/:userId', () => {
    it('should return posts by userId', async () => {
      const response = await request(app)
        .get(`/api/posts/user/${postAuthorId}`)
        .set('Authorization', `JWT ${accessToken}`);
      expect(response.status).toBe(200);
      expect(response.body.posts).toBeInstanceOf(Array);
      expect(response.body.totalPages).toBeGreaterThan(0);

      response.body.posts.forEach((post: IPost) => {
        expect(post._id).toBeDefined();
        expect(post.userId).toBe(postAuthorId);
      });
    });
  });

  describe('GET /posts/:id', () => {
    it('should return a post by id', async () => {
      const posts = await request(app)
        .get('/api/posts/feed')
        .set('Authorization', `JWT ${accessToken}`);

      const postId = posts.body.posts[0]._id;

      const response = await request(app)
        .get(`/api/posts/${postId}`)
        .set('Authorization', `JWT ${accessToken}`);
      expect(response.status).toBe(200);
      expect(response.body._id).toBe(postId);
    });

    it('should return 404 if post not found', async () => {
      const response = await request(app)
        .get('/api/posts/1234567890')
        .set('Authorization', `JWT ${accessToken}`);
      expect(response.status).toBe(404);
    });
  });

  describe('PUT /posts/:id', () => {
    it('should update a post', async () => {
      const posts = await request(app)
        .get('/api/posts/feed')
        .set('Authorization', `JWT ${accessToken}`);

      const postId = posts.body.posts[0]._id;

      const updatedPost: IPost = {
        _id: postId,
        userId: postAuthorId,
        bookTitle: 'Hello, World!',
        content: 'This is an updated test post',
      } as IPost;

      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .send(updatedPost)
        .set('Accept', 'application/json')
        .set('Authorization', `JWT ${accessToken}`);
      expect(response.status).toBe(201);
      expect(response.body._id).toBe(postId);
      expect(response.body.userId).toBe(updatedPost.userId);
      expect(response.body.bookTitle).toBe(updatedPost.bookTitle);
      expect(response.body.content).toBe(updatedPost.content);
    });

    it('should return 404 if post not found', async () => {
      const updatedPost: IPost = {
        _id: new mongoose.Schema.Types.ObjectId(''),
        userId: postAuthorId,
        bookTitle: 'Hello, World!',
        content: 'This is an updated test post',
      } as IPost;

      const response = await request(app)
        .put('/api/posts')
        .send(updatedPost)
        .set('Accept', 'application/json')
        .set('Authorization', `JWT ${accessToken}`);
      expect(response.status).toBe(404);
    });
  });

  describe('POST /posts/:id/like', () => {
    const newPost: IPost = {
      userId: postAuthorId,
      bookTitle: 'Hello, World!',
      content: 'This is a test post',
      imageUrl:
        'https://cdn.myanimelist.net/s/common/uploaded_files/1455542413-6b19ce62d01ef05368166ff6db661484.png',
    } as IPost;

    it("should like another user's post", async () => {
      await request(app)
        .post('/api/posts')
        .send(newPost)
        .set('Authorization', `JWT ${accessToken}`);

      const anotherAccessToken = await login(anotherEmail);

      const posts = await request(app)
        .get(`/api/posts/user/${postAuthorId}`)
        .set('Authorization', `JWT ${anotherAccessToken}`);
      const postId = posts.body.posts[0]._id;

      const response = await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `JWT ${anotherAccessToken}`);
      expect(response.status).toBe(200);
    });

    it("should return 400 if user is the post's author", async () => {
      await request(app)
        .post('/api/posts')
        .send(newPost)
        .set('Authorization', `JWT ${accessToken}`);

      const posts = await request(app)
        .get(`/api/posts/user/${postAuthorId}`)
        .set('Authorization', `JWT ${accessToken}`);
      const postId = posts.body.posts[0]._id;

      const response = await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `JWT ${accessToken}`);
      expect(response.status).toBe(400);
    });

    it('should return 404 if post not found', async () => {
      const response = await request(app)
        .post('/api/posts/1234567890/like')
        .set('Authorization', `JWT ${accessToken}`);
      expect(response.status).toBe(404);
    });
  });
});
