import cron from 'node-cron';
import fetch from 'node-fetch';
import User from '../models/User.js';

const CF_API = 'https://codeforces.com/api';

/**
 * Given an array of CF handles (max 300 per request per CF docs),
 * fetches their current rating + rank in one API call.
 * Returns a Map<handle, { rating, rank }>.
 */
async function fetchCfProfiles(handles) {
  const url = `${CF_API}/user.info?handles=${handles.map(h => encodeURIComponent(h)).join(';')}`;
  const res  = await fetch(url, { timeout: 15_000 });
  const data = await res.json();

  if (data.status !== 'OK') throw new Error(`CF API error: ${data.comment}`);

  const map = new Map();
  for (const u of data.result) {
    map.set(u.handle.toLowerCase(), {
      rating: u.rating  ?? null,
      rank:   u.rank    ?? null,
    });
  }
  return map;
}

/**
 * Core sync routine: fetch all verified users who have a cfHandle,
 * batch them in groups of 300, call CF API, then bulk-update.
 */
export async function syncAllVerifiedUsers() {
  console.log('[CF Sync] Starting daily rating sync…');

  try {
    const users = await User.find({ isVerified: true, cfHandle: { $exists: true, $ne: '' } })
                            .select('_id cfHandle rating rank');

    if (!users.length) {
      console.log('[CF Sync] No verified users to sync.');
      return;
    }

    // Split into batches of 300 (CF API limit)
    const BATCH = 300;
    let updated = 0;
    let failed  = 0;

    for (let i = 0; i < users.length; i += BATCH) {
      const batch   = users.slice(i, i + BATCH);
      const handles = batch.map(u => u.cfHandle);

      try {
        const profileMap = await fetchCfProfiles(handles);

        // Build bulk ops
        const bulkOps = batch
          .map(user => {
            const key     = user.cfHandle.toLowerCase();
            const profile = profileMap.get(key);
            if (!profile) return null;

            const updates = {};
            if (profile.rating !== null && profile.rating !== user.rating) updates.rating = profile.rating;
            if (profile.rank   !== null && profile.rank   !== user.rank)   updates.rank   = profile.rank;
            if (!Object.keys(updates).length) return null;

            return {
              updateOne: {
                filter: { _id: user._id },
                update: { $set: updates },
              },
            };
          })
          .filter(Boolean);

        if (bulkOps.length) {
          await User.bulkWrite(bulkOps);
          updated += bulkOps.length;
        }

        // Respectful delay between batches — CF asks for no more than 1 req/s
        if (i + BATCH < users.length) {
          await new Promise(r => setTimeout(r, 1200));
        }
      } catch (batchErr) {
        console.error(`[CF Sync] Batch ${i / BATCH + 1} failed:`, batchErr.message);
        failed += batch.length;
      }
    }

    console.log(`[CF Sync] Done. Updated: ${updated}, Failed: ${failed}, Total: ${users.length}`);
  } catch (err) {
    console.error('[CF Sync] Fatal error:', err);
  }
}

/**
 * Schedule: every day at 03:00 AM server time.
 * Cron pattern: "0 3 * * *"
 */
export function startCfSyncJob() {
  cron.schedule('0 3 * * *', () => {
    syncAllVerifiedUsers();
  }, {
    timezone: 'Asia/Kolkata', // IST — change to your server timezone if needed
  });

  console.log('[CF Sync] Daily sync job scheduled at 03:00 IST.');
}
