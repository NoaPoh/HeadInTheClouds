import express from 'express';
import { AppDataSource } from '../config/database';
import { Comment, CommentForViewPost } from '../entities/comment.entity';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';

const router = express.Router();
const commentRepository = AppDataSource.getRepository(Comment);
const postRepository = AppDataSource.getRepository(Post);
const userRepository = AppDataSource.getRepository(User);

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       required:
 *         - content
 *         - userId
 *         - postId
 *       properties:
 *         id:
 *           type: string
 *         content:
 *           type: string
 *         userId:
 *           type: string
 *         postId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         user:
 *           $ref: '#/components/schemas/User'
 *       example:
 *         id: "60d5f2f9b4d6d68f0009f99f"
 *         content: "This is a comment."
 *         userId: "60d5f2f9b4d6d68f0009f99e"
 *         postId: "60d5f2f9b4d6d68f0009f99d"
 *         createdAt: "2023-01-01T00:00:00.000Z"
 *         user:
 *           id: "60d5f2f9b4d6d68f0009f99e"
 *           username: "johndoe"
 *           profilePicture: "/media/profile.jpg"
 *         userId: "04680794635033055239"
 *         postId: "60d5f2f9b4d6d68f0009f77f"
 */

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: API endpoints for managing comments
 */

/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Add a new comment
 *     tags: [Comments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
  if (!req.body.userId || !req.body.content || !req.body.postId) {
    return res
      .status(400)
      .json({ error: 'author, content and postId are required' });
  }

  try {
    const comment = new Comment();
    Object.assign(comment, req.body);
    await AppDataSource.manager.save(comment);

    res.status(201).json(comment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /comments/{id}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the comment to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       200:
 *         description: Updated comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Server error
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { content, userId } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    const comment = await commentRepository.findOneBy({ id });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    comment.content = content;
    await commentRepository.save(comment);

    res.status(200).json(comment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the comment to delete
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await commentRepository.delete(id);

    if (result.affected === 0) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.status(200).json({ message: 'Comment deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /comments:
 *   get:
 *     summary: Get all comments
 *     tags: [Comments]
 *     responses:
 *       200:
 *         description: List of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const comments = await commentRepository.find({
      relations: ['user', 'post'],
    });

    res.status(200).json(comments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /comments/{postId}:
 *   get:
 *     summary: Get all comments for a specific post
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post
 *     responses:
 *       200:
 *         description: List of comments for the post
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       500:
 *         description: Server error
 */
router.get('/:postId', async (req, res) => {
  const { postId } = req.params;
  try {
    const comments = await commentRepository.find({
      where: { post: { id: postId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    const commentsDto: CommentForViewPost[] = comments.map((comment) => {
      return {
        id: comment.id,
        userId: comment.user.id,
        username: comment.user.username,
        content: comment.content,
      };
    });

    res.status(200).json(commentsDto);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
