import User from '../models/User.js';

/**
 * Extracts usernames starting with '@' from text.
 * @param {string} text
 * @returns {Array<string>} List of unique usernames
 */
export const extractUsernames = (text) => {
  if (!text) return [];
  const regex = /(?:^|\s)@([a-zA-Z0-9_]+)/g;
  const matches = [...text.matchAll(regex)];
  const usernames = matches.map(m => m[1]);
  return [...new Set(usernames)]; // Unique
};

/**
 * Finds user IDs for the given usernames.
 * @param {Array<string>} usernames
 * @returns {Promise<Array<string>>} List of user IDs
 */
export const getUserIdsFromMentions = async (usernames) => {
  if (!usernames || usernames.length === 0) return [];
  
  // Case insensitive match
  const users = await User.find({
    username: { $in: usernames.map(u => new RegExp(`^${u}$`, 'i')) }
  }).select('_id');
  
  return users.map(u => u._id.toString());
};
