import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    enum: ['Insight', 'Doubt', 'General', 'Announcement'],
    required: true,
  },
  cfProblemId: {
    type: String,
  },

  /* ── Editorial fields ── */
  isEditorial: {
    type: Boolean,
    default: false,
  },
  // The CF question this editorial covers, e.g. "158A"
  questionNumber: {
    type: String,
    trim: true,
  },
  // Ordered progressive hints (array), each shown independently collapsible
  hints: {
    type: [String],
    default: [],
  },
  // Full solution write-up (Markdown + LaTeX)
  solution: {
    type: String,
  },
  upvotes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }
  ],
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);
export default Post;
