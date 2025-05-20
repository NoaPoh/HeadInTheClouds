import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { IUser, userSchema } from '../schemas/user.schema';
import { OAuth2Client } from 'google-auth-library';

const User = mongoose.model('User', userSchema);

const router = express.Router();

// Utility function to generate tokens
export const generateToken = (
  userId: string,
  secret: string,
  expiresIn: string
) => {
  return jwt.sign({ userId }, secret, { expiresIn });
};

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: API endpoints for managing user authentication
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *     Tokens:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *         refreshToken:
 *           type: string
 *         userId:
 *           type: string
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 */

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     description: Registers a new user by providing username, email, and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User successfully registered
 *       400:
 *         description: Bad request - missing fields or email already exists
 *       500:
 *         description: Internal server error
 */
router.post('/register', async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  const emailExists: IUser = await User.findOne({
    email,
  });

  if (emailExists) {
    return res.status(400).json({ message: 'Email already exists' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(password, salt);
    const newUser: IUser = new User({
      _id: uuidv4(),
      username,
      email,
      password: encryptedPassword,
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login with email and password
 *     description: Logs a user in using email and password, returns access and refresh tokens.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User successfully logged in
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tokens'
 *       400:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    const user: IUser = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const accessToken = generateToken(
      user._id,
      process.env.ACCESS_TOKEN_SECRET,
      process.env.TOKENS_REFRESH_TIMEOUT
    );
    const refreshToken = generateToken(
      user._id,
      process.env.REFRESH_TOKEN_SECRET as string,
      '5h'
    );

    user.tokens.push(refreshToken);
    await user.save();

    res.json({ accessToken, refreshToken, userId: user._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error logging in user' });
  }
});

/**
 * @swagger
 * /refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Refreshes the access token using the provided refresh token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully refreshed the access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tokens'
 *       401:
 *         description: Unauthorized - no refresh token
 *       403:
 *         description: Forbidden - invalid refresh token
 *       500:
 *         description: Internal server error
 */
router.post('/refresh', async (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  const token =
    req.body.refreshToken || (authHeader && authHeader.split(' ')[1]);
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized - no refresh token' });
  }

  try {
    jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET as string,
      async (err: jwt.VerifyErrors, userInfo: jwt.JwtPayload) => {
        if (err) {
          return res.status(403).json({ message: err.message });
        }

        const userId = userInfo.userId;
        const user: IUser = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        if (!user.tokens.includes(token)) {
          user.tokens = [];
          await user.save();
          return res.status(403).json({ message: 'Forbidden user tokens' });
        }

        const accessToken = generateToken(
          user._id,
          process.env.ACCESS_TOKEN_SECRET as string,
          process.env.TOKENS_REFRESH_TIMEOUT
        );
        res.json({ accessToken });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error refreshing token' });
  }
});

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Logout the user
 *     description: Logs the user out by invalidating the refresh and access tokens.
 *     responses:
 *       200:
 *         description: User successfully logged out
 *       401:
 *         description: Unauthorized - no token provided
 *       403:
 *         description: Forbidden - invalid token
 *       500:
 *         description: Internal server error
 */
router.post('/logout', async (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string,
      async (err: jwt.VerifyErrors, userInfo: jwt.JwtPayload) => {
        if (err) {
          return res.status(403).json({ message: 'Forbidden' });
        }

        const userId = userInfo.userId;
        const user: IUser = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        user.tokens = [];
        await user.save();
        return res.status(200).json({ message: 'User logged out' });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error logging out user' });
  }
});

/**
 * @swagger
 * /google:
 *   post:
 *     summary: Login with Google
 *     description: Allows the user to login via Google OAuth2 by providing a Google ID token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credential
 *             properties:
 *               credential:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully logged in with Google
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tokens'
 *       500:
 *         description: Internal server error
 */
router.post('/google', async (req: Request, res: Response) => {
  const { credential } = req.body;

  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name, sub } = ticket.getPayload();

    let user: IUser = await User.findOne({ email });
    if (!user) {
      user = new User({
        _id: sub,
        username: name,
        email,
        password: 'google-login',
      });

      await user.save();
    }

    const accessToken = generateToken(
      user._id,
      process.env.ACCESS_TOKEN_SECRET as string,
      process.env.TOKENS_REFRESH_TIMEOUT
    );
    const refreshToken = generateToken(
      user._id,
      process.env.REFRESH_TOKEN_SECRET as string,
      '5h'
    );

    user.tokens.push(refreshToken);
    await user.save();

    res.json({ accessToken, refreshToken, userId: user._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error logging in with Google' });
  }
});

export default router;
