import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../apiConfig';
import GlobalSearch from '../components/GlobalSearch';
import NotificationBell from '../components/NotificationBell';
import MentionsTextarea from '../components/MentionsTextarea';

const ADMIN = 'Surendra_vishnoi';

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
    contestLink: initial?.contestLink || '',
    standingsLink: initial?.standingsLink || '',
    isWingContest: initial?.isWingContest || false,
    topPerformers: initial?.topPerformers || [null, null, null],
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <h2 className="text-xl font-bold text-slate-100 mb-6">{initial ? 'Edit Contest' : 'Create Contest'}</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Title *</label>
            <input className="input-field py-2.5" placeholder="e.g. Codeforces Round 999" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Description</label>
            <textarea className="input-field resize-y min-h-[80px]" placeholder="Brief description…" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Contest Link</label>
              <input className="input-field py-2.5" placeholder="https://..." value={form.contestLink} onChange={e => set('contestLink', e.target.value)} />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Standings Link</label>
              <input className="input-field py-2.5" placeholder="https://..." value={form.standingsLink} onChange={e => set('standingsLink', e.target.value)} />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] mt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.isWingContest} onChange={e => set('isWingContest', e.target.checked)} className="w-5 h-5 accent-amber-500 rounded" />
              <span className="text-sm font-bold text-amber-500">🏆 CP Wing Contest</span>
            </label>
            {form.isWingContest && (
              <div className="mt-4 flex flex-col gap-3">
                <p className="text-xs text-slate-400 mb-1">Select the top 3 performers to award medals.</p>
                <UserSearchSelect value={form.topPerformers[0]} onChange={u => set('topPerformers', [u, form.topPerformers[1], form.topPerformers[2]])} placeholder="🥇 1st Place Username" />
                <UserSearchSelect value={form.topPerformers[1]} onChange={u => set('topPerformers', [form.topPerformers[0], u, form.topPerformers[2]])} placeholder="🥈 2nd Place Username" />
                <UserSearchSelect value={form.topPerformers[2]} onChange={u => set('topPerformers', [form.topPerformers[0], form.topPerformers[1], u])} placeholder="🥉 3rd Place Username" />
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-4 pt-4 border-t border-white/5">
            <button onClick={onCancel} className="btn-ghost flex-1 py-2.5 font-bold">Cancel</button>
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
              className="btn-primary flex-1 py-2.5 font-bold disabled:opacity-50"
            >
              {loading ? 'Saving…' : (initial ? 'Save Changes' : 'Create Contest')}
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card p-6 w-full max-w-md max-h-[80vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <h2 className="text-lg font-bold text-slate-100 mb-4">Link a Post / Editorial</h2>
        <input className="input-field mb-4 py-2.5" placeholder="Search by title…" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="overflow-y-auto flex flex-col gap-2 flex-1 custom-scrollbar pr-1">
          {loading ? <Skeleton className="h-12 w-full" /> : filtered.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No posts found.</p>
          ) : filtered.map(p => (
            <div key={p._id} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] hover:border-accent/30 bg-bg-surface hover:bg-white/[0.04] transition-all">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">{p.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{p.isEditorial ? '⭐ Editorial' : `📝 ${p.category}`}</p>
              </div>
              <button
                onClick={() => link(p._id)}
                disabled={linking === p._id}
                className="btn-primary text-xs px-4 py-2 flex-shrink-0 disabled:opacity-50"
              >
                {linking === p._id ? '…' : 'Link'}
              </button>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="btn-ghost mt-4 w-full py-2.5 font-bold">Close</button>
      </div>
    </div>
  );
}

function ContestDiscussion({ contestId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

  const fetchMsgs = useCallback(() => {
    fetch(`${API_BASE}/api/contests/${contestId}/chat`)
      .then(r => r.ok ? r.json() : { messages: [] })
      .then(d => setMessages(d.messages || []));
  }, [contestId]);

  useEffect(() => {
    fetchMsgs();
    const t = setInterval(fetchMsgs, 5000);
    return () => clearInterval(t);
  }, [fetchMsgs]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const txt = input;
    const parent = replyingTo?._id;
    setInput('');
    setReplyingTo(null);
    await fetch(`${API_BASE}/api/contests/${contestId}/chat`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: txt, parentMessage: parent || null })
    });
    fetchMsgs();
  };

  const msgMap = {};
  messages.forEach(m => msgMap[m._id] = { ...m, children: [] });
  const rootMsgs = [];
  messages.forEach(m => {
    if (m.parentMessage && msgMap[m.parentMessage]) {
      msgMap[m.parentMessage].children.push(msgMap[m._id]);
    } else {
      rootMsgs.push(msgMap[m._id]);
    }
  });

  const renderMessage = (msg, depth = 0) => {
    const isMe = currentUser?._id === msg.author?._id || currentUser?.username === msg.author?.username;
    return (
      <div key={msg._id} className={`flex flex-col gap-1.5 mt-4 ${depth > 0 ? 'ml-3 sm:ml-6 pl-3 sm:pl-4 border-l border-white/[0.08]' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0">
            {(msg.author?.username || '?')[0].toUpperCase()}
          </div>
          <span className={`text-xs font-bold ${isMe ? 'text-accent-light' : 'text-slate-300'}`}>{msg.author?.username}</span>
          <span className="text-[10px] font-medium text-slate-500">{new Date(msg.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="text-sm text-slate-200 bg-white/[0.03] p-3 rounded-xl border border-white/[0.04] leading-relaxed">
          {msg.text}
        </div>
        <div className="flex items-center gap-3 mt-1 px-1">
          <button onClick={() => setReplyingTo(msg)} className="text-[11px] font-bold text-slate-500 hover:text-slate-200 transition-colors uppercase tracking-wider flex items-center gap-1">
             <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 10 20 15 15 20"/><path d="M4 4v7a4 4 0 0 0 4 4h12"/></svg>
             Reply
          </button>
        </div>
        {msg.children.map(child => renderMessage(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto flex flex-col p-4 bg-bg-surface rounded-xl border border-white/[0.05] mb-4 custom-scrollbar">
        {rootMsgs.length === 0 ? (
          <div className="m-auto text-center">
            <div className="text-3xl mb-2">💬</div>
            <div className="text-slate-500 text-sm font-semibold">No discussions yet. Start one!</div>
          </div>
        ) : (
          rootMsgs.map(m => renderMessage(m, 0))
        )}
      </div>
      {currentUser ? (
        <form onSubmit={send} className="flex flex-col gap-2">
          {replyingTo && (
            <div className="flex items-center justify-between bg-accent/10 text-accent px-4 py-2 rounded-xl text-xs font-bold border border-accent/20 animate-fade-in">
              <span>Replying to @{replyingTo.author?.username}</span>
              <button type="button" onClick={() => setReplyingTo(null)} className="hover:text-white p-1">✕</button>
            </div>
          )}
          <div className="flex gap-2">
            <MentionsTextarea 
              className="input-field py-3 px-4 shadow-inner-dark flex-1 resize-none h-[46px]" 
              placeholder="Share your thoughts…" 
              value={input} 
              onChange={setInput} 
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(e)}
              rows={1}
            />
            <button type="submit" disabled={!input.trim()} className="btn-primary px-6 shadow-btn font-bold">Post</button>
          </div>
        </form>
      ) : (
        <div className="text-center text-sm font-semibold text-slate-500 p-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
          Please log in to participate in the discussion.
        </div>
      )}
    </div>
  );
}

function ContestDetailModal({ contest, currentUser, isAdmin, onClose, onUnlink, onLinkPost, onEdit, onDelete }) {
  const [tab, setTab] = useState('posts');
  const items = tab === 'posts' ? (contest.linkedPosts || []) : (contest.linkedEditorials || []);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto pt-10 pb-10" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card w-full max-w-3xl flex flex-col bg-bg-deep border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative my-auto animate-fade-up max-h-[90vh]">
        
        {/* Header section with sticky top */}
        <div className="sticky top-0 z-10 bg-bg-deep/95 backdrop-blur-md border-b border-white/[0.06] p-6 rounded-t-2xl">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 leading-tight tracking-tight mb-2">{contest.title}</h2>
              {contest.description && <p className="text-sm text-slate-400 font-medium">{contest.description}</p>}
            </div>
            <button onClick={onClose} className="p-2 -mr-2 -mt-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-full transition-colors flex-shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div className="flex items-center flex-wrap gap-3 mt-5">
            {contest.contestLink && (
              <a href={contest.contestLink} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs py-2 px-5 shadow-btn font-bold">
                Contest Link ↗
              </a>
            )}
            {contest.standingsLink && (
              <a href={contest.standingsLink} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs py-2 px-5 border border-white/10 hover:border-white/20 hover:bg-white/5 font-bold">
                Standings ↗
              </a>
            )}
            {isAdmin && (
               <div className="ml-auto flex gap-2">
                 <button onClick={() => onEdit(contest)} className="text-xs text-slate-400 hover:text-accent font-bold px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">Edit</button>
                 <button onClick={() => { if(window.confirm('Delete this contest?')) { onDelete(contest._id); onClose(); } }} className="text-xs text-slate-400 hover:text-red-400 font-bold px-3 py-1.5 rounded-lg hover:bg-red-400/10 transition-colors">Delete</button>
               </div>
            )}
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {/* Top Performers Section */}
          {contest.isWingContest && contest.topPerformers?.length > 0 && (
            <div className="mb-8 bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl p-5 shadow-gold">
              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="text-base">🏆</span> Top Performers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {contest.topPerformers.map((u, idx) => {
                  if (!u) return null;
                  const medals = ['🥇', '🥈', '🥉'];
                  const colors = ['text-yellow-400', 'text-slate-300', 'text-amber-600'];
                  return (
                    <div key={u._id || idx} className="flex items-center gap-3 bg-black/30 p-3 rounded-xl border border-white/5 shadow-inner-dark">
                      <span className={`text-2xl drop-shadow-md ${colors[idx]}`}>{medals[idx]}</span>
                      <div className="flex items-center gap-2 overflow-hidden">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover shadow-md" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white shadow-md">
                            {(u.username || '?')[0].toUpperCase()}
                          </div>
                        )}
                        <a href={`/profile/${u.username}`} className="text-sm font-bold text-slate-200 hover:text-accent transition-colors truncate">
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
              className="w-full flex items-center justify-center gap-2 mb-6 py-3.5 rounded-xl border border-dashed border-white/20 text-slate-400 hover:text-white hover:border-accent/40 hover:bg-accent/5 transition-all text-sm font-bold"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              Link a Post or Editorial
            </button>
          )}

          {/* Tabs */}
          <div className="flex gap-4 border-b border-white/10 mb-6 px-1">
            {[
              ['posts', '📝 Posts', contest.linkedPosts?.length], 
              ['editorials', '⭐ Editorials', contest.linkedEditorials?.length],
              ['discussion', '💬 Discussion', null]
            ].map(([k, label, cnt]) => (
              <button key={k} onClick={() => setTab(k)} className={`pb-3 text-sm font-bold transition-all whitespace-nowrap border-b-2 tracking-wide ${tab === k ? 'border-accent text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                {label} {cnt !== null && <span className={`text-[10px] ml-1.5 px-2 py-0.5 rounded-full ${tab === k ? 'bg-accent/20 text-accent' : 'bg-white/10 text-slate-500'}`}>{cnt ?? 0}</span>}
              </button>
            ))}
          </div>

          {/* Item list */}
          {tab === 'discussion' ? (
            <ContestDiscussion contestId={contest._id} currentUser={currentUser} />
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm font-semibold bg-bg-surface rounded-2xl border border-white/[0.05]">
              <div className="text-3xl mb-3 opacity-50">📂</div>
              No {tab} linked yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map(p => (
                <div key={p._id} className="flex flex-col p-5 rounded-2xl border border-white/[0.06] hover:border-accent/30 bg-bg-surface hover:bg-white/[0.04] transition-all duration-300 group relative">
                  <a href={p.isEditorial ? `/editorials?id=${p._id}` : `/?post=${p._id}`} className="text-sm font-bold text-slate-200 group-hover:text-accent transition-colors line-clamp-2 mb-3 pr-8 leading-snug">
                    {p.title}
                  </a>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-bg-deep border border-white/5 px-2.5 py-1 rounded-md">by {p.author?.username}</span>
                  </div>
                  {isAdmin && (
                    <button onClick={() => onUnlink(p._id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-red-400 hover:text-white hover:bg-red-500 transition-all p-1.5 rounded-lg bg-red-400/10" title="Unlink">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
      window.location.reload();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

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
    return (
      <div
        onClick={() => loadDetail(c)}
        className="p-6 rounded-2xl border border-white/[0.07] hover:border-accent/40 bg-bg-card hover:bg-bg-card2 transition-all duration-300 hover:-translate-y-1 hover:shadow-btn cursor-pointer flex flex-col h-full relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-colors pointer-events-none" />
        <h3 className="text-xl font-extrabold text-slate-100 leading-snug line-clamp-2 mb-3 relative z-10 group-hover:text-white tracking-tight">{c.title}</h3>
        {c.description && <p className="text-sm text-slate-400 font-medium line-clamp-2 mb-6 relative z-10 leading-relaxed">{c.description}</p>}
        
        <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4 relative z-10">
          <div className="flex gap-3">
             <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/[0.05]">
               {(c.linkedPosts?.length || 0) + (c.linkedEditorials?.length || 0)} Posts
             </span>
             {c.isWingContest && (
               <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md">
                 🏆 Wing
               </span>
             )}
          </div>
          <svg className="w-5 h-5 text-slate-600 group-hover:text-accent transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-bg-deep flex flex-col">
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 50% at 20% 0%, rgba(99,120,255,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(167,139,250,0.05) 0%, transparent 60%)' }} />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-white/[0.07] backdrop-blur-xl bg-bg-deep/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-5">
          <a href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-violet flex items-center justify-center text-sm font-extrabold text-white shadow-btn group-hover:scale-105 transition-transform">R</div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-accent-violet bg-clip-text text-transparent">RankUp</span>
          </a>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <a href="/" className="hover:text-slate-200 transition-colors">Hub</a>
            <span className="opacity-50">/</span>
            <span className="text-slate-200">Contests</span>
          </div>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-3">
            {currentUser && <NotificationBell />}
            {!currentUser && <a href="/auth" className="btn-primary text-sm px-5 py-2 font-bold shadow-btn">Login</a>}
            {currentUser?.isAdmin && (
              <a href="/admin" className="text-purple-400 hover:text-purple-300 text-sm px-3 py-1.5 rounded-lg hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 transition-all flex items-center gap-1.5 font-bold">
                🛡️ Admin
              </a>
            )}
            {currentUser && (
              <a href={`/profile/${currentUser.username}`} className="text-sm font-bold text-slate-400 hover:text-slate-100 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                {currentUser.username}
              </a>
            )}
            {currentUser && (
              <button
                onClick={handleLogout}
                className="text-red-400 hover:text-red-300 text-sm px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors flex items-center gap-1.5 font-bold"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-6 py-10">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight mb-2 flex items-center gap-3">
              🏆 Contests Hub
            </h1>
            <p className="text-slate-400 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
              Explore officially managed contests, discover top performers, and engage in detailed discussions.
            </p>
          </div>
          {isAdmin && (
            <button onClick={() => { setEditTarget(null); setShowForm(true); }} className="btn-primary flex items-center justify-center gap-2 text-sm px-6 py-3 shadow-btn font-bold rounded-xl whitespace-nowrap">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Contest
            </button>
          )}
        </div>

        {/* Full-width Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)
          ) : contests.length === 0 ? (
            <div className="col-span-full card p-16 text-center border-dashed border-white/20 bg-transparent shadow-none">
              <div className="text-5xl mb-4 opacity-50">🏆</div>
              <p className="text-slate-400 text-lg font-semibold">{isAdmin ? 'No contests have been added yet. Create the first one!' : 'No contests available at the moment.'}</p>
            </div>
          ) : (
            contests.map(c => <ContestCard key={c._id} c={c} />)
          )}
        </div>
      </main>

      {/* Modals */}
      {selected && (
        <ContestDetailModal
          contest={selected}
          currentUser={currentUser}
          isAdmin={isAdmin}
          onClose={() => setSelected(null)}
          onUnlink={handleUnlink}
          onLinkPost={() => setShowLinkModal(true)}
          onEdit={(c) => { setEditTarget(c); setShowForm(true); }}
          onDelete={handleDelete}
        />
      )}

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
