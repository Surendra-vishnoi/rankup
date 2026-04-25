import ContestMessage from '../models/ContestMessage.js';
import Contest from '../models/Contest.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { extractUsernames, getUserIdsFromMentions } from '../utils/mentions.js';

// GET /api/contests/:id/chat
export const getContestMessages = async (req, res) => {
  try {
    const messages = await ContestMessage.find({ contest: req.params.id })
      .populate('author', 'username cfHandle rank isWingMember avatarUrl')
      .sort({ createdAt: 1 })
      .limit(200);
    res.json({ messages });
  } catch (err) {
    console.error('getContestMessages error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/contests/:id/chat
export const postContestMessage = async (req, res) => {
  try {
    const { text, parentMessage } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required.' });
    }

    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found.' });
    }

    const msg = new ContestMessage({
      contest: contest._id,
      author: req.user.id,
      text: text.trim(),
      parentMessage: parentMessage || null,
    });

    await msg.save();
    await msg.populate('author', 'username cfHandle rank isWingMember avatarUrl');

    // Handle Mentions
    const mentionedUsernames = extractUsernames(text);
    const mentionedIds = await getUserIdsFromMentions(mentionedUsernames);
    const validIds = mentionedIds.filter(id => id !== req.user.id);
    if (validIds.length > 0) {
      const mentions = validIds.map(id => ({
        recipient: id,
        sender: req.user.id,
        type: 'MENTION',
        message: `${msg.author.username} mentioned you in a contest discussion: ${contest.title}`,
        link: `/contests` // we can just link to contests page
      }));
      await Notification.insertMany(mentions);
    }

    res.status(201).json({ message: msg });
  } catch (err) {
    console.error('postContestMessage error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
