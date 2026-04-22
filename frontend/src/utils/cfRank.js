/**
 * Returns the official Codeforces color for a given rank string.
 * Colors sourced from https://codeforces.com/blog/entry/68960
 */
export function cfRankColor(rank = '') {
  const r = rank.toLowerCase();
  if (r.includes('legendary grandmaster')) return '#ff0000';
  if (r.includes('international grandmaster')) return '#ff3700';
  if (r.includes('grandmaster'))             return '#ff0000';
  if (r.includes('international master'))    return '#ff8c00';
  if (r.includes('master'))                  return '#ffa500';
  if (r.includes('candidate master'))        return '#aa00aa';
  if (r.includes('expert'))                  return '#0000ff';
  if (r.includes('specialist'))              return '#03a89e';
  if (r.includes('pupil'))                   return '#008000';
  if (r.includes('newbie'))                  return '#808080';
  return '#94a3b8'; // unranked / unknown
}

export const CF_RANK_LABELS = {
  'newbie':                 'Newbie',
  'pupil':                  'Pupil',
  'specialist':             'Specialist',
  'expert':                 'Expert',
  'candidate master':       'Candidate Master',
  'master':                 'Master',
  'international master':   'International Master',
  'grandmaster':            'Grandmaster',
  'international grandmaster': 'International Grandmaster',
  'legendary grandmaster':  'Legendary Grandmaster',
};
