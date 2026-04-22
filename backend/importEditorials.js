import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Post from './models/Post.js';
import User from './models/User.js';

dotenv.config();

function parseEditorials(text) {
  const posts = [];
  const lines = text.split(/\r?\n/);
  
  let currentTitle = '';
  let currentQuestionNumber = '';
  let currentHints = [];
  let currentSolution = '';
  let isParsingSolution = false;

  const pushPost = () => {
    if (currentTitle) {
      posts.push({
        title: '[Editorial] ' + currentTitle.trim(),
        questionNumber: currentQuestionNumber,
        category: 'Insight',
        isEditorial: true,
        hints: currentHints.map(h => h.trim()),
        solution: currentSolution.trim()
      });
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // End of sections
    if (line.includes('---') || line.includes('===') || line.includes('OFFICIAL EDITORIAL')) {
      continue;
    }

    // Match A. Something
    if (line.match(/^[A-Z]\.\s/)) {
      pushPost();
      currentQuestionNumber = line.charAt(0);
      currentTitle = line.substring(3).trim();
      currentHints = [];
      currentSolution = '';
      isParsingSolution = false;
      continue;
    }

    // Match Hint 1: Something
    if (line.startsWith('Hint ')) {
      const parts = line.split(':');
      if (parts.length > 1) {
        currentHints.push(parts.slice(1).join(':').trim());
        isParsingSolution = false;
        continue;
      }
    }

    if (line.startsWith('Detailed Solution:') || line.startsWith('Detailed Editorial:')) {
      isParsingSolution = true;
      currentSolution += line.replace(/Detailed (Solution|Editorial):\s*/, '') + '\n';
      continue;
    }

    if (isParsingSolution) {
      currentSolution += rawLine + '\n';
    } else if (line.length > 0 && currentHints.length > 0) {
      currentHints[currentHints.length - 1] += ' ' + line;
    }
  }

  pushPost();
  return posts;
}

const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rankup');
    console.log('MongoDB connected.');

    let author = await User.findOne({ isWingMember: true });
    if (!author) author = await User.findOne();
    if (!author) {
      console.log('Creating default Wing author...');
      author = await User.create({
         username: 'Surendra_Vishnoi',
         email: 'admin@rankup.local',
         password: 'fake_password',
         isWingMember: true,
         rank: 'expert'
      });
    }

    console.log('Fetching ans.txt...');
    const res1 = await fetch('https://raw.githubusercontent.com/Surendra-vishnoi/speedforces/main/ans.txt');
    const text1 = await res1.text();

    console.log('Fetching ans2.txt...');
    const res2 = await fetch('https://raw.githubusercontent.com/Surendra-vishnoi/speedforces/main/ans2.txt');
    const text2 = await res2.text();

    const posts1 = parseEditorials(text1);
    const posts2 = parseEditorials(text2);
    
    const allPosts = [...posts1, ...posts2].map(p => ({
      ...p,
      author: author._id,
      content: p.solution
    }));

    await Post.insertMany(allPosts);
    console.log('Successfully imported ' + allPosts.length + ' editorials!');
    process.exit(0);

  } catch (err) {
    console.error('Error importing:', err);
    process.exit(1);
  }
};

importData();
