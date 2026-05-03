import express from 'express';
import {
  getTopRankers,
  getTopContributors,
  makeWingMember,
  getUserProfile,
  getUserActivity,
  updateUserProfile,
  updateUsername,
  searchUsers,
  updateUserRoles,
  getAllUsers,
  followUser,
  unfollowUser,
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
router.put('/users/profile/username', requireAuth, updateUsername);
router.post('/users/:username/follow', requireAuth, followUser);
router.post('/users/:username/unfollow', requireAuth, unfollowUser);

export default router;
