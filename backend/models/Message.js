import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
  read: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Fast queries for a conversation between two users
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ recipient: 1, read: 1 });

export default mongoose.model('Message', messageSchema);
