import request from 'supertest';
import serverPromise from '../server';
import { Server as HttpServer } from 'http';
import mongoose from 'mongoose';
import { IPost } from '../schemas/post.schema';
import { CommentForViewPost, IComment } from '../schemas/comment.schema';

describe('comments tests', () => {
  let app: HttpServer;

  let commentAuthor: string;
  let accessToken: string;

  const email = `${Math.floor(Math.random() * 1000)}@yeah`;

  beforeAll(async () => {
    app = (await serverPromise).server;

    const res = await request(app).post('/api/auth/register').send({
      email,
      username: 'test user',
      password: 'password',
    });

    commentAuthor = res.body._id;

    accessToken = await login();
  });

  async function login(customEmail = email) {
    const res = await request(app).post('/api/auth/login').send({
      email: customEmail,
      password: 'password',
    });

    return res.body.accessToken;
  }

  afterAll(async () => {
    await request(app).delete(`/api/users/${commentAuthor}`);
    await mongoose.connection.close();
  });

  describe('POST /comments', () => {
    let postId: string;

    beforeAll(async () => {
      const res2 = await request(app)
        .post('/api/posts')
        .set('Authorization', `JWT ${accessToken}`)
        .send({
          bookTitle: 'Test Post',
          content: 'This is a test post',
          userId: commentAuthor,
          imageUrl: 'https://via.placeholder.com/150',
        } as IPost);

      postId = res2.body._id;
    });

    afterAll(async () => {
      await request(app).delete(`/api/posts/${postId}`);
    });

    it('should create a new comment', async () => {
      const newComment = {
        content: 'This is a test comment',
        postId,
        userId: commentAuthor,
      };

      const response = await request(app)
        .post('/api/comments')
        .send(newComment)
        .set('Authorization', `JWT ${accessToken}`);
      expect(response.status).toBe(201);
      expect(response.body.content).toBe(newComment.content);
      expect(response.body.postId).toBe(newComment.postId);
      expect(response.body.userId).toBe(newComment.userId);
      expect(response.body._id).toBeDefined();
    });

    it('should not create a new comment without content', async () => {
      const newComment = {
        postId,
      };

      const response = await request(app)
        .post('/api/comments')
        .send(newComment)
        .set('Accept', 'application/json')
        .set('Authorization', `JWT ${accessToken}`);
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
        .set('Authorization', `JWT ${accessToken}`);
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
        .set('Authorization', `JWT ${accessToken}`);
      expect(response.status).toBe(400);
    });
  });

  describe('GET /comments', () => {
    it('should return all comments', async () => {
      const response = await request(app)
        .get('/api/comments')
        .set('Authorization', `JWT ${accessToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      response.body.forEach((comment: CommentForViewPost) => {
        expect(comment._id).toBeDefined();
      });
    });
  });

  describe('GET /comments/:postId', () => {
    let postId: string;

    beforeAll(async () => {
      const res2 = await request(app)
        .post('/api/posts')
        .set('Authorization', `JWT ${accessToken}`)
        .send({
          bookTitle: 'Test Post',
          content: 'This is a test post',
          userId: commentAuthor,
          imageUrl: 'https://via.placeholder.com/150',
        } as IPost);

      postId = res2.body._id;
    });

    afterAll(async () => {
      await request(app).delete(`/api/posts/${postId}`);
    });

    it('should return all comments with a certain postId', async () => {
      const response = await request(app)
        .get(`/api/comments/${postId}`)
        .set('Authorization', `JWT ${accessToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      response.body.forEach((comment: IComment) => {
        expect(comment._id).toBeDefined();
        expect(comment.postId).toBe(postId);
      });
    });
  });

  describe('PUT /comments/:id', () => {
    it('should update a comment by ID', async () => {
      const response = await request(app)
        .get('/api/comments')
        .set('Authorization', `JWT ${accessToken}`);
      const commentId = response.body[0]._id;

      const updatedComment: IComment = {
        ...response.body[0],
        content: 'This is an updated test comment',
      };

      const commentResponse = await request(app)
        .put(`/api/comments/${commentId}`)
        .send(updatedComment)
        .set('Accept', 'application/json')
        .set('Authorization', `JWT ${accessToken}`);
      expect(commentResponse.status).toBe(200);
      expect(commentResponse.body.content).toBe(updatedComment.content);
      expect(commentResponse.body.postId).toBe(updatedComment.postId);
      expect(commentResponse.body.userId).toBe(updatedComment.userId);
      expect(commentResponse.body._id).toBe(commentId);
    });
  });

  describe('DELETE /comments/:id', () => {
    it('should delete a comment by ID', async () => {
      const response = await request(app)
        .get('/api/comments')
        .set('Authorization', `JWT ${accessToken}`);
      const commentId = response.body[0]._id;

      const commentResponse = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `JWT ${accessToken}`);
      expect(commentResponse.status).toBe(200);
      expect(commentResponse.body._id).toBe(commentId);
    });
  });
});
