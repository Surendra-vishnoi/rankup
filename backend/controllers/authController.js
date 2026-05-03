import User from '../models/User.js';
import OTP from '../models/OTP.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/sendEmail.js';


// Register User
// Send OTP
export const sendOTP = async (req, res) => {
  try {
    const { email, type } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    if (type === 'register') {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }
    } else if (type === 'forgot-password') {
      const existingUser = await User.findOne({ email });
      if (!existingUser) {
        return res.status(400).json({ message: 'User not found with this email' });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await OTP.deleteMany({ email });
    const newOTP = new OTP({ email, otp });
    await newOTP.save();

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b0e14; color: #ffffff; padding: 40px; border-radius: 12px; border: 1px solid #1e293b;">
        <h2 style="color: #38bdf8; text-align: center; margin-bottom: 30px; font-size: 28px;">RankUp Verification</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #94a3b8; text-align: center;">
          Hello! You are receiving this email because you requested a verification code for your RankUp account.
        </p>
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); padding: 2px; border-radius: 8px; margin: 30px auto; width: fit-content;">
          <div style="background-color: #0b0e14; padding: 20px 40px; border-radius: 6px;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ffffff;">${otp}</span>
          </div>
        </div>
        <p style="font-size: 14px; color: #64748b; text-align: center; margin-top: 30px;">
          This code will expire in <strong>5 minutes</strong>. If you did not request this code, please ignore this email.
        </p>
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 40px 0;">
        <p style="font-size: 12px; color: #475569; text-align: center;">
          © ${new Date().getFullYear()} RankUp. All rights reserved.
        </p>
      </div>
    `;

    await sendEmail(
      email, 
      'Your RankUp Verification Code', 
      `Your RankUp verification code is: ${otp}`,
      htmlContent
    );

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('[SendOTP Error]', error);
    res.status(500).json({ 
      message: 'Server error while sending OTP', 
      error: error.message || error.toString(),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Register User
export const registerUser = async (req, res) => {
  try {
    const { username, password, cfHandle, email, otp } = req.body;

    if (!username || !password || !email || !otp) {
      return res.status(400).json({ message: 'Username, password, email, and OTP are required' });
    }

    const validOTP = await OTP.findOne({ email, otp });
    if (!validOTP) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      cfHandle,
    });

    await newUser.save();
    await OTP.deleteOne({ _id: validOTP._id });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login User
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ message: 'Logged in successfully', user: { id: user._id, username: user.username, cfHandle: user.cfHandle, isAdmin: user.isAdmin, isCoordinator: user.isCoordinator, customTitle: user.customTitle } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Logout User
export const logoutUser = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

// Verify User Session Mapping (Middleware basically but acting as a route to get current user)
export const verifySession = async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ isAuthenticated: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ isAuthenticated: false });
    }
    res.json({ isAuthenticated: true, user: { id: user._id, username: user.username, cfHandle: user.cfHandle, isAdmin: user.isAdmin, isCoordinator: user.isCoordinator, customTitle: user.customTitle } });
  } catch (err) {
    return res.status(401).json({ isAuthenticated: false });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const validOTP = await OTP.findOne({ email, otp });
    if (!validOTP) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    await OTP.deleteOne({ _id: validOTP._id });

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while resetting password' });
  }
};
