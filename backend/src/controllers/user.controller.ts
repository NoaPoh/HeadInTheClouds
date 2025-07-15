import express, { Request, Response } from 'express';
import mongoose, { UpdateQuery } from 'mongoose';
import { IUser, userSchema } from '../schemas/user.schema';
import * as _ from 'lodash';
import { upload } from '../utils/storage';

const router = express.Router();
const User = mongoose.model('User', userSchema);

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         profilePicture:
 *           type: string
 *
 * tags:
 *   name: Users
 *   description: API endpoints for managing users
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Fetch all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Error fetching users
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Fetch a single user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user
 *     responses:
 *       200:
 *         description: A single user object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Error fetching user
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(_.pick(user, ['username', 'email', 'profilePicture']));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update an existing user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Error updating user
 */
router.put(
  '/:id',
  upload.single('profilePicture'),
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;

      const { username } = req.body;
      const profilePicturePath = req.file
        ? `/media/${req.file.filename}`
        : undefined;

      const updateData: UpdateQuery<IUser> = {};
      if (username) updateData.username = username;
      if (profilePicturePath) updateData.profilePicture = profilePicturePath;

      const user: IUser = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
      });

      if (!user) return res.status(404).json({ message: 'User not found' });
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: 'Error updating user', error });
    }
  }
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 deletedUserId:
 *                   type: string
 *       404:
 *         description: User not found
 *       500:
 *         description: Error deleting user
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const user: IUser = await User.findByIdAndDelete(req.params.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    res
      .status(200)
      .json({ message: 'User deleted successfully', deletedUserId: user._id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error });
  }
});

export default router;
