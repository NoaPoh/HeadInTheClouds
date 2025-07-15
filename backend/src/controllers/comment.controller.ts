import express from 'express';
import mongoose from 'mongoose';
import { CommentForViewPost, commentSchema } from '../schemas/comment.schema';
import { IUser } from '../schemas/user.schema';
const router = express.Router();

const Comment = mongoose.model('Comment', commentSchema);

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
 *         _id:
 *           type: string
 *         content:
 *           type: string
 *         userId:
 *           type: string
 *         postId:
 *           type: string
 *       example:
 *         _id: "60d5f2f9b4d6d68f0009f99f"
 *         content: "This is a comment."
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
    const comment = new Comment({
      ...req.body,
      _id: new mongoose.Types.ObjectId(),
    });

    await comment.save();

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
    const updatedComment = await Comment.findByIdAndUpdate(
      id,
      { content, userId },
      { new: true }
    );

    if (!updatedComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.status(200).json(updatedComment);
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
    const deletedComment = await Comment.findByIdAndDelete(id);

    if (!deletedComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.status(200).json({ _id: id });
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
    const comments = await Comment.find();
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
    const comments = await Comment.find({ postId }).populate(
      'userId',
      'username'
    );

    const commentsDto: CommentForViewPost[] = comments.map((comment) => {
      const user = comment.userId as unknown as IUser;

      return {
        _id: comment._id.toString(),
        userId: user._id,
        username: user.username,
        content: comment.content,
      };
    });
    res.status(200).json(commentsDto);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
