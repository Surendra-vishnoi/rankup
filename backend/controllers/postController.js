import Post from '../models/Post.js';
import Comment from '../models/Comment.js';

// GET /api/posts?category=Eureka
export const getPosts = async (req, res) => {
  try {
    const filter = {};
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
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/posts  — protected by requireAuth middleware
export const createPost = async (req, res) => {
  try {
    // req.user is populated by requireAuth middleware
    const { title, content, category, cfProblemId } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ message: 'Title, content, and category are required.' });
    }
    const allowed = ['Insight', 'Doubt', 'General'];
    if (!allowed.includes(category)) {
      return res.status(400).json({ message: 'Invalid category.' });
    }

    const post = new Post({
      title:       title.trim(),
      content:     content.trim(),
      author:      req.user.id,
      category,
      cfProblemId: category === 'Doubt' ? cfProblemId?.trim() : undefined,
    });
    await post.save();
    
    // Increment author's karma (3 for post)
    await Post.db.model('User').findByIdAndUpdate(req.user.id, { $inc: { karma: 3 } });

    await post.populate('author', 'username cfHandle rank rating isWingMember isVerified');

    res.status(201).json({ post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/posts/:id/upvote  — protected by requireAuth middleware
export const upvotePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    const already = post.upvotes.map(id => id.toString()).includes(req.user.id);
    let karmaChange = 0;
    if (already) {
      post.upvotes = post.upvotes.filter(id => id.toString() !== req.user.id);
      karmaChange = -1;
    } else {
      post.upvotes.push(req.user.id);
      karmaChange = 1;
    }
    await post.save();
    
    // Update the author's karma
    if (karmaChange !== 0 && post.author) {
       await Post.db.model('User').findByIdAndUpdate(post.author, { $inc: { karma: karmaChange } });
    }

    res.json({ upvotes: post.upvotes.length, upvoted: !already });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/posts/:id
// Only admin allowed
export const deletePost = async (req, res) => {
  try {
    if (req.user.username !== 'Surendra_vishnoi') {
      return res.status(403).json({ message: 'Only admin can delete posts.' });
    }

    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    res.json({ message: 'Post deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting post' });
  }
};
