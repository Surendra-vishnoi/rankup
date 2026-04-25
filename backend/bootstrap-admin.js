import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);
const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

const usersToPromote = ['Surendra_vishnoi', 'avinashsingh'];

for (const username of usersToPromote) {
  const res = await User.findOneAndUpdate(
    { username: new RegExp(`^${username}$`, 'i') },
    { $set: { isAdmin: true, isWingMember: true } },
    { new: true }
  );
  console.log(`${username} promoted:`, !!res, res?.username);
}

process.exit(0);
