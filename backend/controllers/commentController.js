import Comment from '../models/Comment.js';
import Post from '../models/Post.js';

// GET /api/posts/:postId/comments
// Supports ?page=N and ?limit=N (defaults to limit=5)
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ post: postId })
      .populate('author', 'username cfHandle rank rating isWingMember')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments({ post: postId });

    res.json({
      comments,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching comments' });
  }
};

// POST /api/posts/:postId/comments
// Protected by requireAuth
export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required.' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    const newComment = new Comment({
      content: content.trim(),
      author: req.user.id,
      post: postId
    });

    await newComment.save();
    
    // Return with populated author so UI updates immediately
    await newComment.populate('author', 'username cfHandle rank rating isWingMember');

    res.status(201).json({ comment: newComment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error adding comment' });
  }
};

// DELETE /api/comments/:commentId
// Protected by requireAuth
// Either author or Wing Member can delete
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId).populate('author');
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });

    // Permissions check
    const isAuthor = comment.author._id.toString() === req.user.id;
    const isWing = req.user.isWingMember === true;

    if (!isAuthor && !isWing) {
       return res.status(403).json({ message: 'Unauthorized to delete this comment.' });
    }

    await Comment.findByIdAndDelete(req.params.commentId);
    res.json({ message: 'Comment deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting comment' });
  }
};
