import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * requireAuth
 * Reads the HttpOnly `token` cookie, verifies it, and attaches
 * the decoded payload as `req.user`. Returns 401 on failure.
 */
export const requireAuth = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;   // { id, username, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Session expired or invalid. Please log in again.' });
  }
};

/**
 * verifyWingMember
 * Must be used AFTER requireAuth (depends on req.user.id).
 * Fetches the user from DB and checks isWingMember === true.
 * Returns 403 if the user is not a Wing member.
 */
export const verifyWingMember = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('isWingMember');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (!user.isWingMember) {
      return res.status(403).json({
        message: 'Access denied. This area is restricted to CP Wing members only.',
      });
    }
    next();
  } catch (err) {
    console.error('verifyWingMember error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
