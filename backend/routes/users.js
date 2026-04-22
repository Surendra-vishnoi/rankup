import express from 'express';
import {
  getTopRankers,
  getTopContributors,
  makeWingMember,
  getUserProfile,
  getUserActivity,
  updateUserProfile,
  searchUsers,
} from '../controllers/usersController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Public leaderboards
router.get('/users/top-rankers', getTopRankers);
router.get('/users/top-contributors', getTopContributors);
router.get('/users/search', searchUsers);

// Public user profiles
router.get('/users/:username', getUserProfile);
router.get('/users/:username/activity', getUserActivity);

// Admin-only
router.post('/users/make-wing-member', requireAuth, makeWingMember);

// Authenticated user
router.put('/users/profile', requireAuth, updateUserProfile);

export default router;
