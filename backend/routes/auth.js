import express from 'express';
import { registerUser, loginUser, logoutUser, verifySession, googleAuth, changePassword } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/verify', verifySession);
router.post('/google', googleAuth);
router.post('/change-password', changePassword);

export default router;
