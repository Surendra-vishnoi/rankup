import User from '../models/User.js';

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
    const contributors = await User.find({ karma: { $gt: 0 } })
      .select('username cfHandle rank rating isWingMember karma')
      .sort({ karma: -1 })
      .limit(10);
    res.json({ contributors });
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

    // Notice we use the schema uniqueness of username to find them
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
