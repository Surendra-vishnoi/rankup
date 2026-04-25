import mongoose from 'mongoose';

const contestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  contestLink: {
    type: String,
    trim: true,
  },
  standingsLink: {
    type: String,
    trim: true,
  },
  // Community posts linked to this contest
  linkedPosts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
  ],
  // Editorials linked to this contest (isEditorial === true Posts)
  linkedEditorials: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isWingContest: {
    type: Boolean,
    default: false,
  },
  topPerformers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, { timestamps: true });

const Contest = mongoose.model('Contest', contestSchema);
export default Contest;
