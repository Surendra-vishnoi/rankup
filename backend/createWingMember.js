import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// The User model is simplified for this script, we just need the collection mapping
const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

const run = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/rankup');
        console.log('Connected to MongoDB');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('@surendra', salt);

        const result = await User.findOneAndUpdate(
            { username: 'Surendra_vishnoi' },
            {
                $set: {
                    username: 'Surendra_vishnoi',
                    password: hashedPassword,
                    cfHandle: 'surendra_05',
                    isWingMember: true,
                    isVerified: true, // Auto-verifying the account
                    karma: 50 // Giving them some karma as an admin
                }
            },
            { upsert: true, new: true }
        );

        console.log('Successfully configured Wing Member account:', result.username);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

run();
