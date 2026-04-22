import { useState, useEffect, useCallback } from 'react';
import PostCard from '../components/PostCard.jsx';
import CreatePostModal from '../components/CreatePostModal.jsx';
import PostViewModal from '../components/PostViewModal.jsx';
import { API_BASE } from '../apiConfig';

const TABS = [
  { key: 'all',      label: 'All',      emoji: '🌐' },
  { key: 'Insight',  label: 'Insight',  emoji: '💡' },
  { key: 'Doubt',    label: 'Doubt',    emoji: '🐛' },
  { key: 'General',   label: 'General',   emoji: '☕' },
];

/* ── Skeleton card for loading state ── */
function SkeletonCard() {
  return (
    <div className="card p-5 flex flex-col gap-3 animate-pulse">
      <div className="h-3 w-20 bg-white/10 rounded-full" />
      <div className="h-4 w-3/4 bg-white/10 rounded" />
      <div className="h-3 w-full bg-white/[0.07] rounded" />
      <div className="h-3 w-2/3 bg-white/[0.07] rounded" />
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/[0.06]">
        <div className="w-7 h-7 rounded-full bg-white/10" />
        <div className="h-3 w-24 bg-white/10 rounded" />
      </div>
    </div>
  );
}

/* ── Mock posts with rich Markdown + LaTeX + code blocks ── */
const MOCK_POSTS = [
  {
    _id: 'm1',
    title: 'Segment Tree beats — lazy propagation trick',
    content: `## Segment Tree Beats

The key insight is maintaining both $\\text{max}_1$ and $\\text{max}_2$ (first and second maximum) in each node.

For an **"assign-chmax"** operation on range $[l, r]$ with value $v$:
- If $v \\leq \\text{max}_2$, skip entirely — $O(1)$
- If $\\text{max}_2 < v \\leq \\text{max}_1$, update lazily — $O(1)$ per node
- Otherwise recurse — but this case is **amortised** $O(N \\log^2 N)$ total.

\`\`\`cpp
struct Node {
    long long max1, max2, sum;
    int cntMax;
};

void pushDown(int u) {
    // propagate the "chmax" tag to children
    for (int c : {2*u, 2*u+1}) {
        if (tree[c].max1 < tree[u].lazy)
            applyTag(c, tree[u].lazy);
    }
    tree[u].lazy = -INF;
}
\`\`\`

Overall complexity: $O((N + Q) \\log^2 N)$`,
    category: 'Insight',
    createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    upvotes: ['u1','u2','u3'],
    author: { username: 'tourist', rank: 'legendary grandmaster', isWingMember: true },
  },
  {
    _id: 'm2',
    title: 'Getting WA on CF 1234B — prefix sum off-by-one?',
    content: `I have a range query that computes $\\sum_{i=l}^{r} a_i$ but I keep getting WA.

Here's my current code:

\`\`\`python
def build(a):
    n = len(a)
    prefix = [0] * (n + 1)
    for i in range(n):
        prefix[i+1] = prefix[i] + a[i]
    return prefix

def query(prefix, l, r):  # 0-indexed, inclusive
    return prefix[r+1] - prefix[l]  # is this right?
\`\`\`

Is the issue in the query, or in how I'm building the prefix array? The constraint is $1 \\leq N \\leq 10^6$.`,
    category: 'Doubt',
    cfProblemId: '1234B',
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    upvotes: ['u1'],
    author: { username: 'newcoder99', rank: 'pupil' },
  },
  {
    _id: 'm3',
    title: "What's everyone practicing this weekend?",
    content: `Going through old **Div. 2 D** problems from 2020. Found some great graph problems involving $\\text{DFS}$ trees and **bridge-finding**.

Anyone up for a virtual contest on Saturday? Drop your handle below! 😄`,
    category: 'General',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    upvotes: ['u1','u2'],
    author: { username: 'codemaster', rank: 'expert' },
  },
  {
    _id: 'm4',
    title: 'XOR basis trick for maximum XOR subsets',
    content: `## Linear Basis (XOR Basis)

A **linear basis** over $\\text{GF}(2)$ lets you find the maximum XOR of any subset in $O(N \\cdot 32)$.

### Algorithm

1. Maintain a basis array $B[0..31]$.
2. For each number $x$, reduce it through the basis:

$$x \\leftarrow x \\oplus B[\\text{msb}(x)] \\quad \\text{while } B[\\text{msb}(x)] \\neq 0$$

3. If $x \\neq 0$, insert into basis: $B[\\text{msb}(x)] = x$.

\`\`\`cpp
long long basis[64] = {};

void insert(long long x) {
    for (int i = 62; i >= 0; i--) {
        if (!((x >> i) & 1)) continue;
        if (!basis[i]) { basis[i] = x; return; }
        x ^= basis[i];
    }
}

long long maxXOR() {
    long long res = 0;
    for (int i = 62; i >= 0; i--)
        res = max(res, res ^ basis[i]);
    return res;
}
\`\`\`

Complexity: $O(N \\log V)$ where $V = \\max(a_i)$.`,
    category: 'Insight',
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    upvotes: ['u1','u2','u3','u4','u5'],
    author: { username: 'Petr', rank: 'international grandmaster', isWingMember: true },
  },
  {
    _id: 'm5',
    title: 'TLE on greedy approach for CF 999C',
    content: `My current solution runs in $O(N^2 \\log N)$ which TLEs for $N = 2 \\times 10^5$.

\`\`\`cpp
// TLE solution — sorts inside an O(N) loop
for (int i = 0; i < n; i++) {
    sort(a.begin(), a.end());  // O(N log N) each time!
    // ... greedy pick
}
\`\`\`

I think I need a **priority queue** or a **Fenwick tree** to avoid re-sorting. Is there a smarter observation that reduces this to $O(N \\log N)$ overall?`,
    category: 'Doubt',
    cfProblemId: '999C',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    upvotes: [],
    author: { username: 'struggling42', rank: 'specialist' },
  },
  {
    _id: 'm6',
    title: 'Codeforces Round results — share your deltas!',
    content: `Just finished **Div. 1 Round 912**.

- Solved A, B, C in $\\approx 90$ minutes
- Attempted D but ran out of time 😅
- Final delta: **−38**

How did everyone else do? Drop your handle and delta below!`,
    category: 'General',
    createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    upvotes: ['u1','u2','u3'],
    author: { username: 'cfaddict', rank: 'candidate master' },
  },
];


// Rank → color mapping
const rankColor = (rank = '') => {
  const r = (rank || '').toLowerCase();
  if (r.includes('legendary grandmaster'))    return '#ff0000';
  if (r.includes('international grandmaster')) return '#ff3700';
  if (r.includes('grandmaster'))              return '#ff0000';
  if (r.includes('international master'))     return '#ff8c00';
  if (r.includes('master'))                   return '#ffa500';
  if (r.includes('candidate master'))         return '#aa00aa';
  if (r.includes('expert'))                   return '#0000ff';
  if (r.includes('specialist'))               return '#03a89e';
  if (r.includes('pupil'))                    return '#008000';
  if (r.includes('newbie'))                   return '#808080';
  return '#94a3b8';
};

/* ── My Profile sidebar widget ── */
function MyProfileWidget({ user }) {
  const [solvedCount, setSolvedCount] = useState(0);
  const [liveRating, setLiveRating] = useState(user?.rating || null);
  const [liveRank, setLiveRank] = useState(user?.rank || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user || !user.cfHandle) {
      setLoading(false);
      return;
    }
    
    Promise.all([
      fetch(`https://codeforces.com/api/user.status?handle=${user.cfHandle}`).then(res => res.json()),
      fetch(`https://codeforces.com/api/user.info?handles=${user.cfHandle}`).then(res => res.json())
    ])
      .then(([statusData, infoData]) => {
        let isError = false;
        
        if (statusData.status === 'OK') {
          // Use contestId + index for true uniqueness across Gyms and Rounds
          const solvedSet = new Set();
          statusData.result.forEach(submission => {
            if (submission.verdict === 'OK' && submission.problem?.contestId && submission.problem?.index) {
              solvedSet.add(`${submission.problem.contestId}${submission.problem.index}`);
            }
          });
          setSolvedCount(solvedSet.size);
        } else {
          isError = true;
        }

        if (infoData.status === 'OK' && infoData.result?.length > 0) {
          setLiveRating(infoData.result[0].rating || user.rating);
          setLiveRank(infoData.result[0].rank || user.rank);
        } else {
          isError = true;
        }

        setError(isError);
      })
      .catch((err) => {
        console.error('CF API Error:', err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const color = rankColor(liveRank);

  return (
    <div className="card p-4 border-slate-500/20 bg-gradient-to-br from-slate-500/5 to-slate-400/5">
      <div className="flex items-center gap-2 mb-4">
        {/* Profile Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
          style={{
            background: user?.isWingMember
              ? 'linear-gradient(135deg, #eab308, #d97706)'
              : `linear-gradient(135deg, ${color}99, ${color}44)`,
            boxShadow: user?.isWingMember ? '0 0 10px rgba(234,179,8,0.4)' : 'none',
          }}
        >
          {user?.username?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-white truncate">{user?.username}</span>
            {user?.isWingMember && (
              <svg className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 16L3 6l5.5 4L12 4l3.5 6L21 6l-2 10H5z"/>
              </svg>
            )}
          </div>
          <p className="text-xs capitalize font-medium" style={{ color }}>
            {liveRank ? liveRank.replace(/\b\w/g, c => c.toUpperCase()) : 'Unranked'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-bg-surface p-2 rounded text-center border border-white/5">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Rating</p>
          <p className="text-sm font-bold font-mono" style={{ color }}>{liveRating || '—'}</p>
        </div>
        <div className="bg-bg-surface p-2 rounded text-center border border-white/5">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Solved</p>
          {loading ? (
            <div className="h-5 w-10 mx-auto bg-white/10 rounded animate-pulse" />
          ) : error ? (
            <p className="text-xs text-red-400 font-medium">Error</p>
          ) : (
            <p className="text-sm font-bold text-white font-mono">{solvedCount}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-semibold px-1">
        <span className="text-slate-400">Total Karma:</span>
        <span className="text-emerald-400 font-mono">+{user?.karma || 0}</span>
      </div>
    </div>
  );
}

/* ── Top Rankers & Contributors sidebar widget ── */
function TopRankersSidebar() {
  const [listType, setListType] = useState(() => Math.random() > 0.5 ? 'rankers' : 'contributors');
  const [data, setData] = useState({ rankers: [], contributors: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/users/top-rankers`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : { rankers: [] }),
      fetch(`${API_BASE}/api/users/top-contributors`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : { contributors: [] })
    ])
      .then(([rankersRes, contributorsRes]) => {
        setData({
          rankers: rankersRes.rankers?.length ? rankersRes.rankers : [],
          contributors: contributorsRes.contributors?.length ? contributorsRes.contributors : []
        });
      })
      .catch(() => setData({ rankers: [], contributors: [] }))
      .finally(() => setLoading(false));
  }, []);

  const isRankers = listType === 'rankers';
  const displayList = data[listType];

  return (
    <div className={`card p-4 transition-colors duration-300 ${isRankers ? 'border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-amber-400/5' : 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-teal-400/5'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isRankers ? (
            <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 21h10v-2H7v2zm5-18L7 9h3v4h4V9h3L12 3zm-5 9H4V6H2v6a4 4 0 0 0 4 4h1v-4zm14-6h-2v6h1a4 4 0 0 0 4-4V6h-2v6h-1V6z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          )}
          <h2 className={`text-xs font-semibold uppercase tracking-wider ${isRankers ? 'text-yellow-400' : 'text-emerald-400'}`}>
            {isRankers ? 'Top Rankers' : 'Top Contributors'}
          </h2>
        </div>
        <button 
          onClick={() => setListType(prev => prev === 'rankers' ? 'contributors' : 'rankers')}
          className="text-slate-400 hover:text-white transition-colors p-1"
          title={`Switch to ${isRankers ? 'Contributors' : 'Rankers'}`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="17 1 21 5 17 9"></polyline>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
            <polyline points="7 23 3 19 7 15"></polyline>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0" />
              <div className="flex-1">
                <div className="h-2.5 w-20 bg-white/10 rounded mb-1" />
                <div className="h-2 w-14 bg-white/[0.07] rounded" />
              </div>
              <div className="h-2.5 w-10 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      ) : displayList.length === 0 ? (
        <div className="text-xs text-slate-500 py-4 text-center">No users found.</div>
      ) : (
        <ol className="flex flex-col gap-2">
          {displayList.map((user, idx) => {
            const color = rankColor(user.rank);
            const medals = ['🥇', '🥈', '🥉'];
            return (
              <li key={user._id} className="flex items-center gap-2.5 group/ranker">
                {/* Rank number / medal */}
                <span className="w-5 text-center text-xs font-bold text-slate-500 flex-shrink-0">
                  {idx < 3 ? medals[idx] : `${idx + 1}.`}
                </span>

                {/* Avatar */}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{
                    background: user.isWingMember
                      ? 'linear-gradient(135deg, #eab308, #d97706)'
                      : `linear-gradient(135deg, ${color}99, ${color}44)`,
                    boxShadow: user.isWingMember ? '0 0 6px rgba(234,179,8,0.4)' : 'none',
                  }}
                >
                  {user.username[0].toUpperCase()}
                </div>

                {/* Name + rank */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-slate-200 truncate">{user.username}</span>
                    {user.isWingMember && (
                      <svg className="w-2.5 h-2.5 text-yellow-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5 16L3 6l5.5 4L12 4l3.5 6L21 6l-2 10H5z"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-[10px] capitalize" style={{ color }}>
                    {user.rank ? user.rank.replace(/\b\w/g, c => c.toUpperCase()) : 'Unranked'}
                  </span>
                </div>

                {/* Rating or Karma */}
                <span className={`text-xs font-mono font-bold flex-shrink-0 ${isRankers ? '' : 'text-emerald-400'}`} style={isRankers ? { color } : {}}>
                  {isRankers ? (user.rating ?? '—') : `+${user.karma ?? 0}`}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export default function HubPage() {
  const [activeTab, setActiveTab]   = useState('all');
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [searchQuery, setSearch]    = useState('');
  const [user, setUser]             = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/verify`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        if (data.isAuthenticated) setUser(data.user);
      })
      .catch(() => setUser(null));
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const url = activeTab === 'all'
        ? `${API_BASE}/api/posts`
        : `${API_BASE}/api/posts?category=${activeTab}`;
      const res  = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPosts(data.posts?.length ? data.posts : MOCK_POSTS);
    } catch {
      // Fall back to mock data if backend not ready
      setPosts(MOCK_POSTS);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const filtered = posts.filter(p => {
    const matchTab = activeTab === 'all' || p.category === activeTab;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q) || p.content?.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const handleCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  return (
    <div className="min-h-screen bg-bg-deep">
      {/* ── Mesh background ── */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 50% at 20% 0%, rgba(99,120,255,0.1) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(167,139,250,0.08) 0%, transparent 60%)'
        }} />
      </div>

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] backdrop-blur-xl bg-bg-deep/80">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 flex-shrink-0" aria-label="RankUp Home">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-violet flex items-center justify-center text-sm font-extrabold text-white shadow-btn">
              R
            </div>
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white to-accent-violet bg-clip-text text-transparent">
              RankUp
            </span>
          </a>

          {/* Search */}
          <div className="flex-1 max-w-xs">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="w-full bg-bg-surface border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-accent/50 transition-colors"
                type="search"
                placeholder="Search posts…"
                value={searchQuery}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search posts"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex">
            {!user ? (
              <a href="/auth" className="text-sm text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors hidden sm:block">
                Log In / Sign Up
              </a>
            ) : !user.isVerified ? (
              <a href="/verify" className="text-sm text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-400/5 transition-colors hidden sm:block font-semibold">
                Verify CF Account
              </a>
            ) : (
              <a
                href="/editorials"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors"
                style={{ color: '#eab308', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}
                title="Wing Editorials"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Editorials
              </a>
            )}
            <button
              id="create-post-btn"
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-1.5 text-sm px-4 py-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Post
            </button>
          </div>

        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* ── Feed column ── */}
          <div className="flex-1 min-w-0">
            {/* Page title */}
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
                RankUp Hub
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Insights, doubts, and discussions from the competitive programming community.
              </p>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 p-1 bg-bg-card rounded-xl border border-white/[0.07] mb-6 overflow-x-auto" role="tablist">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  id={`tab-${tab.key}`}
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap flex-1 justify-center
                    ${activeTab === tab.key
                      ? 'bg-accent text-white shadow-btn'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                >
                  <span>{tab.emoji}</span>
                  {tab.label}
                  {tab.key !== 'all' && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ml-0.5
                      ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-500'}`}>
                      {MOCK_POSTS.filter(p => p.category === tab.key).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Post list ── */}
            <div className="flex flex-col gap-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              ) : filtered.length === 0 ? (
                <div className="card p-12 text-center">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-slate-400 font-medium">No posts found</p>
                  <p className="text-slate-600 text-sm mt-1">Be the first to post in this category!</p>
                </div>
              ) : (
                filtered.map(post => <PostCard key={post._id} post={post} onOpen={setSelectedPost} />)
              )}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <aside className="hidden lg:flex flex-col gap-4 w-72 flex-shrink-0">
            {/* Top Rankers widget */}
            <TopRankersSidebar />

            {/* Quick stats */}
            <div className="card p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Community</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Total',   value: MOCK_POSTS.length },
                  { label: 'Members', value: '142'  },
                  { label: 'Insights', value: MOCK_POSTS.filter(p=>p.category==='Insight').length   },
                  { label: 'Doubts',  value: MOCK_POSTS.filter(p=>p.category==='Doubt').length },
                ].map(s => (
                  <div key={s.label} className="bg-bg-surface rounded-lg p-3 text-center border border-white/[0.05]">
                    <div className="text-xl font-extrabold text-slate-100 font-mono">{s.value}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Verify CTA or My Profile */}
            {(!user || !user.isVerified) ? (
              <div className="card p-4 border-accent/20 bg-gradient-to-br from-accent/5 to-accent-violet/5">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-accent-violet" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  <h2 className="text-sm font-semibold text-slate-200">Verify your handle</h2>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Link your Codeforces account to display your rank on posts.
                </p>
                {!user ? (
                  <a href="/auth" className="btn-primary text-xs w-full flex items-center justify-center py-2">
                    Login / Sign Up
                  </a>
                ) : (
                  <a href="/verify" className="w-full flex items-center justify-center py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-bg-deep font-extrabold text-xs shadow-gold transition-all duration-300">
                    Verify CF Handle
                  </a>
                )}
              </div>
            ) : (
              <MyProfileWidget user={user} />
            )}

            {/* Category guide */}
            <div className="card p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Categories</h2>
              <ul className="flex flex-col gap-2">
                {[
                  { emoji:'💡', name:'Insight',   color:'text-yellow-400', desc:'Insights & discoveries' },
                  { emoji:'🐛', name:'Doubt', color:'text-red-400',    desc:'Help with a problem'    },
                  { emoji:'☕', name:'General',   color:'text-emerald-400',desc:'General discussion'     },
                ].map(c => (
                  <li key={c.name} className="flex items-center gap-2.5 text-sm">
                    <span className="text-base">{c.emoji}</span>
                    <div>
                      <span className={`font-semibold ${c.color}`}>{c.name}</span>
                      <span className="text-slate-600 text-xs ml-1.5">— {c.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>

      {/* ── Create Post Modal ── */}
      {showModal && (
        <CreatePostModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}

      {/* ── Post View Modal ── */}
      {selectedPost && (
        <PostViewModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          currentUser={user}
        />
      )}
    </div>
  );
}
