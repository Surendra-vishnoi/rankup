import { useState, useEffect } from 'react';
import MarkdownRenderer from './MarkdownRenderer.jsx';
import { cfRankColor } from '../utils/cfRank.js';
import { API_BASE } from '../apiConfig';

const CATEGORY_META = {
  Insight:   { label: 'Insight',   emoji: '💡', color: 'text-yellow-400',  border: 'border-yellow-500/40', bg: 'bg-yellow-400/10' },
  Doubt: { label: 'Doubt', emoji: '🐛', color: 'text-red-400',     border: 'border-red-500/40',    bg: 'bg-red-400/10'    },
  General:   { label: 'General',   emoji: '☕', color: 'text-emerald-400', border: 'border-emerald-500/40',bg: 'bg-emerald-400/10'},
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return `${Math.floor(diff)}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function PostViewModal({ post, onClose, currentUser }) {
  if (!post) return null;

  const cat       = CATEGORY_META[post.category] || CATEGORY_META.General;
  const rank      = post.author?.rank || '';
  const rankColor = cfRankColor(rank);
  const isWing    = post.author?.isWingMember === true;

  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    fetchComments(1);
  }, [post._id]);

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
      const res = await fetch(`${API_BASE}/api/posts/${post._id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        window.location.reload(); 
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-view-title"
    >
      <div className="card w-full max-w-2xl mb-10 animate-fade-up flex flex-col">

        {/* Header */}
        <div className="flex flex-col gap-3 p-6 border-b border-white/[0.07]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${cat.bg} ${cat.border} ${cat.color}`}>
                {cat.emoji} {cat.label}
              </span>
              {isWing && (
                <span className="badge-wing">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 16L3 6l5.5 4L12 4l3.5 6L21 6l-2 10H5zm0 2h14v2H5v-2z"/>
                  </svg>
                  Wing Member
                </span>
              )}
              {post.cfProblemId && (
                <a
                  href={`https://codeforces.com/problemset/problem/${post.cfProblemId.replace(/([A-Za-z])/, '/$1')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-md bg-accent-cf/10 border border-accent-cf/30 text-accent-cf hover:bg-accent-cf/20 transition-colors"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                  </svg>
                  CF {post.cfProblemId}
                </a>
              )}
            </div>
            <button onClick={onClose} className="flex-shrink-0 text-slate-500 hover:text-slate-200 transition-colors mt-1" aria-label="Close post">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div className="flex items-end justify-between gap-4">
            <h1 id="post-view-title" className="text-xl font-bold text-slate-100 leading-snug">
              {post.title}
            </h1>
            {post.createdAt && (
              <span className="text-xs text-slate-500 whitespace-nowrap">{timeAgo(post.createdAt)}</span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <MarkdownRenderer>{post.content}</MarkdownRenderer>
        </div>

        {/* Footer (Author Info & Admin Actions) */}
        <div className="px-6 py-4 bg-white/[0.01] flex items-center justify-between border-y border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0
              ${isWing ? 'bg-gradient-to-br from-yellow-500 to-amber-600 shadow-[0_0_10px_rgba(234,179,8,0.4)]' : 'bg-gradient-to-br from-accent to-accent-violet'}`}
            >
              {(post.author?.username || '?')[0].toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-200">{post.author?.username || 'Anonymous'}</span>
              <div className="flex items-center gap-2">
                {post.author?.cfHandle && (
                  <span className="text-xs text-accent">@{post.author.cfHandle}</span>
                )}
                {rank && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize"
                    style={{ color: rankColor, background: `${rankColor}18`, border: `1px solid ${rankColor}40` }}>
                    {rank.replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Admin God Button */}
          {currentUser && currentUser.username === 'Surendra_vishnoi' && (
            <button onClick={handleDeletePost} className="px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 text-xs font-bold transition-all">
              Destroy Post
            </button>
          )}
        </div>

        {/* Comment Dock */}
        <div className="px-6 py-4 bg-bg-deep rounded-b-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300">Community Discussion</h3>
            <button onClick={() => setShowComments(!showComments)} className="text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors">
              {showComments ? 'Hide Comments' : 'Show Comments'}
            </button>
          </div>

          {showComments && (
            <div className="flex flex-col gap-4 animate-fade-in">
              {/* New Comment Input */}
              {currentUser ? (
                <div className="flex gap-3">
                  <div className="relative w-full">
                    <textarea 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add to the discussion..."
                      className="input-field w-full min-h-[60px] resize-y placeholder:text-slate-600 bg-bg-surface border-white/10 text-sm py-3 px-4 pr-16"
                    />
                    <button 
                      onClick={handleAddComment}
                      disabled={loadingComments || !newComment.trim()}
                      className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-accent/20 hover:bg-accent/40 text-accent-light font-semibold text-xs transition-colors disabled:opacity-50"
                    >
                      Post
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-bg-surface border border-white/5 text-center">
                  <p className="text-xs text-slate-400">Log in to join the discussion.</p>
                </div>
              )}

              {/* Comment List */}
              <div className="flex flex-col gap-3 mt-2">
                {comments.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-4">No comments yet. Be the first!</p>
                ) : (
                  comments.map(c => {
                    const cRank = c.author?.rank || '';
                    const cColor = cfRankColor(cRank);
                    const canDelete = currentUser && (currentUser.isWingMember || currentUser._id === c.author?._id || currentUser.username === 'Surendra_vishnoi');
                    
                    return (
                      <div key={c._id} className="group relative flex flex-col gap-2 p-3 rounded-lg bg-bg-surface border border-white/[0.05]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-300">
                              {c.author?.username || 'Unknown'}
                            </span>
                            {c.author?.isWingMember && (
                              <svg className="w-3 h-3 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M5 16L3 6l5.5 4L12 4l3.5 6L21 6l-2 10H5z"/>
                              </svg>
                            )}
                            <span className="text-[10px] uppercase font-semibold" style={{ color: cColor }}>
                              {cRank.split(' ')[0]} {/* Short rank */}
                            </span>
                            <span className="text-[10px] text-slate-600">{timeAgo(c.createdAt)}</span>
                          </div>
                          {canDelete && (
                            <button 
                              onClick={() => handleDeleteComment(c._id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 transition-all rounded hover:bg-red-400/10"
                              title="Delete Comment"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-slate-200 whitespace-pre-wrap">{c.content}</p>
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
                  className="w-full py-2 mt-2 text-xs font-semibold text-slate-400 hover:text-white bg-bg-surface hover:bg-white/5 border border-white/10 rounded-lg transition-colors"
                >
                  Load More Comments
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
