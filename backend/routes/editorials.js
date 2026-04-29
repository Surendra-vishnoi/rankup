import express from 'express';
import { createEditorial, getEditorials, getEditorialById, deleteEditorial } from '../controllers/editorialController.js';
import { requireAuth, verifyWingMember } from '../middleware/auth.js';

const router = express.Router();

// Public reads
router.get('/editorials',     getEditorials);
router.get('/editorials/:id', getEditorialById);

// Wing-member only write
router.post('/editorials', requireAuth, verifyWingMember, createEditorial);

// Admin only delete
router.delete('/editorials/:id', requireAuth, deleteEditorial);

export default router;
