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

/* ─────────── Single Hint row (independently collapsible) ─────────── */
function HintRow({ index, text }) {
  const [open, setOpen] = useState(false);
  const COLORS = [
    { ring: 'border-amber-400/50 text-amber-400 bg-amber-400/10', label: 'text-amber-400' },
    { ring: 'border-orange-400/50 text-orange-400 bg-orange-400/10', label: 'text-orange-400' },
    { ring: 'border-yellow-300/50 text-yellow-300 bg-yellow-300/10', label: 'text-yellow-300' },
  ];
  const col = COLORS[index % COLORS.length];

  return (
    <div className="rounded-xl border border-white/[0.07] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 group/hint hover:bg-white/[0.03] transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          <span className={`flex-shrink-0 w-6 h-6 rounded-full border text-[11px] font-extrabold flex items-center justify-center ${col.ring}`}>
            {index + 1}
          </span>
          <span className={`text-sm font-semibold ${col.label}`}>
            Hint {index + 1}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-4 pt-1 border-t border-white/[0.05] animate-fade-in">
          <MarkdownRenderer>{text}</MarkdownRenderer>
        </div>
      )}
    </div>
  );
}

/* ─────────── Solution section (collapsible) ─────────── */
function SolutionSection({ solution }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-accent/20 overflow-hidden bg-accent/[0.03]">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-accent-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
          </span>
          <span className="text-sm font-semibold text-accent-light">Full Solution</span>
        </div>
        <svg
          className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-2 border-t border-white/[0.05] animate-fade-in">
          <MarkdownRenderer>{solution}</MarkdownRenderer>
        </div>
      )}
    </div>
  );
}

/* ─────────── Single Editorial Card (expandable) ─────────── */
function EditorialCard({ post }) {
  const [expanded, setExpanded] = useState(false);
  const rank      = post.author?.rank || '';
  const rankColor = cfRankColor(rank);
  const catMeta   = { Insight: { emoji:'💡', color:'text-yellow-400', bg:'bg-yellow-400/10', border:'border-yellow-400/25' },
                      Doubt:{ emoji:'🐛', color:'text-red-400',    bg:'bg-red-400/10',    border:'border-red-400/25'    } };
  const cat       = catMeta[post.category] || catMeta.Insight;
  const hints     = post.hints?.length ? post.hints
                      : post.hint ? [post.hint]    // backward-compat with old single-hint
                      : [];

  return (
    <article className="card-editorial overflow-hidden">
      {/* ── Header (always visible, clickable) ── */}
      <button
        className="w-full text-left p-5 flex flex-col gap-3"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
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
            {/* Expand chevron */}
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all duration-200
              ${expanded ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'border-white/10 text-slate-500'}`}>
              <svg className={`w-4 h-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </span>
          </div>
        </div>

        {/* CF problem number */}
        {post.questionNumber && (
          <a
            href={`https://codeforces.com/problemset/problem/${post.questionNumber.replace(/([A-Za-z])/, '/$1')}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="self-start inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-lg
                       bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
            CF {post.questionNumber}
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
            {/* Hint count removed as per request */}
          </div>
        </div>
      </button>

      {/* ── Expanded body ── */}
      {expanded && (
        <div className="px-5 pb-5 flex flex-col gap-3 border-t border-amber-500/15 pt-4 animate-fade-in">

          {/* Hints — each independently collapsible */}
          {hints.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-500/50 px-1 mb-0.5">
                Progressive Hints
              </p>
              {hints.map((h, i) => <HintRow key={i} index={i} text={h} />)}
            </div>
          )}

          {/* Solution — collapsible */}
          {post.solution && <SolutionSection solution={post.solution} />}
        </div>
      )}
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

  useEffect(() => {
    fetch(`${API_BASE}/api/editorials`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setEditorials(d.posts?.length ? d.posts : MOCK_EDITORIALS))
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
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
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

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8">
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
                filtered.map(post => <EditorialCard key={post._id} post={post} />)
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
