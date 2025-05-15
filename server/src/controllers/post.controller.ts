import express from 'express';
import mongoose from 'mongoose';
import { IPost, IPostForFeed, postSchema } from '../schemas/post.schema';
import { commentSchema } from '../schemas/comment.schema';
import { upload } from '../utils/storage';
const router = express.Router();

const Post = mongoose.model('Post', postSchema);
const Comment = mongoose.model('Comment', commentSchema);

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
 *         _id:
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
    const totalPosts = await Post.countDocuments({});
    const totalPages = Math.ceil(totalPosts / limit);
    const posts = await Post.find({})
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get comment counts for each post
    const postIds = posts.map((post) => post._id);

    const commentsCounts: {
      _id: mongoose.Schema.Types.ObjectId;
      count: number;
    }[] = await Comment.aggregate([
      { $match: { postId: { $in: postIds } } },
      { $group: { _id: '$postId', count: { $sum: 1 } } },
    ]);

    const postsWithCounts: IPostForFeed[] = posts.map((post) => {
      const commentsCount =
        commentsCounts.find((c) => c._id.toString() === post._id.toString())
          ?.count || 0;

      return {
        _id: post._id.toString(),
        userId: post.userId,
        imageUrl: post.imageUrl,
        bookTitle: post.bookTitle,
        content: post.content || '',
        likesCount: post.likes.length,
        commentsCount,
      };
    });

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
 *         required: true
 *         schema:
 *           type: string
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
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const post: IPost = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.status(200).json(post);
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
    const totalPosts = await Post.countDocuments({ userId });
    const totalPages = Math.ceil(totalPosts / limit);

    const posts = await Post.find({ userId })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({ posts, totalPages });
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
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ error: 'Post not found' });
  }

  try {
    const imageUrl = req.file
      ? `/media/${req.file.filename}` // Public URL for the file
      : req.body.imageUrl;

    console.log('imageUrl', imageUrl);

    const updatedPost: IPost = await Post.findByIdAndUpdate(
      req.params.id,
      { ...req.body, imageUrl },
      {
        new: true,
      }
    );
    if (!updatedPost)
      return res.status(404).json({ message: 'Post not found' });

    res.status(201).json(updatedPost);
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

    const newPost = new Post({
      ...req.body,
      userId: req.user.userId,
      imageUrl,
      _id: new mongoose.Types.ObjectId(),
    });
    const savedPost = await newPost.save();
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
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const deletedPost = await Post.findByIdAndDelete(id);
    if (!deletedPost) {
      return res.status(404).json({ error: 'Post not found' });
    }
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
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post: IPost = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.userId === userId) {
      return res.status(400).json({ error: 'You cannot like your own post' });
    }

    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter((id: string) => id !== userId);
      await post.save();
      return res.status(200).json({ message: 'Post unliked successfully' });
    }

    post.likes.push(userId);
    await post.save();

    res.status(200).json({ message: 'Post liked successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
