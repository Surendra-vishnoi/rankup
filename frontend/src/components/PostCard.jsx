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
export default function PostCard({ post, onOpen }) {
  const cat    = CAT[post.category] || CAT.General;
  const rank   = post.author?.rank || '';
  const color  = cfRankColor(rank);
  const isWing = post.author?.isWingMember === true;

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
      className="group relative flex gap-3 px-4 py-4 cursor-pointer
        border-b border-white/[0.06] last:border-b-0
        hover:bg-white/[0.025] transition-colors duration-150 outline-none
        focus-visible:bg-white/[0.025]"
    >
      {/* Wing accent stripe */}
      {isWing && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r bg-gradient-to-b from-yellow-400/80 via-amber-500/60 to-transparent" />
      )}

      {/* Left: Avatar column */}
      <a
        href={`/profile/${post.author?.username || ''}`}
        onClick={e => e.stopPropagation()}
        className="flex-shrink-0 mt-0.5"
        tabIndex={-1}
      >
        <Avatar username={post.author?.username} rank={rank} isWingMember={isWing} size={10} />
      </a>

      {/* Right: Content column */}
      <div className="flex-1 min-w-0">

        {/* Row 1: Author · rank · time */}
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          <a
            href={`/profile/${post.author?.username || ''}`}
            onClick={e => e.stopPropagation()}
            className="text-sm font-bold text-slate-100 hover:underline underline-offset-2 leading-none"
          >
            {post.author?.username || 'Anonymous'}
          </a>
          {isWing && (
            <span className="badge-wing ml-1 shadow-none py-0 px-1.5 h-4 flex items-center">
              Wing Member
            </span>
          )}
          {rank && (
            <span
              className="text-[11px] font-semibold capitalize leading-none"
              style={{ color }}
            >
              {rank.replace(/\b\w/g, c => c.toUpperCase())}
            </span>
          )}
          <span className="text-slate-600 text-[11px] leading-none">·</span>
          <span className="text-slate-500 text-[11px] leading-none flex-shrink-0">
            {post.createdAt ? timeAgo(post.createdAt) : ''}
          </span>

          {/* Category pill — pushed to right on large screens */}
          <span className={`ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.text} hidden sm:inline-flex items-center gap-1`}>
            {cat.emoji} {cat.label}
          </span>
        </div>

        {/* Row 2: Title */}
        <h2 className={`text-[15px] font-bold leading-snug mb-1.5 group-hover:text-accent transition-colors duration-150
          ${isWing ? 'text-yellow-50' : 'text-slate-100'}`}>
          {post.title}
        </h2>

        {/* Row 3: Content preview */}
        {preview && (
          <p className="text-slate-400 text-[13.5px] leading-relaxed line-clamp-2 mb-2">
            {preview.slice(0, PREVIEW_LENGTH)}
            {preview.length > PREVIEW_LENGTH && (
              <span className="text-slate-600"> … <span className="text-accent/80 text-xs">read more</span></span>
            )}
          </p>
        )}

        {/* Row 4: CF problem link (inline chip) */}
        {post.cfProblemId && (
          <a
            href={`https://codeforces.com/problemset/problem/${post.cfProblemId.replace(/([A-Za-z])/, '/$1')}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 mb-2 rounded-md
              bg-blue-500/10 border border-blue-500/20 text-blue-400
              hover:bg-blue-500/20 transition-colors"
          >
            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
            CF {post.cfProblemId}
          </a>
        )}

        {/* Row 5: Action bar */}
        <div className="flex items-center gap-1 mt-1 -ml-1.5">

          {/* Upvote */}
          <button
            id={`upvote-${post._id}`}
            onClick={handleUpvote}
            aria-label={upvoted ? 'Remove upvote' : 'Upvote post'}
            aria-pressed={upvoted}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold
              transition-all duration-150 group/btn
              ${upvoted
                ? 'text-accent bg-accent/10'
                : 'text-slate-500 hover:text-accent hover:bg-accent/10'
              }`}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${upvoteAnim ? 'scale-125' : 'scale-100'}`}
              viewBox="0 0 24 24"
              fill={upvoted ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
              <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
            </svg>
            <span>{upvoteCount}</span>
          </button>

          {/* View / comment count — decorative */}
          <button
            onClick={e => { e.stopPropagation(); onOpen?.(post); }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold
              text-slate-500 hover:text-sky-400 hover:bg-sky-400/10 transition-all duration-150"
            aria-label="View comments"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Reply</span>
          </button>

          {/* Category pill — mobile only (already shown in row 1 on sm+) */}
          <span className={`ml-auto sm:hidden text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.text} inline-flex items-center gap-1`}>
            {cat.emoji}
          </span>
        </div>
      </div>
    </article>
  );
}
