import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to Atlas.');

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('@surendra', salt);

  const result = await User.findOneAndUpdate(
    { username: 'Surendra_vishnoi' },
    { $set: { password: hashedPassword } },
    { new: true }
  );

  if (result) {
    console.log(`✅ Password reset for ${result.username}. You can now login with:`);
    console.log(`   Username: Surendra_vishnoi`);
    console.log(`   Password: @surendra`);
  } else {
    console.log('❌ User not found. Creating fresh admin account...');
    const newUser = new User({
      username: 'Surendra_vishnoi',
      password: hashedPassword,
      cfHandle: 'surendra_05',
      isVerified: true,
      isWingMember: true,
      karma: 0,
    });
    await newUser.save();
    console.log('✅ Admin account created!');
    console.log(`   Username: Surendra_vishnoi`);
    console.log(`   Password: @surendra`);
  }

  await mongoose.disconnect();
  process.exit(0);
}
run();
