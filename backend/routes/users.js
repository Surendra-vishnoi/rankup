import express from 'express';
import { getTopRankers, getTopContributors, makeWingMember } from '../controllers/usersController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/users/top-rankers', getTopRankers);
router.get('/users/top-contributors', getTopContributors);
router.post('/users/make-wing-member', requireAuth, makeWingMember);

export default router;
