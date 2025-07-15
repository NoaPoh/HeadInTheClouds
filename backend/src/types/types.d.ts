// types.d.ts
import * as express from 'express';
import { Server as HttpsServer } from 'https';
import { Server as HttpServer } from 'http';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export type ServerType = HttpsServer | HttpServer;
export type ServerInfo = { server: ServerType; port: number; link: string };
