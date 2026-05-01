import { useState, useEffect } from 'react';
import MarkdownRenderer from '../components/MarkdownRenderer.jsx';
import { cfRankColor } from '../utils/cfRank.js';
import { API_BASE } from '../apiConfig';

/* ── Shared helpers ── */
function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return `${Math.floor(diff)}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ── Mock editorials (fallback when backend is offline) ── */
const MOCK_EDITORIALS = [
  {
    _id: 'e1',
    title: '158A — Next Round',
    questionNumber: '158A',
    category: 'Insight',
    createdAt: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
    upvotes: ['u1','u2','u3','u4','u5','u6'],
    hints: [
      `Sort the scores in **descending order**. What is the score of the $k$-th person?`,
      `All participants with score $\\geq s_k$ and score $> 0$ advance. Count them.`,
    ],
    solution: `## Solution — CF 158A: Next Round

**Key observation:** After sorting scores descending, the cutoff is $s_k$ — the score of the $k$-th person. Any participant with score $\\geq s_k$ **and** score $> 0$ qualifies.

\`\`\`cpp
#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, k; cin >> n >> k;
    vector<int> a(n);
    for (auto &x : a) cin >> x;
    sort(a.begin(), a.end(), greater<int>());
    int cutoff = a[k - 1];
    int ans = count_if(a.begin(), a.end(), [&](int x){
        return x >= cutoff && x > 0;
    });
    cout << ans;
}
\`\`\`

**Complexity:** $O(n \\log n)$ for the sort.`,
    author: { username: 'tourist', rank: 'legendary grandmaster', isWingMember: true },
  },
  {
    _id: 'e2',
    title: '1A — Theatre Square',
    questionNumber: '1A',
    category: 'Doubt',
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    upvotes: ['u1','u2'],
    hints: [
      `How many $a \\times a$ tiles fit along a length of $n$? Think ceiling division.`,
    ],
    solution: `## Solution — CF 1A: Theatre Square

$$\\text{answer} = \\left\\lceil \\frac{n}{a} \\right\\rceil \\times \\left\\lceil \\frac{m}{a} \\right\\rceil$$

**Ceiling integer division:** $\\lceil x/y \\rceil = \\lfloor (x + y - 1) / y \\rfloor$

\`\`\`python
import math
n, m, a = map(int, input().split())
print(math.ceil(n/a) * math.ceil(m/a))
\`\`\`

**Complexity:** $O(1)$.`,
    author: { username: 'Petr', rank: 'international grandmaster', isWingMember: true },
  },
  {
    _id: 'e3',
    title: '71A — Way to School',
    questionNumber: '71A',
    category: 'Insight',
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    upvotes: ['u1','u2','u3'],
    hints: [
      `This is a classic **two-pointer** or **merge** problem. Think of the children going from two sides.`,
      `Sort both arrays separately. The optimal is to take the smallest values from each side alternately to minimise sum.`,
      `Pair the largest from left-walkers with the smallest from right-walkers. Formally: sort left ascending and right ascending, then match index-by-index.`,
    ],
    solution: `## Solution — CF 71A: Way to School

**Claim:** Sort the left-walkers and right-walkers independently. Greedily pair the $i$-th largest left with the $i$-th largest right.

\`\`\`cpp
#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<int> a(n), b(m);
    for (auto &x : a) cin >> x;
    for (auto &x : b) cin >> x;
    sort(a.rbegin(), a.rend());
    sort(b.rbegin(), b.rend());
    long long ans = 0;
    int k = min(n, m);
    for (int i = 0; i < k; i++)
        ans += max(a[i], b[i]);
    cout << ans;
}
\`\`\`

**Complexity:** $O(n \\log n + m \\log m)$.`,
    author: { username: 'jiangly', rank: 'grandmaster', isWingMember: true },
  },
];


/* ─────────── Single Editorial Card (expandable) ─────────── */
function EditorialCard({ post, currentUser }) {
  const rank      = post.author?.rank || '';
  const rankColor = cfRankColor(rank);
  const catMeta   = { Insight: { emoji:'💡', color:'text-yellow-400', bg:'bg-yellow-400/10', border:'border-yellow-400/25' },
                      Doubt:{ emoji:'🐛', color:'text-red-400',    bg:'bg-red-400/10',    border:'border-red-400/25'    } };
  const cat       = catMeta[post.category] || catMeta.Insight;
  const hints     = post.hints?.length ? post.hints
                      : post.hint ? [post.hint]    // backward-compat with old single-hint
                      : [];

  return (
    <article id={`editorial-${post._id}`} className="card-editorial overflow-hidden">
      {/* ── Header (clickable) ── */}
      <button
        className="w-full text-left p-5 flex flex-col gap-3"
        onClick={() => window.location.href = `/editorial/${post._id}`}
      >
        {/* Badges row */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cat.bg} ${cat.border} ${cat.color}`}>
              {cat.emoji} {post.category}
            </span>
            <span className="badge-official">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Wing Official
            </span>
          </div>
          <div className="flex items-center gap-2">
            {post.createdAt && <span className="text-xs text-slate-500">{timeAgo(post.createdAt)}</span>}
          </div>
        </div>

        {/* CF problem number */}
        {post.questionNumber && (
          <a
            href={post.questionNumber.startsWith('http') 
              ? post.questionNumber 
              : `https://codeforces.com/problemset/problem/${post.questionNumber.replace(/([A-Za-z])/, '/$1')}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="self-start inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-lg
                       bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
            CF {post.questionNumber.startsWith('http') 
              ? (post.questionNumber.split('/').filter(Boolean).pop() || 'Link') 
              : post.questionNumber}
          </a>
        )}

        {/* Title */}
        <h2 className="text-lg font-bold text-yellow-50 leading-snug text-left">
          {post.title}
        </h2>

        {/* Author row */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-[0_0_8px_rgba(234,179,8,0.3)]">
            {(post.author?.username || '?')[0].toUpperCase()}
          </div>
          <span className="text-sm text-slate-400 font-medium">{post.author?.username || 'Anonymous'}</span>
          {rank && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize ml-1"
              style={{ color: rankColor, background: `${rankColor}18`, border: `1px solid ${rankColor}40` }}>
              {rank.replace(/\b\w/g, c => c.toUpperCase())}
            </span>
          )}
          <div className="ml-auto flex items-center gap-3 text-slate-500 text-xs">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
              </svg>
              {post.upvotes?.length ?? 0}
            </span>
            {currentUser?.isAdmin && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!window.confirm('Delete this editorial?')) return;
                  try {
                    const res = await fetch(`${API_BASE}/api/editorials/${post._id}`, {
                      method: 'DELETE', credentials: 'include',
                    });
                    if (res.ok) window.location.reload();
                    else alert('Failed to delete.');
                  } catch { alert('Error deleting.'); }
                }}
                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all ml-1"
                title="Delete Editorial"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </button>
    </article>
  );
}

/* ─────────── Skeleton loading card ─────────── */
function SkeletonEditorial() {
  return (
    <div className="card-editorial p-5 flex flex-col gap-3 animate-pulse">
      <div className="flex gap-2">
        <div className="h-6 w-16 rounded-full bg-white/10" />
        <div className="h-6 w-24 rounded-full bg-white/10" />
      </div>
      <div className="h-6 w-28 rounded-lg bg-white/10" />
      <div className="h-6 w-2/3 rounded bg-white/[0.08]" />
      <div className="flex items-center gap-2 mt-1">
        <div className="w-7 h-7 rounded-full bg-white/10" />
        <div className="h-3 w-24 rounded bg-white/10" />
      </div>
    </div>
  );
}

/* ─────────── Main page ─────────── */
export default function EditorialsPage() {
  const [editorials, setEditorials] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [catFilter, setCatFilter]   = useState('all');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/verify`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.isAuthenticated) setCurrentUser(d.user); })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
      window.location.reload();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/editorials`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        const fetched = d.posts?.length ? d.posts : MOCK_EDITORIALS;
        setEditorials(fetched);
        
        // Handle auto-expand from URL
        const params = new URLSearchParams(window.location.search);
        const linkedId = params.get('id');
        if (linkedId) {
          window.location.href = `/editorial/${linkedId}`;
        }
      })
      .catch(() => setEditorials(MOCK_EDITORIALS))
      .finally(() => setLoading(false));
  }, []);

  /* Filter */
  const filtered = editorials.filter(e => {
    const matchCat = catFilter === 'all' || e.category === catFilter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || e.title.toLowerCase().includes(q)
      || e.questionNumber?.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-bg-deep">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 55% at 20% 0%, rgba(234,179,8,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 45% at 85% 95%, rgba(161,98,7,0.05) 0%, transparent 60%)'
        }} />
      </div>

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] backdrop-blur-xl bg-bg-deep/80">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2 flex-shrink-0" aria-label="RankUp Home">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-violet flex items-center justify-center text-sm font-extrabold text-white shadow-btn">R</div>
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white to-accent-violet bg-clip-text text-transparent">RankUp</span>
          </a>

          {/* Search */}
          <div className="flex-1 max-w-xs">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="w-full bg-bg-surface border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500/50 transition-colors"
                type="search"
                placeholder="Search editorials…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search editorials"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a href="/" className="text-sm text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors hidden sm:block">
              ← Hub
            </a>
            {currentUser?.isAdmin && (
              <a href="/admin" className="text-purple-400 hover:text-purple-300 text-sm px-3 py-1.5 rounded-lg hover:bg-purple-500/10 transition-colors flex items-center gap-1.5 font-bold">
                🛡️ Admin
              </a>
            )}
            {currentUser && (
              <button
                onClick={handleLogout}
                className="text-red-400 hover:text-red-300 text-sm px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors flex items-center gap-1.5 font-semibold"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Logout
              </button>
            )}
            <a href="/create-editorial"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors"
              style={{ color:'#eab308', background:'rgba(234,179,8,0.08)', border:'1px solid rgba(234,179,8,0.2)' }}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Write Editorial
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">

          {/* ── Main Feed ── */}
          <div className="flex-1 min-w-0">

            {/* Page header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-1.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-gold flex-shrink-0">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-yellow-50">Wing Editorials</h1>
                  <p className="text-slate-500 text-xs mt-0.5">Official solutions by CP Wing members</p>
                </div>
              </div>

              {/* Category filter tabs */}
              <div className="flex gap-1 p-1 bg-bg-card rounded-xl border border-white/[0.07] mt-4 w-fit">
                {[
                  { key: 'all',      label: 'All',      emoji: '⭐' },
                  { key: 'Insight',   label: 'Insight',   emoji: '💡' },
                  { key: 'Doubt', label: 'Doubt', emoji: '🐛' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setCatFilter(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 whitespace-nowrap
                      ${catFilter === tab.key
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                  >
                    <span>{tab.emoji}</span>{tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Editorial list */}
            <div className="flex flex-col gap-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonEditorial key={i} />)
              ) : filtered.length === 0 ? (
                <div className="card p-12 text-center">
                  <div className="text-4xl mb-3">📖</div>
                  <p className="text-slate-400 font-medium">No editorials found</p>
                  <p className="text-slate-600 text-sm mt-1">
                    {search ? 'Try a different search term.' : 'Wing members have not published any editorials yet.'}
                  </p>
                </div>
              ) : (
                filtered.map(post => <EditorialCard key={post._id} post={post} currentUser={currentUser} />)
              )}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <aside className="hidden lg:flex flex-col gap-4 w-64 flex-shrink-0">

            {/* Stats */}
            <div className="card-editorial p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Editorial Stats
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Total',   value: editorials.length },
                  { label: 'Insight',  value: editorials.filter(e => e.category==='Insight').length },
                  { label: 'Doubt',   value: editorials.filter(e => e.category==='Doubt').length },
                  { label: 'Authors', value: new Set(editorials.map(e => e.author?.username)).size },
                ].map(s => (
                  <div key={s.label} className="bg-bg-surface/60 rounded-lg p-3 text-center border border-white/[0.05]">
                    <div className="text-xl font-extrabold text-yellow-50 font-mono">{s.value}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* How to use */}
            <div className="card p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">How to use</h2>
              <ul className="flex flex-col gap-2.5">
                {[
                  { icon:'🔎', text:'Click an editorial to expand it' },
                  { icon:'💡', text:'Open hints one at a time — avoid spoilers!' },
                  { icon:'💻', text:'Reveal the full solution once you have tried' },
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-400 leading-relaxed">
                    <span className="flex-shrink-0 mt-0.5">{tip.icon}</span>
                    <span>{tip.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Drafting Room CTA */}
            <div className="card p-4 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-yellow-400/5">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                <h2 className="text-sm font-semibold text-amber-300">Wing Member?</h2>
              </div>
              <p className="text-xs text-slate-500 mb-3">Contribute an editorial to help the community.</p>
              <a href="/create-editorial" className="btn-primary text-xs w-full flex items-center justify-center py-2">
                Open Drafting Room
              </a>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
