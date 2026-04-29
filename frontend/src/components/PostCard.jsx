import { cfRankColor } from '../utils/cfRank.js';
import { useState } from 'react';
import { API_BASE } from '../apiConfig';

/* ── Utilities ── */
function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return `${Math.floor(diff)}s`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

const PREVIEW_LENGTH = 180;

const CAT = {
  Insight: { label: 'Insight', emoji: '💡', dot: 'bg-yellow-400', text: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  Doubt:   { label: 'Doubt',   emoji: '🐛', dot: 'bg-red-400',    text: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/20'    },
  General: { label: 'General', emoji: '☕', dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
};

/* ── Avatar component ── */
function Avatar({ username, rank, isWingMember, size = 9 }) {
  const color = cfRankColor(rank || '');
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 text-sm select-none`}
      style={{
        background: isWingMember
          ? 'linear-gradient(135deg, #eab308 0%, #d97706 100%)'
          : `linear-gradient(145deg, ${color}cc 0%, ${color}55 100%)`,
        boxShadow: isWingMember
          ? '0 0 0 2px rgba(234,179,8,0.35)'
          : `0 0 0 1px ${color}30`,
      }}
      aria-hidden
    >
      {(username || '?')[0].toUpperCase()}
    </div>
  );
}

/* ─────────────────────────────────────────
   PostCard — Twitter / X inspired design
   ───────────────────────────────────────── */
export default function PostCard({ post, onOpen, currentUser }) {
  const cat    = CAT[post.category] || CAT.General;
  const rank   = post.author?.rank || '';
  const color  = cfRankColor(rank);
  const isWing = post.author?.isWingMember === true;
  const isCoordinator = post.author?.isCoordinator === true;

  const [upvoteCount, setUpvoteCount] = useState(post.upvotes?.length ?? 0);
  const [upvoted, setUpvoted]         = useState(false);
  const [upvoteAnim, setUpvoteAnim]   = useState(false);

  const handleUpvote = async (e) => {
    e.stopPropagation();
    if (upvoteAnim) return;

    const wasUpvoted = upvoted;
    setUpvoted(!wasUpvoted);
    setUpvoteCount(c => wasUpvoted ? c - 1 : c + 1);
    setUpvoteAnim(true);
    setTimeout(() => setUpvoteAnim(false), 400);

    if (post._id?.startsWith('m')) return;
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post._id}/upvote`, {
        method: 'POST', credentials: 'include',
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUpvoteCount(data.upvotes);
      setUpvoted(data.upvoted);
    } catch {
      setUpvoted(wasUpvoted);
      setUpvoteCount(c => wasUpvoted ? c + 1 : c - 1);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post._id}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (res.ok) {
        window.location.reload(); // Simple way to refresh the list
      } else {
        alert('Failed to delete post.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting post.');
    }
  };

  const preview = (post.isEditorial || !post.content)
    ? ''
    : post.content.replace(/\$+[^$\n]+\$+/g, '[math]').replace(/```[\s\S]*?```/g, '[code]').replace(/[#*`_~>]/g, '').trim();

  return (
    <article
      onClick={() => onOpen?.(post)}
      onKeyDown={e => e.key === 'Enter' && onOpen?.(post)}
      tabIndex={0}
      role="button"
      aria-label={`Open post: ${post.title}`}
      className="card group relative flex flex-col gap-3 px-5 py-4 cursor-pointer
        hover:bg-white/[0.04] transition-all duration-150 outline-none
        hover:scale-[1.005] active:scale-[0.998] focus-visible:bg-white/[0.04]"
    >
      {/* Wing accent stripe */}
      {isWing && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r bg-gradient-to-b from-yellow-400 via-amber-500 to-transparent" />
      )}

      {/* Admin Delete Button */}
      {currentUser?.isAdmin && (
        <button
          onClick={handleDelete}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"
          title="Delete Post"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      )}

      {/* Top Header: Category, Wing Tag, Time */}
      <div className="flex items-center gap-2 mb-0.5">
        <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border ${cat.bg} ${cat.text}`}>
          {cat.emoji} {cat.label}
        </span>
        {isCoordinator ? (
          <span className="badge-coordinator shadow-none py-0 px-1.5 h-4 flex items-center text-[9px] uppercase tracking-tighter">
            Coordinator
          </span>
        ) : isWing && (
          <span className="badge-wing shadow-none py-0 px-1.5 h-4 flex items-center text-[9px] uppercase tracking-tighter">
            Wing Member
          </span>
        )}
        <span className="text-slate-600 text-[11px] ml-auto">
          {post.createdAt ? timeAgo(post.createdAt) : ''}
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-1.5">
        <h2 className={`text-lg font-bold leading-tight group-hover:text-accent transition-colors duration-150
          ${isWing ? 'text-yellow-50' : 'text-slate-100'}`}>
          {post.title}
        </h2>

        {preview && (
          <p className="text-slate-400 text-[14px] leading-relaxed line-clamp-2">
            {preview.slice(0, PREVIEW_LENGTH)}
            {preview.length > PREVIEW_LENGTH && (
              <span className="text-slate-600"> … <span className="text-accent/80 text-xs">read more</span></span>
            )}
          </p>
        )}

        {post.cfProblemId && (
          <a
            href={post.cfProblemId.startsWith('http')
              ? post.cfProblemId
              : `https://codeforces.com/problemset/problem/${post.cfProblemId.replace(/([A-Za-z])/, '/$1')}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 w-fit rounded-md
              bg-blue-500/10 border border-blue-500/20 text-blue-400
              hover:bg-blue-500/20 transition-colors mt-1"
          >
            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
            CF {post.cfProblemId.startsWith('http')
              ? (post.cfProblemId.split('/').filter(Boolean).pop() || 'Link')
              : post.cfProblemId}
          </a>
        )}
      </div>

      {/* Bottom Footer: Author Info + Actions */}
      <div className="mt-2 pt-3 border-t border-white/[0.05] flex items-center justify-between gap-4">
        
        {/* Author Info */}
        <div className="flex items-center gap-2">
          <Avatar username={post.author?.username} rank={rank} isWingMember={isWing} size={6} />
          <div className="flex flex-col">
            <a
              href={`/profile/${post.author?.username || ''}`}
              onClick={e => e.stopPropagation()}
              className="text-xs font-bold text-slate-200 hover:text-accent transition-colors leading-none"
            >
              {post.author?.username || 'Anonymous'}
            </a>
            {post.author?.customTitle ? (
              <span className="text-[10px] font-bold text-slate-300 mt-0.5 tracking-wide">
                {post.author.customTitle}
              </span>
            ) : rank && (
              <span className="text-[10px] font-semibold capitalize mt-0.5" style={{ color }}>
                {rank.replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            )}
          </div>
        </div>

        {/* Interaction Actions */}
        <div className="flex items-center gap-1">
          <button
            id={`upvote-${post._id}`}
            onClick={handleUpvote}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold
              transition-all duration-150
              ${upvoted ? 'text-accent bg-accent/10' : 'text-slate-400 hover:text-accent hover:bg-white/5'}`}
          >
            <svg
              className={`w-4 h-4 ${upvoteAnim ? 'scale-125' : 'scale-100'} transition-transform`}
              viewBox="0 0 24 24" fill={upvoted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"
            >
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
              <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
            </svg>
            {upvoteCount}
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-400">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            {post.commentsCount ?? 0}
          </div>

          <span className={`ml-auto sm:hidden text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.text} inline-flex items-center gap-1`}>
            {cat.emoji}
          </span>
        </div>
      </div>
    </article>
  );
}
