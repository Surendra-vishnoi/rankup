import Contest from '../models/Contest.js';
import Post from '../models/Post.js';

const ADMIN_USERNAME = 'Surendra_vishnoi';

// GET /api/contests
export const getContests = async (req, res) => {
  try {
    const contests = await Contest.find({})
      .populate('createdBy', 'username')
      .sort({ startTime: -1 })
      .limit(50);
    res.json({ contests });
  } catch (err) {
    console.error('getContests error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/contests/:id
export const getContestById = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('topPerformers', 'username rank cfHandle isWingMember avatarUrl')
      .populate({
        path: 'linkedPosts',
        populate: { path: 'author', select: 'username rank isWingMember avatarUrl' },
      })
      .populate({
        path: 'linkedEditorials',
        populate: { path: 'author', select: 'username rank isWingMember avatarUrl' },
      });
    if (!contest) return res.status(404).json({ message: 'Contest not found.' });
    res.json({ contest });
  } catch (err) {
    console.error('getContestById error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/contests — admin only
export const createContest = async (req, res) => {
  try {

    const { title, description, cfContestId, startTime, endTime, difficulty, isWingContest, topPerformers } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required.' });
    }
    const contest = new Contest({
      title: title.trim(),
      description: description?.trim() || '',
      cfContestId: cfContestId?.trim() || undefined,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      difficulty: difficulty || 'Other',
      isWingContest: !!isWingContest,
      topPerformers: topPerformers || [],
      createdBy: req.user.id,
    });
    await contest.save();
    await contest.populate('createdBy', 'username');
    res.status(201).json({ contest });
  } catch (err) {
    console.error('createContest error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/contests/:id — admin only
export const updateContest = async (req, res) => {
  try {

    const { title, description, cfContestId, startTime, endTime, difficulty, isWingContest, topPerformers } = req.body;
    const contest = await Contest.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...(title && { title: title.trim() }),
          ...(description !== undefined && { description: description.trim() }),
          ...(cfContestId !== undefined && { cfContestId: cfContestId.trim() }),
          ...(startTime && { startTime: new Date(startTime) }),
          ...(endTime && { endTime: new Date(endTime) }),
          ...(difficulty && { difficulty }),
          ...(isWingContest !== undefined && { isWingContest }),
          ...(topPerformers !== undefined && { topPerformers }),
        },
      },
      { new: true }
    ).populate('createdBy', 'username');
    if (!contest) return res.status(404).json({ message: 'Contest not found.' });
    res.json({ contest });
  } catch (err) {
    console.error('updateContest error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/contests/:id — admin only
export const deleteContest = async (req, res) => {
  try {

    const contest = await Contest.findByIdAndDelete(req.params.id);
    if (!contest) return res.status(404).json({ message: 'Contest not found.' });
    res.json({ message: 'Contest deleted successfully.' });
  } catch (err) {
    console.error('deleteContest error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/contests/:id/link-post — authenticated users
export const linkPost = async (req, res) => {
  try {
    const { postId } = req.body;
    if (!postId) return res.status(400).json({ message: 'postId is required.' });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ message: 'Contest not found.' });

    const field = post.isEditorial ? 'linkedEditorials' : 'linkedPosts';

    // Prevent duplicates
    if (!contest[field].map(id => id.toString()).includes(postId)) {
      contest[field].push(postId);
      await contest.save();
    }

    res.json({ message: 'Post linked to contest.', contest });
  } catch (err) {
    console.error('linkPost error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/contests/:id/unlink-post — admin or post author
export const unlinkPost = async (req, res) => {
  try {
    const { postId } = req.body;
    if (!postId) return res.status(400).json({ message: 'postId is required.' });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found.' });



    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ message: 'Contest not found.' });

    contest.linkedPosts = contest.linkedPosts.filter(id => id.toString() !== postId);
    contest.linkedEditorials = contest.linkedEditorials.filter(id => id.toString() !== postId);
    await contest.save();

    res.json({ message: 'Post unlinked from contest.' });
  } catch (err) {
    console.error('unlinkPost error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
