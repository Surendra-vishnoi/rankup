import express from 'express';
import { createEditorial, getEditorials, getEditorialById } from '../controllers/editorialController.js';
import { requireAuth, verifyWingMember } from '../middleware/auth.js';

const router = express.Router();

// Public reads
router.get('/editorials',     getEditorials);
router.get('/editorials/:id', getEditorialById);

// Wing-member only write
router.post('/editorials', requireAuth, verifyWingMember, createEditorial);

export default router;
