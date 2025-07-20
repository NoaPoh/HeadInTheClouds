import express, { Express } from 'express';
import mongoose from 'mongoose';
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
dotenv.config();

const serverPromise: Promise<ServerInfo> = new Promise((resolve, reject) => {
  const mongoURI: string = process.env.PROD_MONGO_URI;

  mongoose
    .connect(mongoURI)
    .then(() => {
      console.log('Connected to MongoDB');
      const app: Express = express();

      const prefix = '/api';

      app.use(cors());
      app.use(express.json());
      app.use(`${prefix}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
      app.use(prefix, authenticate);
      app.use(`${prefix}/auth`, authController);
      app.use(`${prefix}/posts`, postsController);
      app.use(`${prefix}/comments`, commentsController);
      app.use(`${prefix}/users`, usersController);

      // Serve static files from the public directory
      app.use(
        `${prefix}/media`,
        express.static(path.join(__dirname, '../public'))
      );

      // CLIENT -> Serve static files from the build directory
      app.use(express.static(path.join(__dirname, '../build')));

      // CLIENT -> Serve index.html from the build directory for all other routes
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../build', 'index.html'));
      });

      app.get(`${prefix}`, (req, res) => {
        res.send('Server is here');
      });

      const server: HttpServer = http.createServer(app);
      resolve({
        server,
        port: Number(process.env.HTTP_PORT),
        link: `http://localhost:${process.env.HTTP_PORT}`,
      });
    })
    .catch((err) => console.error(err));
});

export default serverPromise;
