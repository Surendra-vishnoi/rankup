import express from 'express';
import {
  getConversationList,
  getMessages,
  markRead,
  getUnreadCount,
} from '../controllers/chatController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth); // All chat routes require authentication

router.get('/conversations', getConversationList);
router.get('/unread-count', getUnreadCount);
router.get('/messages/:username', getMessages);
router.put('/messages/:username/read', markRead);

export default router;
