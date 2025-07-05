import request from 'supertest';
import { Server as HttpServer } from 'http';
import { AppDataSource } from '../config/database';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { User } from '../entities/user.entity';
import serverPromise from '../server';
import { DataSource } from 'typeorm';

describe('comments tests', () => {
  let app: HttpServer;
  let dataSource: DataSource;
  let commentAuthorId: string;
  let accessToken: string;
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

    commentAuthorId = res.body.user.id;
    accessToken = res.body.accessToken;
  });

  async function login(customEmail = email) {
    const res = await request(app).post('/api/auth/login').send({
      email: customEmail,
      password: 'password',
    });

    return res.body.accessToken;
  }

  afterAll(async () => {
    await dataSource.destroy();
  });

  describe('POST /comments', () => {
    let postId: string;

    beforeAll(async () => {
      // Create a test post
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Test post for comments',
          imageUrl: 'http://example.com/test.jpg'
        });
      postId = res.body.id;
    });

    it('should create a new comment', async () => {
      const commentData = {
        content: 'Test comment',
        postId,
      };

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(commentData);

      expect(response.status).toBe(201);
      expect(response.body.content).toBe(commentData.content);
      expect(response.body.author.id).toBe(commentAuthorId);
      expect(response.body.post.id).toBe(postId);
    });

    it('should not create a new comment without content', async () => {
      const newComment = {
        postId,
      };

      const response = await request(app)
        .post('/api/comments')
        .send(newComment)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).toBe(400);
    });

    it('should not create a new comment without postId', async () => {
      const newComment = {
        content: 'This is a test comment',
      };

      const response = await request(app)
        .post('/api/comments')
        .send(newComment)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).toBe(400);
    });

    it('should not create a new comment without userId', async () => {
      const newComment = {
        content: 'This is a test comment',
        postId,
      };

      const response = await request(app)
        .post('/api/comments')
        .send(newComment)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).toBe(400);
    });
  });

  describe('GET /comments', () => {
    it('should get all comments for a post', async () => {
      const response = await request(app)
        .get('/api/comments')
        .query({ postId })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((comment: any) => {
        expect(comment.content).toBeDefined();
        expect(comment.author).toBeDefined();
        expect(comment.post).toBeDefined();
      });
    });
  });

  describe('PUT /comments/:id', () => {
    it('should update a comment', async () => {
      const commentRes = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Test comment to update',
          postId,
        });

      const updatedContent = 'Updated comment content';
      const response = await request(app)
        .put(`/api/comments/${commentRes.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: updatedContent });

      expect(response.status).toBe(200);
      expect(response.body.content).toBe(updatedContent);
    });
  });

  describe('DELETE /comments/:id', () => {
    it('should delete a comment by ID', async () => {
      const response = await request(app)
        .get('/api/comments')
        .set('Authorization', `Bearer ${accessToken}`);
      const commentId = response.body[0].id;

      const commentResponse = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(commentResponse.status).toBe(200);
      expect(commentResponse.body.id).toBe(commentId);
    });
  });
});
