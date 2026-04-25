import express from 'express';
import {
  getTopRankers,
  getTopContributors,
  makeWingMember,
  getUserProfile,
  getUserActivity,
  updateUserProfile,
  searchUsers,
  updateUserRoles,
  getAllUsers,
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
router.get('/users', requireAuth, getAllUsers);
router.post('/users/make-wing-member', requireAuth, makeWingMember);
router.put('/users/:username/roles', requireAuth, updateUserRoles);

// Authenticated user
router.put('/users/profile', requireAuth, updateUserProfile);

export default router;
