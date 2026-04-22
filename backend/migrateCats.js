import mongoose from 'mongoose';

const run = async () => {
    await mongoose.connect('mongodb://127.0.0.1:27017/rankup');
    const res1 = await mongoose.connection.db.collection('posts').updateMany({category: 'Lounge'}, {$set: {category: 'General'}});
    console.log('Updated Lounge to General:', res1);
    process.exit(0);
};

run();
