import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Contest from '../models/Contest.js';

// GET /api/users/top-rankers
// Returns top 10 verified users sorted by CF rating descending
export const getTopRankers = async (req, res) => {
  try {
    const rankers = await User.find({ isVerified: true, rating: { $exists: true, $gt: 0 } })
      .select('username cfHandle rank rating isWingMember')
      .sort({ rating: -1 })
      .limit(10);
    res.json({ rankers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/users/top-contributors
// Returns top 10 users sorted by karma descending
export const getTopContributors = async (req, res) => {
  try {
    const contributors = await User.find({})
      .select('username cfHandle rank rating isWingMember karma')
      .sort({ karma: -1 })
      .limit(10);
    res.json({ contributors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/users/search?q=
export const searchUsers = async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.json({ users: [] });
    const users = await User.find({ username: { $regex: q, $options: 'i' } })
      .select('username cfHandle rank isWingMember avatarUrl')
      .limit(10);
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/users/make-wing-member
// Only 'Surendra_vishnoi' can do this.
export const makeWingMember = async (req, res) => {
  try {
    if (req.user.username !== 'Surendra_vishnoi') {
      return res.status(403).json({ message: 'Only admin can grant wing member access.' });
    }

    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ message: 'Username is required.' });
    }

    const targetUser = await User.findOneAndUpdate(
      { username: new RegExp(`^${username.trim()}$`, 'i') }, 
      { $set: { isWingMember: true } },
      { new: true }
    );

    if (!targetUser) {
      return res.status(404).json({ message: `User '${username}' not found.` });
    }

    res.json({ message: `Successfully elevated ${targetUser.username} to Wing Member.`, user: targetUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error promoting user' });
  }
};

// GET /api/users/:username
// Public profile — returns user's public info
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({
      username: new RegExp(`^${req.params.username.trim()}$`, 'i'),
    }).select('username cfHandle rank rating karma isWingMember isVerified createdAt avatarUrl');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Count their posts, editorials, and comments
    const [postCount, editorialCount, commentCount, userContests] = await Promise.all([
      Post.countDocuments({ author: user._id, isEditorial: false }),
      Post.countDocuments({ author: user._id, isEditorial: true }),
      Comment.countDocuments({ author: user._id }),
      Contest.find({ isWingContest: true, topPerformers: user._id }),
    ]);

    let gold = 0, silver = 0, bronze = 0;
    userContests.forEach(c => {
      if (c.topPerformers[0]?.toString() === user._id.toString()) gold++;
      else if (c.topPerformers[1]?.toString() === user._id.toString()) silver++;
      else if (c.topPerformers[2]?.toString() === user._id.toString()) bronze++;
    });

    res.json({ user, stats: { postCount, editorialCount, commentCount, medals: { gold, silver, bronze } } });
  } catch (err) {
    console.error('getUserProfile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/users/:username/activity
// Public — paginated feed of a user's posts, editorials, and comments
export const getUserActivity = async (req, res) => {
  try {
    const user = await User.findOne({
      username: new RegExp(`^${req.params.username.trim()}$`, 'i'),
    }).select('_id');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const [posts, editorials, comments] = await Promise.all([
      Post.find({ author: user._id, isEditorial: false })
        .select('title content category upvotes createdAt cfProblemId')
        .sort({ createdAt: -1 })
        .limit(20),

      Post.find({ author: user._id, isEditorial: true })
        .select('title questionNumber upvotes createdAt')
        .sort({ createdAt: -1 })
        .limit(20),

      Comment.find({ author: user._id })
        .populate('post', 'title _id')
        .select('content createdAt post')
        .sort({ createdAt: -1 })
        .limit(20),
    ]);

    res.json({ posts, editorials, comments });
  } catch (err) {
    console.error('getUserActivity error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/users/profile
// Authenticated user can update their profile (like avatarUrl)
export const updateUserProfile = async (req, res) => {
  try {
    const { avatarUrl } = req.body;
    
    // Simple validation: URL must start with http
    if (avatarUrl && !avatarUrl.startsWith('http')) {
      return res.status(400).json({ message: 'Avatar URL must start with http or https.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { avatarUrl: avatarUrl || '' } },
      { new: true }
    ).select('-password');

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    console.error('updateUserProfile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
