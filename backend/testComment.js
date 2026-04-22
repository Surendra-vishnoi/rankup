import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from './models/User.js';
import Post from './models/Post.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/rankup');
    const user = await User.findOne({ username: 'Surendra_vishnoi' });
    const post = await Post.findOne({}); // grab any post

    if (!user || !post) {
      console.log('Missing user or post');
      process.exit(1);
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    const res = await fetch(`http://localhost:5000/api/posts/${post._id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${token}`
      },
      body: JSON.stringify({ content: "Testing script comment" })
    });

    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
    
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
