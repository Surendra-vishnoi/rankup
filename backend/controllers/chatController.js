import Message from '../models/Message.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// GET /api/chat/conversations
// Returns all unique users the current user has messaged, with latest message + unread count
export const getConversationList = async (req, res) => {
  try {
    const myId = new mongoose.Types.ObjectId(req.user.id);

    // Find all messages involving current user
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: myId }, { recipient: myId }],
        },
      },
      {
        $addFields: {
          // "other" is always the other person in the conversation
          other: {
            $cond: [{ $eq: ['$sender', myId] }, '$recipient', '$sender'],
          },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$other',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$recipient', myId] }, { $eq: ['$read', false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          username: '$userInfo.username',
          avatarUrl: '$userInfo.avatarUrl',
          rank: '$userInfo.rank',
          isWingMember: '$userInfo.isWingMember',
          lastMessage: {
            content: '$lastMessage.content',
            createdAt: '$lastMessage.createdAt',
            senderId: '$lastMessage.sender',
          },
          unreadCount: 1,
        },
      },
    ]);

    res.json({ conversations: messages });
  } catch (err) {
    console.error('getConversationList error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/chat/messages/:username
// Returns last 50 messages between current user and target username
export const getMessages = async (req, res) => {
  try {
    const me = req.user.id;
    const { username } = req.params;

    const other = await User.findOne({ username }).select('_id');
    if (!other) return res.status(404).json({ message: 'User not found' });

    const messages = await Message.find({
      $or: [
        { sender: me, recipient: other._id },
        { sender: other._id, recipient: me },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'username avatarUrl')
      .populate('recipient', 'username avatarUrl')
      .lean();

    // Return in chronological order
    res.json({ messages: messages.reverse() });
  } catch (err) {
    console.error('getMessages error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/chat/messages/:username/read
// Mark all messages from :username to current user as read
export const markRead = async (req, res) => {
  try {
    const me = req.user.id;
    const { username } = req.params;

    const other = await User.findOne({ username }).select('_id');
    if (!other) return res.status(404).json({ message: 'User not found' });

    await Message.updateMany(
      { sender: other._id, recipient: me, read: false },
      { $set: { read: true } }
    );

    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error('markRead error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/chat/unread-count
// Returns total unread message count for current user
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      recipient: req.user.id,
      read: false,
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
