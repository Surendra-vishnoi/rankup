import { useState, useEffect, useCallback } from 'react';
import PostCard from '../components/PostCard.jsx';
import CreatePostModal from '../components/CreatePostModal.jsx';
import { API_BASE } from '../apiConfig';
import NotificationBell from '../components/NotificationBell.jsx';
import ProblemOfTheDayWidget from '../components/ProblemOfTheDayWidget.jsx';
import Navbar from '../components/Navbar.jsx';

const TABS = [
  { key: 'all',      label: 'All',      emoji: '🌐' },
  { key: 'Insight',  label: 'Insight',  emoji: '💡' },
  { key: 'Doubt',    label: 'Doubt',    emoji: '🐛' },
  { key: 'General',   label: 'General',   emoji: '☕' },
];

/* ── Skeleton card — Twitter-style ── */
function SkeletonCard() {
  return (
    <div className="card flex gap-3 px-4 py-4 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0 mt-0.5" />
      <div className="flex-1 flex flex-col gap-2 pt-0.5">
        <div className="flex items-center gap-2">
          <div className="h-3 w-24 bg-white/10 rounded-full" />
          <div className="h-2.5 w-16 bg-white/[0.07] rounded-full" />
          <div className="h-2.5 w-8 bg-white/[0.07] rounded-full ml-auto" />
        </div>
        <div className="h-4 w-3/4 bg-white/10 rounded" />
        <div className="h-3 w-full bg-white/[0.07] rounded" />
        <div className="h-3 w-1/2 bg-white/[0.07] rounded" />
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
    <div className="p-6 rounded-2xl border border-black/5 dark:border-white/10 bg-white/50 dark:bg-bg-surface/50 shadow-sm backdrop-blur-md">
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
            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.username}</span>
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
        <div className="bg-white dark:bg-black/20 rounded-xl p-3 text-center shadow-sm dark:shadow-none border border-black/5 dark:border-white/5">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5 font-semibold">Rating</p>
          <p className="text-sm font-bold font-mono" style={{ color }}>{liveRating || '—'}</p>
        </div>
        <div className="bg-white dark:bg-black/20 rounded-xl p-3 text-center shadow-sm dark:shadow-none border border-black/5 dark:border-white/5">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5 font-semibold">Solved</p>
          {loading ? (
            <div className="h-5 w-10 mx-auto bg-black/10 dark:bg-white/10 rounded animate-pulse" />
          ) : error ? (
            <p className="text-xs text-red-500 dark:text-red-400 font-medium">Error</p>
          ) : (
            <p className="text-sm font-bold text-slate-800 dark:text-white font-mono">{solvedCount}</p>
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
  const displayList = data[listType].slice(0, 8);

  return (
    <div className={`p-6 transition-colors duration-300`}>
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
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex-shrink-0" />
              <div className="flex-1">
                <div className="h-2.5 w-24 bg-black/10 dark:bg-white/10 rounded mb-1.5" />
                <div className="h-2 w-16 bg-black/5 dark:bg-white/[0.07] rounded" />
              </div>
              <div className="h-2.5 w-10 bg-black/10 dark:bg-white/10 rounded" />
            </div>
          ))}
        </div>
      ) : displayList.length === 0 ? (
        <div className="text-xs text-slate-500 py-4 text-center">No users found.</div>
      ) : (
        <div className="max-h-[380px] overflow-y-auto scrollbar-hide">
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
                    <a href={`/profile/${user.username}`} className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate hover:text-accent transition-colors">{user.username}</a>
                    {/* Wing tag removed as per request */}
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
        </div>
      )}
    </div>
  );
}

export default function HubPage() {
  const [activeTab, setActiveTab]   = useState('all');
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [searchQuery, setSearch]    = useState('');
  const [user, setUser]             = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/verify`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        if (data.isAuthenticated) setUser(data.user);
      })
      .catch(() => setUser(null));

    // Handle auto-open post from URL
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('post');
    if (postId) {
      window.location.href = `/post/${postId}`;
    }
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
    <div className="min-h-screen bg-slate-50 dark:bg-bg-deep text-slate-900 dark:text-slate-200 transition-colors duration-300">
      {/* ── Minimal Grid background ── */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] dark:opacity-[0.02]" aria-hidden>
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* ── Navbar ── */}
      <Navbar user={user} searchQuery={searchQuery} onSearchChange={setSearch}>
        <button
          id="create-post-btn"
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center justify-center gap-1.5 text-sm p-2 sm:px-4 sm:py-2 rounded-lg"
          aria-label="Create Post"
        >
          <svg className="w-5 h-5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span className="hidden sm:inline font-bold">Post</span>
        </button>
      </Navbar>

      <main className="relative z-10 max-w-[1200px] mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* ── Feed column ── */}
          <div className="flex-1 min-w-0">
            {/* Dashboard Header */}
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                  Dashboard
                </h1>
                <p className="text-slate-500 text-sm mt-2 max-w-md leading-relaxed">
                  Welcome to your developer hub. Access discussions, editorial insights, and track your coding activity.
                </p>
              </div>
            </div>

            {/* ── Clean Tabs ── */}
            <div className="flex gap-2 mb-6 border-b border-black/5 dark:border-white/10 pb-4 overflow-x-auto scrollbar-hide">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  id={`tab-${tab.key}`}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap
                    ${activeTab === tab.key
                      ? 'bg-accent/10 dark:bg-accent/20 text-accent ring-1 ring-accent/30'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                >
                  <span className="opacity-70">{tab.emoji}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Post list ── */}
            <div className="flex flex-col gap-3">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="text-5xl mb-3">🔍</div>
                  <p className="text-slate-400 font-semibold">No posts found</p>
                  <p className="text-slate-600 text-sm mt-1">Be the first to post in this category!</p>
                </div>
              ) : (
                filtered.map(post => <PostCard key={post._id} post={post} currentUser={user} />)
              )}
            </div>
          </div>

          {/* ── Clean Sidebar ── */}
          <aside className="hidden lg:flex flex-col gap-6 w-[340px] flex-shrink-0">
            
            {/* My Profile Overview */}
            {user ? (
              <MyProfileWidget user={user} />
            ) : (
              <div className="p-6 rounded-2xl border border-accent/20 bg-accent/5 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Guest Access</h2>
                    <p className="text-xs text-slate-500">Sign in to track progress</p>
                  </div>
                </div>
                <a href="/auth" className="btn-primary w-full flex items-center justify-center py-2.5 text-sm rounded-xl">
                  Login / Sign Up
                </a>
              </div>
            )}

            {/* Quick Stats Minimal */}
            <div className="p-6 rounded-2xl border border-black/5 dark:border-white/10 bg-white/50 dark:bg-bg-surface/50 backdrop-blur-md shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" /> Live Activity
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Active Posts', value: posts.length },
                  { label: 'Network', value: 'Stable' },
                ].map(s => (
                  <div key={s.label} className="bg-white dark:bg-black/20 rounded-xl p-3 text-center shadow-sm dark:shadow-none border border-black/5 dark:border-white/5">
                    <div className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono tracking-tight">{s.value}</div>
                    <div className="text-[10px] uppercase font-semibold text-slate-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Rankers widget */}
            <div className="rounded-2xl overflow-hidden border border-black/5 dark:border-white/10 bg-white/50 dark:bg-bg-surface/50 shadow-sm">
              <TopRankersSidebar />
            </div>

          </aside>
        </div>
      </main>

      {/* ── Create Post Modal ── */}
      {showModal && (
        <CreatePostModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
          currentUser={user}
        />
      )}
    </div>
  );
}
