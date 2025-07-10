import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import { AppDataSource } from '../config/database';
import { User } from '../entities/user.entity';

const router = express.Router();
const userRepository = AppDataSource.getRepository(User);

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

  try {
    const emailExists = await userRepository.findOne({ where: { email } });
    if (emailExists) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(password, salt);
    
    const newUser = new User();
    newUser.id = uuidv4();
    newUser.username = username;
    newUser.email = email;
    newUser.password = encryptedPassword;
    newUser.tokens = [];

    await userRepository.save(newUser);
    
    // Don't return password in response
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
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
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Successfully logged in
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await userRepository.findOne({ 
      where: { email },
      select: ['id', 'email', 'password', 'username', 'profilePicture', 'tokens']
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = generateToken(
        user.id,
        process.env.ACCESS_TOKEN_SECRET,
        process.env.TOKENS_REFRESH_TIMEOUT
    );
    const refreshToken = generateToken(
        user.id,
        process.env.REFRESH_TOKEN_SECRET as string,
        '5h'
    );

    // Save refresh token to user
    user.tokens = user.tokens || [];
    user.tokens.push(refreshToken);
    await userRepository.save(user);

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user data (excluding password and tokens)
    const { password: _, tokens: __, ...userData } = user;

    res.json({
      user: userData,
      accessToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
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
        const user = await userRepository.findOne({ 
          where: { id: userId },
          select: ['id', 'tokens']
        });
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        if (!user.tokens?.includes(token)) {
          user.tokens = [];
          await userRepository.save(user);
          return res.status(403).json({ message: 'Forbidden user tokens' });
        }

        const accessToken = generateToken(
            user.id,
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
        const user = await userRepository.findOne({ 
          where: { id: userId },
          select: ['id', 'tokens']
        });
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        user.tokens = [];
        await userRepository.save(user);
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
 * /auth/google:
 *   post:
 *     summary: Login with Google
 *     tags: [Auth]
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
 *       400:
 *         description: Invalid token or missing required fields
 */
router.post('/google', async (req: Request, res: Response) => {
  const { credential } = req.body;

  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email || !payload.name) {
      return res.status(400).json({ message: 'Invalid token payload' });
    }

    // Check if user exists
    let user = await userRepository.findOne({ 
      where: { email: payload.email } 
    });

    if (!user) {
      // Create new user
      user = new User();
      user.email = payload.email;
      user.username = payload.name;
      user.profilePicture = payload.picture;
      user.googleId = payload.sub;
      user.tokens = [];
      await userRepository.save(user);
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = payload.sub;
      if (!user.profilePicture && payload.picture) {
        user.profilePicture = payload.picture;
      }
      await userRepository.save(user);
    }

    // Generate tokens
    const accessToken = generateToken(
        user.id,
        process.env.ACCESS_TOKEN_SECRET as string,
        process.env.TOKENS_REFRESH_TIMEOUT
    );
    const refreshToken = generateToken(
        user.id,
        process.env.REFRESH_TOKEN_SECRET as string,
        '5h'
    );

    // Add refresh token to user's tokens array
    user.tokens = user.tokens || [];
    user.tokens.push(refreshToken);
    await userRepository.save(user);

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user data (excluding password and tokens)
    const { password, tokens, ...userData } = user;

    res.json({
      user: userData,
      accessToken,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(400).json({ message: 'Invalid token', error: error.message });
  }
});

export default router;
