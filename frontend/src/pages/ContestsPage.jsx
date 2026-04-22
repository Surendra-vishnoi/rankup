import { useState, useEffect } from 'react';
import { API_BASE } from '../apiConfig';

const ADMIN = 'Surendra_vishnoi';
const DIFFICULTIES = ['Div. 1', 'Div. 2', 'Div. 3', 'Div. 4', 'Educational', 'Global', 'Other'];
const DIFF_COLOR = {
  'Div. 1': 'text-red-400 bg-red-400/10 border-red-400/30',
  'Div. 2': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  'Div. 3': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  'Div. 4': 'text-teal-400 bg-teal-400/10 border-teal-400/30',
  'Educational': 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  'Global': 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  'Other': 'text-slate-400 bg-slate-400/10 border-slate-400/30',
};

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Skeleton({ className }) {
  return <div className={`animate-pulse bg-white/10 rounded ${className}`} />;
}

function UserSearchSelect({ value, onChange, placeholder }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query) return setResults([]);
    const t = setTimeout(() => {
      fetch(`${API_BASE}/api/users/search?q=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(d => setResults(d.users || []));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="relative">
      {value ? (
        <div className="flex items-center justify-between input-field py-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{value.username}</span>
            <span className="text-xs text-slate-500">{value.cfHandle}</span>
          </div>
          <button onClick={() => onChange(null)} className="text-red-400 hover:text-red-300">✕</button>
        </div>
      ) : (
        <div>
          <input 
            className="input-field py-2" 
            placeholder={placeholder} 
            value={query} 
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
          />
          {open && results.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-bg-surface border border-white/10 rounded-xl shadow-lg max-h-40 overflow-y-auto">
              {results.map(u => (
                <div 
                  key={u._id} 
                  onClick={() => { onChange(u); setQuery(''); setOpen(false); }}
                  className="p-2 hover:bg-white/5 cursor-pointer text-sm flex items-center justify-between"
                >
                  <span className="font-semibold">{u.username}</span>
                  <span className="text-xs text-slate-500">{u.cfHandle}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ContestForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    cfContestId: initial?.cfContestId || '',
    startTime: initial?.startTime ? new Date(initial.startTime).toISOString().slice(0, 16) : '',
    endTime: initial?.endTime ? new Date(initial.endTime).toISOString().slice(0, 16) : '',
    difficulty: initial?.difficulty || 'Div. 2',
    isWingContest: initial?.isWingContest || false,
    topPerformers: initial?.topPerformers || [null, null, null],
  });
  const [fetching, setFetching] = useState(false);

  const autofillCF = async () => {
    if (!form.cfContestId) return;
    setFetching(true);
    try {
      const r = await fetch(`https://codeforces.com/api/contest.list`);
      const d = await r.json();
      const contest = d.result?.find(c => String(c.id) === String(form.cfContestId));
      if (contest) {
        const start = new Date(contest.startTimeSeconds * 1000);
        const end = new Date((contest.startTimeSeconds + contest.durationSeconds) * 1000);
        setForm(f => ({
          ...f,
          title: contest.name || f.title,
          startTime: start.toISOString().slice(0, 16),
          endTime: end.toISOString().slice(0, 16),
        }));
      }
    } catch {}
    setFetching(false);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-slate-100 mb-5">{initial ? 'Edit Contest' : 'Create Contest'}</h2>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">CF Contest ID</label>
              <input className="input-field" placeholder="e.g. 2050" value={form.cfContestId} onChange={e => set('cfContestId', e.target.value)} />
            </div>
            <button onClick={autofillCF} disabled={fetching || !form.cfContestId} className="btn-ghost self-end px-3 py-2 text-xs whitespace-nowrap disabled:opacity-40">
              {fetching ? '…' : 'Auto-fill ↗'}
            </button>
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Title *</label>
            <input className="input-field" placeholder="Codeforces Round 999" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Description</label>
            <textarea className="input-field resize-none" rows={2} placeholder="Brief description…" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Difficulty</label>
            <select className="input-field" value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
              {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Start Time</label>
              <input type="datetime-local" className="input-field" value={form.startTime} onChange={e => set('startTime', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">End Time</label>
              <input type="datetime-local" className="input-field" value={form.endTime} onChange={e => set('endTime', e.target.value)} />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isWingContest} onChange={e => set('isWingContest', e.target.checked)} className="w-4 h-4 accent-amber-500" />
              <span className="text-sm font-semibold text-amber-500">🏆 CP Wing Contest</span>
            </label>
            {form.isWingContest && (
              <div className="mt-3 flex flex-col gap-2">
                <p className="text-xs text-slate-400 mb-1">Select the top 3 performers from the platform to award medals.</p>
                <UserSearchSelect 
                  value={form.topPerformers[0]} 
                  onChange={u => set('topPerformers', [u, form.topPerformers[1], form.topPerformers[2]])} 
                  placeholder="🥇 1st Place Username" 
                />
                <UserSearchSelect 
                  value={form.topPerformers[1]} 
                  onChange={u => set('topPerformers', [form.topPerformers[0], u, form.topPerformers[2]])} 
                  placeholder="🥈 2nd Place Username" 
                />
                <UserSearchSelect 
                  value={form.topPerformers[2]} 
                  onChange={u => set('topPerformers', [form.topPerformers[0], form.topPerformers[1], u])} 
                  placeholder="🥉 3rd Place Username" 
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-2">
            <button onClick={onCancel} className="btn-ghost flex-1">Cancel</button>
            <button 
              onClick={() => {
                const submitForm = { ...form };
                if (submitForm.isWingContest) {
                  submitForm.topPerformers = submitForm.topPerformers.map(u => u?._id || u).filter(Boolean);
                } else {
                  submitForm.topPerformers = [];
                }
                onSubmit(submitForm);
              }} 
              disabled={loading || !form.title} 
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {loading ? 'Saving…' : (initial ? 'Save Changes' : 'Create')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkPostModal({ contestId, onClose, onLinked, currentUser }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/posts`, { credentials: 'include' }).then(r => r.ok ? r.json() : { posts: [] }),
      fetch(`${API_BASE}/api/editorials`, { credentials: 'include' }).then(r => r.ok ? r.json() : { posts: [] }),
    ]).then(([p, e]) => {
      const all = [...(p.posts || []), ...(e.posts || [])];
      setPosts(all);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = posts.filter(p =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase())
  );

  const link = async (postId) => {
    setLinking(postId);
    try {
      const r = await fetch(`${API_BASE}/api/contests/${contestId}/link-post`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });
      if (r.ok) onLinked();
    } catch {}
    setLinking(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card p-5 w-full max-w-md max-h-[80vh] flex flex-col">
        <h2 className="text-base font-bold text-slate-100 mb-3">Link a Post / Editorial</h2>
        <input className="input-field mb-3" placeholder="Search posts…" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="overflow-y-auto flex flex-col gap-2 flex-1">
          {loading ? <Skeleton className="h-10 w-full" /> : filtered.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No posts found.</p>
          ) : filtered.map(p => (
            <div key={p._id} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] hover:border-accent/30 transition-all">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">{p.title}</p>
                <p className="text-xs text-slate-500">{p.isEditorial ? '⭐ Editorial' : `📝 ${p.category}`}</p>
              </div>
              <button
                onClick={() => link(p._id)}
                disabled={linking === p._id}
                className="btn-primary text-xs px-3 py-1.5 flex-shrink-0 disabled:opacity-50"
              >
                {linking === p._id ? '…' : 'Link'}
              </button>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="btn-ghost mt-3 w-full">Close</button>
      </div>
    </div>
  );
}

function ContestChat({ contestId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useState(null);

  const fetchMsgs = useCallback(() => {
    fetch(`${API_BASE}/api/contests/${contestId}/chat`)
      .then(r => r.ok ? r.json() : { messages: [] })
      .then(d => setMessages(d.messages || []));
  }, [contestId]);

  useEffect(() => {
    fetchMsgs();
    const t = setInterval(fetchMsgs, 3000);
    return () => clearInterval(t);
  }, [fetchMsgs]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const txt = input;
    setInput('');
    // Optimistic UI could be added here
    await fetch(`${API_BASE}/api/contests/${contestId}/chat`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: txt })
    });
    fetchMsgs();
  };

  return (
    <div className="flex flex-col h-[400px]">
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-2 bg-black/20 rounded-xl border border-white/5 mb-3">
        {messages.length === 0 ? (
          <div className="m-auto text-slate-500 text-sm">No messages yet. Say hi!</div>
        ) : (
          messages.map(m => {
            const isMe = currentUser?._id === m.author?._id || currentUser?.username === m.author?.username;
            return (
              <div key={m._id} className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                <span className="text-[10px] text-slate-500 mb-0.5 px-1">{m.author?.username}</span>
                <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-accent text-white rounded-br-sm' : 'bg-bg-surface border border-white/10 text-slate-200 rounded-bl-sm'}`}>
                  {m.text}
                </div>
              </div>
            );
          })
        )}
      </div>
      {currentUser ? (
        <form onSubmit={send} className="flex gap-2">
          <input className="input-field py-2" placeholder="Send a message…" value={input} onChange={e => setInput(e.target.value)} />
          <button type="submit" disabled={!input.trim()} className="btn-primary px-4">Send</button>
        </form>
      ) : (
        <div className="text-center text-sm text-slate-500 p-2 bg-white/5 rounded-xl border border-white/5">
          Please log in to chat.
        </div>
      )}
    </div>
  );
}

function ContestDetail({ contest, currentUser, isAdmin, onUnlink, onLinkPost }) {
  const [tab, setTab] = useState('posts');
  const items = tab === 'posts' ? (contest.linkedPosts || []) : (contest.linkedEditorials || []);

  return (
    <div className="card p-5 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${DIFF_COLOR[contest.difficulty] || DIFF_COLOR['Other']}`}>
              {contest.difficulty}
            </span>
            {contest.cfContestId && (
              <div className="flex items-center gap-3">
                <a
                  href={`https://codeforces.com/contest/${contest.cfContestId}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs font-mono text-accent hover:underline"
                >
                  CF #{contest.cfContestId} ↗
                </a>
                <a
                  href={`https://codeforces.com/contest/${contest.cfContestId}/standings`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs font-mono text-emerald-400 hover:underline"
                >
                  Standings ↗
                </a>
              </div>
            )}
          </div>
          <h2 className="text-lg font-bold text-slate-100 leading-snug">{contest.title}</h2>
          {contest.description && <p className="text-sm text-slate-400 mt-1">{contest.description}</p>}
        </div>
      </div>

      {/* Time info */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-bg-surface rounded-xl p-3 border border-white/[0.06]">
          <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Start</p>
          <p className="text-xs font-semibold text-slate-300">{fmt(contest.startTime)}</p>
        </div>
        <div className="bg-bg-surface rounded-xl p-3 border border-white/[0.06]">
          <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">End</p>
          <p className="text-xs font-semibold text-slate-300">{fmt(contest.endTime)}</p>
        </div>
      </div>

      {/* Top Performers Section */}
      {contest.isWingContest && contest.topPerformers?.length > 0 && (
        <div className="mb-4 bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl p-4">
          <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            🏆 Top Performers
          </h3>
          <div className="flex flex-col gap-2">
            {contest.topPerformers.map((u, idx) => {
              if (!u) return null;
              const medals = ['🥇', '🥈', '🥉'];
              const colors = ['text-yellow-400', 'text-slate-300', 'text-amber-600'];
              return (
                <div key={u._id || idx} className="flex items-center gap-3 bg-black/20 p-2 rounded-lg border border-white/5">
                  <span className={`text-lg ${colors[idx]}`}>{medals[idx]}</span>
                  <div className="flex items-center gap-2">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white">
                        {(u.username || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <a href={`/profile/${u.username}`} className="text-sm font-semibold text-slate-200 hover:text-accent transition-colors">
                      {u.username}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Link posts button (all auth users) */}
      {currentUser && (
        <button
          onClick={onLinkPost}
          className="btn-ghost w-full flex items-center justify-center gap-2 mb-4 text-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          Link a Post / Editorial
        </button>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-bg-surface rounded-xl border border-white/[0.07] mb-4 overflow-x-auto">
        {[
          ['posts', '📝 Posts', contest.linkedPosts?.length], 
          ['editorials', '⭐ Editorials', contest.linkedEditorials?.length],
          ['chat', '💬 Chat', null]
        ].map(([k, label, cnt]) => (
          <button key={k} onClick={() => setTab(k)} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${tab === k ? 'bg-accent text-white shadow-btn' : 'text-slate-400 hover:text-slate-200'}`}>
            {label} {cnt !== null && <span className={`text-[10px] px-1 rounded-full ${tab === k ? 'bg-white/20' : 'bg-white/10 text-slate-500'}`}>{cnt ?? 0}</span>}
          </button>
        ))}
      </div>

      {/* Item list */}
      {tab === 'chat' ? (
        <ContestChat contestId={contest._id} currentUser={currentUser} />
      ) : items.length === 0 ? (
        <div className="py-8 text-center text-slate-600 text-sm">No {tab} linked yet.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map(p => (
            <div key={p._id} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] hover:border-white/10 transition-all group">
              <div className="flex-1 min-w-0">
                <a href={p.isEditorial ? `/editorials?id=${p._id}` : `/?post=${p._id}`} className="text-sm font-semibold text-slate-200 hover:text-accent transition-colors line-clamp-1 block">
                  {p.title}
                </a>
                <p className="text-xs text-slate-500">by {p.author?.username}</p>
              </div>
              {isAdmin && (
                <button onClick={() => onUnlink(p._id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all p-1" title="Unlink">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ContestsPage() {
  const [contests, setContests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const isAdmin = !!currentUser;

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/verify`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.isAuthenticated) setCurrentUser(d.user); })
      .catch(() => {});
  }, []);

  const fetchContests = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/contests`)
      .then(r => r.ok ? r.json() : { contests: [] })
      .then(d => { setContests(d.contests || []); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(fetchContests, []);

  const loadDetail = async (contest) => {
    setSelected(contest);
    setDetailLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/contests/${contest._id}`);
      if (r.ok) { const d = await r.json(); setSelected(d.contest); }
    } catch {}
    setDetailLoading(false);
  };

  const handleFormSubmit = async (form) => {
    setFormLoading(true);
    try {
      const url = editTarget ? `${API_BASE}/api/contests/${editTarget._id}` : `${API_BASE}/api/contests`;
      const method = editTarget ? 'PUT' : 'POST';
      const r = await fetch(url, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (r.ok) {
        setShowForm(false);
        setEditTarget(null);
        fetchContests();
        if (selected?._id === editTarget?._id) {
          const d = await r.json();
          setSelected(d.contest);
        }
      }
    } catch {}
    setFormLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contest?')) return;
    await fetch(`${API_BASE}/api/contests/${id}`, { method: 'DELETE', credentials: 'include' });
    if (selected?._id === id) setSelected(null);
    fetchContests();
  };

  const handleUnlink = async (postId) => {
    if (!selected) return;
    await fetch(`${API_BASE}/api/contests/${selected._id}/unlink-post`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId }),
    });
    loadDetail(selected);
  };

  const handleLinked = () => {
    setShowLinkModal(false);
    if (selected) loadDetail(selected);
  };

  const ContestCard = ({ c }) => {
    const isSelected = selected?._id === c._id;
    const now = Date.now();
    const start = c.startTime ? new Date(c.startTime).getTime() : null;
    const end = c.endTime ? new Date(c.endTime).getTime() : null;
    const status = !start ? 'tbd' : now < start ? 'upcoming' : end && now < end ? 'live' : 'ended';
    const statusStyle = { live: 'text-emerald-400', upcoming: 'text-blue-400', ended: 'text-slate-500', tbd: 'text-slate-600' };

    return (
      <div
        onClick={() => loadDetail(c)}
        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5
          ${isSelected ? 'border-accent/50 bg-accent/5 shadow-btn' : 'border-white/[0.07] hover:border-accent/30 bg-bg-card'}`}
      >
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${DIFF_COLOR[c.difficulty] || DIFF_COLOR['Other']}`}>
            {c.difficulty}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${statusStyle[status]}`}>
            {status === 'live' && '● '}{status}
          </span>
          <span className="text-[10px] text-slate-600 ml-auto">
            {(c.linkedPosts?.length || 0) + (c.linkedEditorials?.length || 0)} linked
          </span>
        </div>
        <h3 className="text-sm font-bold text-slate-100 leading-snug line-clamp-2">{c.title}</h3>
        {c.startTime && <p className="text-[11px] text-slate-500 mt-1.5">{fmt(c.startTime)}</p>}

        {isAdmin && (
          <div className="flex gap-1 mt-2" onClick={e => e.stopPropagation()}>
            <button onClick={() => { setEditTarget(c); setShowForm(true); }} className="text-xs text-slate-400 hover:text-accent transition-colors px-2 py-1 rounded hover:bg-accent/10">Edit</button>
            <button onClick={() => handleDelete(c._id)} className="text-xs text-slate-400 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-400/10">Delete</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-bg-deep">
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 50% at 20% 0%, rgba(99,120,255,0.1) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(167,139,250,0.08) 0%, transparent 60%)' }} />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] backdrop-blur-xl bg-bg-deep/80">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-violet flex items-center justify-center text-sm font-extrabold text-white shadow-btn">R</div>
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white to-accent-violet bg-clip-text text-transparent">RankUp</span>
          </a>
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <a href="/" className="hover:text-slate-200 transition-colors">Hub</a>
            <span>/</span>
            <span className="text-slate-300">Contests</span>
          </div>
          <div className="ml-auto flex items-center gap-2">

            {!currentUser && <a href="/auth" className="btn-primary text-sm px-4 py-2">Login</a>}
            {currentUser && (
              <a href={`/profile/${currentUser.username}`} className="text-sm text-slate-400 hover:text-slate-200 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                {currentUser.username}
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Page title + admin create */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100">🏆 Contests Hub</h1>
            <p className="text-slate-500 text-sm mt-1">Admin-organized Codeforces contests. Link your posts and editorials.</p>
          </div>
          {isAdmin && (
            <button onClick={() => { setEditTarget(null); setShowForm(true); }} className="btn-primary flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Contest
            </button>
          )}
        </div>

        <div className="flex gap-6" style={{ minHeight: '60vh' }}>
          {/* Contest list */}
          <div className="w-80 flex-shrink-0 flex flex-col gap-3">
            {loading ? (
              [1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
            ) : contests.length === 0 ? (
              <div className="card p-8 text-center">
                <div className="text-4xl mb-3">🏆</div>
                <p className="text-slate-500 text-sm">{isAdmin ? 'No contests yet. Create one!' : 'No contests yet.'}</p>
              </div>
            ) : (
              contests.map(c => <ContestCard key={c._id} c={c} />)
            )}
          </div>

          {/* Detail panel */}
          <div className="flex-1 min-w-0">
            {!selected ? (
              <div className="card p-12 h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl mb-4">👈</div>
                  <p className="text-slate-400 font-semibold">Select a contest</p>
                  <p className="text-slate-600 text-sm mt-1">Click any contest to view details and linked posts.</p>
                </div>
              </div>
            ) : detailLoading ? (
              <div className="card p-6">
                <Skeleton className="h-6 w-48 mb-3" />
                <Skeleton className="h-4 w-32 mb-5" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <ContestDetail
                contest={selected}
                currentUser={currentUser}
                isAdmin={isAdmin}
                onUnlink={handleUnlink}
                onLinkPost={() => setShowLinkModal(true)}
              />
            )}
          </div>
        </div>
      </main>

      {showForm && (
        <ContestForm
          initial={editTarget}
          onSubmit={handleFormSubmit}
          onCancel={() => { setShowForm(false); setEditTarget(null); }}
          loading={formLoading}
        />
      )}

      {showLinkModal && selected && (
        <LinkPostModal
          contestId={selected._id}
          currentUser={currentUser}
          onClose={() => setShowLinkModal(false)}
          onLinked={handleLinked}
        />
      )}
    </div>
  );
}
