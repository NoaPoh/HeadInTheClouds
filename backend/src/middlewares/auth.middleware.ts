import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  if (req.path.includes('/auth') || req.path.includes('/media')) {
    return next();
  }

  const authHeader: string | undefined = req.headers['authorization'];
  const token: string | undefined = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied' });
  }

  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    return res.status(500).json({ message: 'Server configuration error' });
  }

  jwt.verify(token, secret, (err: any, user: any) => {
    if (err) {
      console.debug('Hello, this is the middleware.');
      console.debug('err', err);
      console.debug('user', user);

      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user;
    return next();
  });
};

export default authenticate;
