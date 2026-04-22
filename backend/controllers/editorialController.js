import Post from '../models/Post.js';
import Comment from '../models/Comment.js';

/**
 * POST /api/editorials
 * Create a new editorial. Requires requireAuth + verifyWingMember.
 */
export const createEditorial = async (req, res) => {
  try {
    const { title, questionNumber, hints, solution, category } = req.body;

    if (!title || !questionNumber || !solution) {
      return res.status(400).json({
        message: 'Title, question number, and solution are required.',
      });
    }

    // Removed strict regex to allow direct links or problem IDs
    const cleanQuestionNumber = questionNumber.trim();

    const allowedCats = ['Insight', 'Doubt'];
    const finalCategory = allowedCats.includes(category) ? category : 'Insight';

    // Sanitise hints: filter empty strings
    const cleanHints = Array.isArray(hints)
      ? hints.map(h => h.trim()).filter(Boolean)
      : [];

    const post = new Post({
      title:          title.trim(),
      content:        solution.trim(),   // used for any fallback preview
      author:         req.user.id,
      category:       finalCategory,
      cfProblemId:    cleanQuestionNumber,
      isEditorial:    true,
      questionNumber: cleanQuestionNumber,
      hints:          cleanHints,
      solution:       solution.trim(),
    });

    await post.save();

    // Increment author's karma (5 for editorial)
    await Post.db.model('User').findByIdAndUpdate(req.user.id, { $inc: { karma: 5 } });

    await post.populate('author', 'username cfHandle rank rating isWingMember isVerified');

    res.status(201).json({ post });
  } catch (err) {
    console.error('createEditorial error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * GET /api/editorials
 * List all editorial posts, newest first.
 */
export const getEditorials = async (req, res) => {
  try {
    const filter = { isEditorial: true };
    if (req.query.category) filter.category = req.query.category;

    const posts = await Post.find(filter)
      .populate('author', 'username cfHandle rank rating isWingMember isVerified')
      .sort({ createdAt: -1 })
      .limit(50);

    // Fetch comment counts
    const postIds = posts.map(p => p._id);
    const commentCounts = await Comment.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: '$post', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    commentCounts.forEach(c => { countMap[c._id.toString()] = c.count; });

    const postsWithCounts = posts.map(p => {
      const plain = p.toObject();
      plain.commentsCount = countMap[p._id.toString()] || 0;
      return plain;
    });

    res.json({ posts: postsWithCounts });
  } catch (err) {
    console.error('getEditorials error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * GET /api/editorials/:id
 */
export const getEditorialById = async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, isEditorial: true })
      .populate('author', 'username cfHandle rank rating isWingMember isVerified');
    if (!post) return res.status(404).json({ message: 'Editorial not found.' });
    res.json({ post });
  } catch (err) {
    console.error('getEditorialById error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};
