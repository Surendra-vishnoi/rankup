import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getComments, addComment, deleteComment } from '../controllers/commentController.js';

const router = express.Router();

// Base mounted at /api
router.get('/posts/:postId/comments', getComments);
router.post('/posts/:postId/comments', requireAuth, addComment);

router.delete('/comments/:commentId', requireAuth, deleteComment);

export default router;
