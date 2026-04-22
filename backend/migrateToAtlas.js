import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import all models
import User from './models/User.js';
import Post from './models/Post.js';
import Comment from './models/Comment.js';

dotenv.config();

const LOCAL_URI = 'mongodb://127.0.0.1:27017/rankup';
const ATLAS_URI = process.env.MONGODB_URI;

if (!ATLAS_URI || ATLAS_URI.includes('localhost')) {
  console.error("Please configure MONGODB_URI in .env to an Atlas cluster first.");
  process.exit(1);
}

async function run() {
  let localData = {};

  // Step 1: Connect to Local DB
  try {
    console.log('[1/4] Connecting to Local MongoDB...');
    await mongoose.connect(LOCAL_URI);
    console.log('Connected to Local DB.');

    // Extract all data
    localData.users = await User.find({}).lean();
    localData.posts = await Post.find({}).lean();
    localData.comments = await Comment.find({}).lean();

    console.log(`Extracted:
- ${localData.users.length} Users
- ${localData.posts.length} Posts
- ${localData.comments.length} Comments`);

    await mongoose.disconnect();
    console.log('Disconnected from Local DB.');
  } catch (err) {
    console.error('Failed on Local Phase:', err);
    process.exit(1);
  }

  // Step 2: Connect to Atlas DB
  try {
    console.log('\n[2/4] Connecting to Cloud Atlas Database...');
    await mongoose.connect(ATLAS_URI);
    console.log('Connected to Atlas DB.');

    // Wipe remote first (optional, but ensures clean slate)
    console.log('[3/4] Wiping existing Cloud records to prevent duplicates...');
    await User.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});

    // Step 3: Insert Data
    console.log('[4/4] Inserting data into Atlas...');
    if (localData.users.length) await User.insertMany(localData.users);
    if (localData.posts.length) await Post.insertMany(localData.posts);
    if (localData.comments.length) await Comment.insertMany(localData.comments);

    console.log('✅ Migration to Atlas absolute success!');
    process.exit(0);

  } catch (err) {
    console.error('Failed on Atlas Phase:', err);
    process.exit(1);
  }
}

run();
