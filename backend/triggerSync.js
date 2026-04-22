import mongoose from 'mongoose';
import { syncAllVerifiedUsers } from './jobs/syncCfRatings.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rankup';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB. Running manual CF Sync...');
    
    // This will pull all isVerified=true users with a cfHandle, fetch their CF stats, and save to MongoDB
    await syncAllVerifiedUsers();

    console.log('Manual sync complete!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
