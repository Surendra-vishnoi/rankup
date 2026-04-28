import express from 'express';
import { registerUser, loginUser, logoutUser, verifySession, sendOTP, resetPassword } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/verify', verifySession);
router.post('/send-otp', sendOTP);
router.post('/reset-password', resetPassword);

export default router;
