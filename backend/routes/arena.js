import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getLeaderboard, getMatchHistory, getMatch, executeCode } from '../controllers/arenaController.js';

const router = express.Router();

router.get('/arena/leaderboard',                    getLeaderboard);
router.get('/arena/history/:username',              getMatchHistory);
router.get('/arena/match/:matchId',                 getMatch);
router.post('/arena/execute',          requireAuth,  executeCode);

export default router;
