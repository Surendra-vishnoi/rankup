import User from '../models/User.js';
import fetch from 'node-fetch';

const CF_API = 'https://codeforces.com/api';

export const verifyHandle = async (req, res) => {
  try {
    const { username, cfHandle } = req.body;

    if (!username || !cfHandle) {
      return res.status(400).json({ message: 'Username and Codeforces handle are required.' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(200).json({ message: 'Account already verified.', isVerified: true });
    }

    // --- Step 1: Fetch last 5 submissions from Codeforces ---
    const submissionsUrl = `${CF_API}/user.status?handle=${encodeURIComponent(cfHandle)}&from=1&count=5`;
    const submissionsRes = await fetch(submissionsUrl);
    const submissionsData = await submissionsRes.json();

    if (submissionsData.status !== 'OK') {
      return res.status(400).json({ message: `Codeforces API error: ${submissionsData.comment || 'Unknown error. Check handle.'}` });
    }

    const submissions = submissionsData.result;
    const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
    const fiveMinutesAgo = now - 5 * 60;

    // --- Step 2: Check for a COMPILATION_ERROR within the last 5 minutes ---
    const hasCompilationError = submissions.some(
      (sub) => sub.verdict === 'COMPILATION_ERROR' && sub.creationTimeSeconds >= fiveMinutesAgo
    );

    if (!hasCompilationError) {
      return res.status(400).json({
        message: 'No recent Compilation Error found on your account in the last 5 minutes. Please submit a solution that causes a Compilation Error on CF Problem 1A and try again.',
        isVerified: false,
      });
    }

    // --- Step 3: Fetch Codeforces profile for rating and rank ---
    const infoUrl = `${CF_API}/user.info?handles=${encodeURIComponent(cfHandle)}`;
    const infoRes = await fetch(infoUrl);
    const infoData = await infoRes.json();

    let rating = null;
    let rank = null;

    if (infoData.status === 'OK' && infoData.result.length > 0) {
      const cfUser = infoData.result[0];
      rating = cfUser.rating ?? null;
      rank = cfUser.rank ?? null;
    }

    // --- Step 4: Update user in DB ---
    user.isVerified = true;
    user.cfHandle = cfHandle;
    if (rating !== null) user.rating = rating;
    if (rank !== null) user.rank = rank;
    await user.save();

    return res.status(200).json({
      message: 'Account verified successfully! Your Codeforces profile has been synced.',
      isVerified: true,
      profile: { rating, rank, cfHandle },
    });
  } catch (error) {
    console.error('Verify handle error:', error);
    res.status(500).json({ message: 'Server error during verification.' });
  }
};
