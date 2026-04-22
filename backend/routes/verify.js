import express from 'express';
import { verifyHandle } from '../controllers/verifyController.js';

const router = express.Router();

// POST /api/verify-handle
router.post('/verify-handle', verifyHandle);

export default router;
