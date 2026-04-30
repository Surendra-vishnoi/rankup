import { useState, useEffect } from 'react';
import MarkdownRenderer from '../components/MarkdownRenderer.jsx';
import { cfRankColor } from '../utils/cfRank.js';
import { API_BASE } from '../apiConfig';
import MentionsTextarea from '../components/MentionsTextarea';
import GlobalSearch from '../components/GlobalSearch';
import NotificationBell from '../components/NotificationBell';

const CATEGORY_META = {
  Insight: { label: 'Insight', emoji: '💡', color: 'text-yellow-400', border: 'border-yellow-500/40', bg: 'bg-yellow-400/10' },
  Doubt:   { label: 'Doubt',   emoji: '🐛', color: 'text-red-400',    border: 'border-red-500/40',    bg: 'bg-red-400/10' },
  General: { label: 'General', emoji: '☕', color: 'text-emerald-400',border: 'border-emerald-500/40',bg: 'bg-emerald-400/10' },
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return `${Math.floor(diff)}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

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

export default function PostPage() {
  const pathParts = window.location.pathname.split('/');
  const postId = pathParts[pathParts.length - 1];
  const isEditorialRoute = window.location.pathname.startsWith('/editorial/');

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // Fetch session
  useEffect(() => {
    fetch(`${API_BASE}/api/auth/verify`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.isAuthenticated) setCurrentUser(d.user); })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
      window.location.href = '/';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Fetch post or editorial
  useEffect(() => {
    if (!postId) return;
    const endpoint = isEditorialRoute ? `/api/editorials/${postId}` : `/api/posts/${postId}`;
    
    fetch(`${API_BASE}${endpoint}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        setPost(data.post);
        setLoading(false);
      })
      .catch(status => {
        setError(status === 404 ? 'Content not found.' : 'Failed to load content.');
        setLoading(false);
      });
  }, [postId, isEditorialRoute]);

  // Fetch comments
  useEffect(() => {
    if (!post?._id) return;
    fetchComments(1);
  }, [post?._id]);

  const fetchComments = async (pageNumber) => {
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post._id}/comments?page=${pageNumber}`);
      if (res.ok) {
        const data = await res.json();
        if (pageNumber === 1) {
          setComments(data.comments);
        } else {
          setComments(prev => [...prev, ...data.comments]);
        }
        setHasMore(pageNumber < data.pages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || loadingComments || !currentUser) return;
    setLoadingComments(true);
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
        credentials: 'include'
      });
      if (res.ok) {
        const body = await res.json();
        setComments(prev => [body.comment, ...prev]);
        setNewComment('');
      } else {
        alert("Action failed. Please make sure you are logged in.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setComments(prev => prev.filter(c => c._id !== commentId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("DESTROY POST: Are you absolutely sure?")) return;
    try {
      const endpoint = post.isEditorial ? `/api/editorials/${post._id}` : `/api/posts/${post._id}`;
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        window.location.href = post.isEditorial ? '/editorials' : '/';
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-deep flex justify-center p-8">
        <div className="animate-pulse w-full max-w-3xl flex flex-col gap-4">
          <div className="h-8 bg-white/10 rounded w-1/3" />
          <div className="h-64 bg-white/5 rounded w-full mt-4" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-bg-deep flex items-center justify-center">
        <div className="card p-8 text-center max-w-sm">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">Not Found</h2>
          <p className="text-slate-500 text-sm mb-4">{error}</p>
          <button onClick={() => window.history.back()} className="btn-primary text-sm">Go Back</button>
        </div>
      </div>
    );
  }

  const cat       = CATEGORY_META[post.category] || CATEGORY_META.General;
  const rank      = post.author?.rank || '';
  const rankColor = cfRankColor(rank);
  const isWing    = post.author?.isWingMember === true;
  const isCoordinator = post.author?.isCoordinator === true;

  const hints     = post.hints?.length ? post.hints
                      : post.hint ? [post.hint]
                      : [];

  return (
    <div className="min-h-screen bg-bg-deep flex flex-col">
      {/* Background mesh */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 50% at 20% 0%, rgba(99,120,255,0.1) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(167,139,250,0.08) 0%, transparent 60%)'
        }} />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] backdrop-blur-xl bg-bg-deep/80">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 flex-shrink-0" aria-label="RankUp Home">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-violet flex items-center justify-center text-sm font-extrabold text-white shadow-btn">R</div>
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white to-accent-violet bg-clip-text text-transparent">RankUp</span>
          </a>
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <a href="/" className="hover:text-slate-200 transition-colors">Hub</a>
            <span>/</span>
            <span className="text-slate-300">{post.isEditorial ? 'Editorial' : 'Post'}</span>
          </div>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-2">
            {currentUser && <NotificationBell />}

            <a href="/contests" className="text-slate-400 hover:text-slate-200 text-sm px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-1.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
              Contests
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
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <button onClick={() => window.history.back()} className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <article className="card flex flex-col mb-8 overflow-hidden shadow-xl border border-white/10">
          {/* Header */}
          <div className="flex flex-col gap-3 p-6 border-b border-white/[0.07] bg-white/[0.01]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${cat.bg} ${cat.border} ${cat.color}`}>
                  {cat.emoji} {cat.label}
                </span>
                {post.isEditorial && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400">
                    ⭐ Editorial
                  </span>
                )}
                {isCoordinator ? (
                  <span className="badge-coordinator text-[10px] uppercase tracking-tighter">
                    Coordinator
                  </span>
                ) : isWing && (
                  <span className="badge-wing">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 16L3 6l5.5 4L12 4l3.5 6L21 6l-2 10H5zm0 2h14v2H5v-2z"/>
                    </svg>
                    Wing Member
                  </span>
                )}
                {(post.cfProblemId || post.questionNumber) && (
                  <a
                    href={(post.cfProblemId || post.questionNumber).startsWith('http')
                      ? (post.cfProblemId || post.questionNumber)
                      : `https://codeforces.com/problemset/problem/${(post.cfProblemId || post.questionNumber).replace(/([A-Za-z])/, '/$1')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-md bg-accent-cf/10 border border-accent-cf/30 text-accent-cf hover:bg-accent-cf/20 transition-colors"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                    </svg>
                    CF {(post.cfProblemId || post.questionNumber).startsWith('http')
                      ? ((post.cfProblemId || post.questionNumber).split('/').filter(Boolean).pop() || 'Link')
                      : (post.cfProblemId || post.questionNumber)}
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-end justify-between gap-4 mt-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 leading-snug">
                {post.title}
              </h1>
            </div>
            <div className="flex items-center gap-3 text-slate-500 text-sm mt-2">
              {post.createdAt && (
                <span>{timeAgo(post.createdAt)}</span>
              )}
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                  <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                </svg>
                {post.upvotes?.length ?? 0} upvotes
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {post.isEditorial ? (
              <div className="flex flex-col gap-6">
                {/* Hints */}
                {hints.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-500/50 px-1 mb-0.5">
                      Progressive Hints
                    </p>
                    {hints.map((h, i) => <HintRow key={i} index={i} text={h} />)}
                  </div>
                )}
                {/* Solution */}
                {post.solution && <SolutionSection solution={post.solution} />}
              </div>
            ) : (
              <MarkdownRenderer>{post.content}</MarkdownRenderer>
            )}
          </div>

          {/* Footer (Author Info & Admin Actions) */}
          <div className="px-6 py-4 bg-white/[0.02] flex items-center justify-between border-y border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-lg
                ${isWing ? 'bg-gradient-to-br from-yellow-500 to-amber-600 shadow-yellow-500/20' : 'bg-gradient-to-br from-accent to-accent-violet'}`}
              >
                {(post.author?.username || '?')[0].toUpperCase()}
              </div>
              <div className="flex flex-col">
                <a href={`/profile/${post.author?.username || ''}`} className="text-sm font-semibold text-slate-200 hover:text-accent transition-colors">{post.author?.username || 'Anonymous'}</a>
                <div className="flex items-center gap-2">
                  {post.author?.cfHandle && (
                    <span className="text-xs text-accent">@{post.author.cfHandle}</span>
                  )}
                  {post.author?.customTitle ? (
                    <span className="text-[10px] font-bold text-slate-300 mt-0.5 tracking-wide px-1.5 py-0.5 border border-white/10 rounded">
                      {post.author.customTitle}
                    </span>
                  ) : rank && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize"
                      style={{ color: rankColor, background: `${rankColor}18`, border: `1px solid ${rankColor}40` }}>
                      {rank.replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Admin Delete Button */}
            {currentUser?.isAdmin && (
              <button onClick={handleDeletePost} className="px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/30 text-xs font-bold transition-all flex items-center gap-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
                Delete
              </button>
            )}
          </div>

          {/* Comment Dock */}
          <div className="px-6 py-5 bg-bg-deep rounded-b-xl flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-200">Discussion</h3>
            </div>

            <div className="flex flex-col gap-4 animate-fade-in">
              {/* New Comment Input */}
              {currentUser ? (
                <div className="flex gap-3">
                  <div className="relative w-full">
                    <MentionsTextarea 
                      value={newComment}
                      onChange={setNewComment}
                      placeholder="Add to the discussion..."
                      className="input-field w-full min-h-[80px] resize-y placeholder:text-slate-600 bg-bg-surface border-white/10 text-sm py-3 px-4 pr-16"
                    />
                    <button 
                      onClick={handleAddComment}
                      disabled={loadingComments || !newComment.trim()}
                      className="absolute bottom-2 right-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-light text-white font-semibold text-xs transition-colors shadow-btn disabled:opacity-50"
                    >
                      Post
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-bg-surface border border-white/5 text-center">
                  <p className="text-sm text-slate-400">Log in to join the discussion.</p>
                </div>
              )}

              {/* Comment List */}
              <div className="flex flex-col gap-4 mt-4">
                {comments.length === 0 ? (
                  <p className="text-sm text-slate-500 italic text-center py-6">No comments yet. Be the first!</p>
                ) : (
                  comments.map(c => {
                    const cRank = c.author?.rank || '';
                    const cColor = cfRankColor(cRank);
                    const canDelete = currentUser && (currentUser.isAdmin || currentUser._id === c.author?._id);
                    
                    return (
                      <div key={c._id} className="group relative flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5">
                          {(c.author?.username || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 flex flex-col gap-1 p-4 rounded-xl bg-bg-surface border border-white/[0.05]">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <a href={`/profile/${c.author?.username || ''}`} className="text-sm font-bold text-slate-200 hover:text-accent transition-colors">
                                {c.author?.username || 'Unknown'}
                              </a>
                              {c.author?.isWingMember && (
                                <svg className="w-3.5 h-3.5 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M5 16L3 6l5.5 4L12 4l3.5 6L21 6l-2 10H5z"/>
                                </svg>
                              )}
                              <span className="text-[10px] uppercase font-semibold" style={{ color: cColor }}>
                                {cRank.split(' ')[0]}
                              </span>
                              <span className="text-[11px] text-slate-500 ml-1">{timeAgo(c.createdAt)}</span>
                            </div>
                            {canDelete && (
                              <button 
                                onClick={() => handleDeleteComment(c._id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 transition-all rounded hover:bg-red-400/10"
                                title="Delete Comment"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{c.content}</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {hasMore && (
                <button 
                  onClick={() => {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchComments(nextPage);
                  }}
                  className="w-full py-3 mt-4 text-sm font-semibold text-slate-300 hover:text-white bg-bg-surface hover:bg-white/5 border border-white/10 rounded-xl transition-colors"
                >
                  Load More Comments
                </button>
              )}
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
