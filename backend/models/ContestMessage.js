import mongoose from 'mongoose';

const contestMessageSchema = new mongoose.Schema({
  contest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest',
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  parentMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContestMessage',
    default: null,
  },
}, { timestamps: true });

const ContestMessage = mongoose.model('ContestMessage', contestMessageSchema);
export default ContestMessage;
