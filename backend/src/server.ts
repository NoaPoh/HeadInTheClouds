import 'reflect-metadata';
import express, { Express } from 'express';
import postsController from './controllers/post.controller';
import commentsController from './controllers/comment.controller';
import authenticate from './middlewares/auth.middleware';
import authController from './controllers/auth.controller';
import usersController from './controllers/user.controller';
import { swaggerSpec } from './swagger';
import cors from 'cors';
import http, { Server as HttpServer } from 'http';
import path from 'path';
import { ServerInfo } from './types/types';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database';

dotenv.config();

const serverPromise: Promise<ServerInfo> = new Promise(
  async (resolve, reject) => {
    try {
      // Initialize database connection
      await initializeDatabase();

      const app: Express = express();
      const prefix = '/api';

      // Middleware
      app.use(cors());
      app.use(express.json());

      // API Documentation
      app.use(`${prefix}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

      // Routes
      app.use(prefix, authenticate);
      app.use(`${prefix}/auth`, authController);
      app.use(`${prefix}/posts`, postsController);
      app.use(`${prefix}/comments`, commentsController);
      app.use(`${prefix}/users`, usersController);

      // Serve static files
      app.use(
        `${prefix}/media`,
        express.static(path.join(__dirname, '../public'))
      );

      // Client static files
      app.use(express.static(path.join(__dirname, '../build')));
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../build', 'index.html'));
      });

      // Health check endpoint
      app.get(`${prefix}`, (req, res) => {
        res.send('Server is running');
      });

      const server: HttpServer = http.createServer(app);
      resolve({
        server,
        port: Number(process.env.HTTP_PORT || 80),
        link: `http://localhost:${process.env.HTTP_PORT || 80}`,
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      reject(error);
    }
  }
);

export default serverPromise;
