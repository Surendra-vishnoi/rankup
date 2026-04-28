import express from 'express';
import { getPosts, createPost, upvotePost, deletePost, getPostById } from '../controllers/postController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/posts',                    getPosts);
router.get('/posts/:id',                getPostById);
router.post('/posts',       requireAuth, createPost);
router.post('/posts/:id/upvote', requireAuth, upvotePost);
router.delete('/posts/:id',      requireAuth, deletePost);

export default router;
