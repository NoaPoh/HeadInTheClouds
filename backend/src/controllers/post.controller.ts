import express from 'express';
import { AppDataSource } from '../config/database';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { User } from '../entities/user.entity';
import { upload } from '../utils/storage';
import { Like as TypeORMLike } from 'typeorm';

const router = express.Router();
const postRepository = AppDataSource.getRepository(Post);
const commentRepository = AppDataSource.getRepository(Comment);
const userRepository = AppDataSource.getRepository(User);

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       required:
 *         - userId
 *         - bookTitle
 *         - content
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         bookTitle:
 *           type: string
 *         content:
 *           type: string
 *         imageUrl:
 *           type: string
 *         readingProgress:
 *           type: number
 *         authorName:
 *           type: string
 *         likesCount:
 *           type: integer
 *         commentsCount:
 *           type: integer
 */

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: API endpoints for managing posts
 */

/**
 * @swagger
 * /posts/feed:
 *   get:
 *     summary: Get posts for the feed
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: The page number for pagination
 *     responses:
 *       200:
 *         description: List of posts with comments count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *                 totalPages:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/feed', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = 10; // Number of posts per page

  try {
    const [posts, totalPosts] = await postRepository.findAndCount({
      relations: ['user', 'comments'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const postsWithCounts = posts.map((post) => ({
      ...post,
      commentCount: post.comments?.length || 0,
    }));

    const totalPages = Math.ceil(totalPosts / limit);

    res.status(200).json({ posts: postsWithCounts, totalPages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Get a post by ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the post to retrieve
 *     responses:
 *       200:
 *         description: The requested post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const post = await postRepository.findOneBy({ id });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(200).json({
      ...post,
      commentCount: post.comments?.length || 0
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get all posts
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter posts by userId ID
 *     responses:
 *       200:
 *         description: List of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       500:
 *         description: Server error
 */
router.get('/user/:userId', async (req, res) => {
  const userId = req.params.userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = 10; // Number of posts per page

  try {
    const [totalPosts, posts] = await postRepository.findAndCount({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        bookTitle: true,
        content: true,
        imageUrl: true,
        likes: true,
        readingProgress: true,
        authorName: true,
        createdAt: true,
        user: {
          id: true,
          username: true,
          profilePicture: true
        }
      }
    });

    res.status(200).json({ posts, totalPages: Math.ceil(totalPosts / limit) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     summary: Update a post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the post to update
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               bookTitle:
 *                 type: string
 *               content:
 *                 type: string
 *               imageFile:
 *                 type: string
 *                 format: binary
 *               readingProgress:
 *                 type: number
 *               authorName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.put('/:id', upload.single('imageFile'), async (req, res) => {
  try {
    const imageUrl = req.file
      ? `/media/${req.file.filename}` // Public URL for the file
      : req.body.imageUrl;

    const post = await postRepository.findOne({
      where: { id: req.params.id },
      relations: ['user']
    });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.bookTitle = req.body.bookTitle || post.bookTitle;
    post.content = req.body.content || post.content;
    post.imageUrl = imageUrl;
    post.readingProgress = req.body.readingProgress || post.readingProgress;
    post.authorName = req.body.authorName || post.authorName;

    const updatedPost = await postRepository.save(post);
    res.status(200).json(updatedPost);
  } catch (err) {
    res
      .status(400)
      .json({ message: 'Error updating post', error: err.message });
  }
});

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - bookTitle
 *               - content
 *             properties:
 *               bookTitle:
 *                 type: string
 *               content:
 *                 type: string
 *               imageFile:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/', upload.single('imageFile'), async (req, res) => {
  try {
    const imageUrl = req.file
      ? `/media/${req.file.filename}` // Public URL for the file
      : req.body.imageUrl;

    const newPost = new Post();
    newPost.bookTitle = req.body.bookTitle;
    newPost.content = req.body.content;
    newPost.imageUrl = imageUrl;
    newPost.userId = req.user.userId;
    newPost.likes = [];
    newPost.authorName = req.user.username;

    const savedPost = await postRepository.save(newPost);
    res.status(201).json(savedPost);
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Error creating post', error: err.message });
  }
});

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the post
 *     responses:
 *       204:
 *         description: Post deleted successfully
 *       404:
 *         description: Post not found
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const post = await postRepository.findOne({
      where: { id },
      relations: ['user']
    });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    await postRepository.remove(post);
    res.status(204).end();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /posts/{id}/like:
 *   post:
 *     summary: Like a post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the post to like
 *     responses:
 *       200:
 *         description: Post liked successfully
 *       400:
 *         description: Cannot like own post
 *       404:
 *         description: Post not found
 */
router.post('/:id/like', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId; // Assuming user ID is available in req.user

  try {
    const post = await postRepository.findOne({
      where: { id },
      relations: ['user']
    });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.userId === userId) {
      return res.status(400).json({ error: 'You cannot like your own post' });
    }

    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter((id: string) => id !== userId);
      await postRepository.save(post);
      return res.status(200).json({ message: 'Post unliked successfully' });
    }

    post.likes.push(userId);
    await postRepository.save(post);

    res.status(200).json({ message: 'Post liked successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
