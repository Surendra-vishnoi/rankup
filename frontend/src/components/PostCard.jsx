import { cfRankColor } from '../utils/cfRank.js';
import { useState } from 'react';

const CATEGORY_META = {
  Insight:   { label: 'Insight',   emoji: '💡', color: 'text-yellow-400',  border: 'border-yellow-400/30', bg: 'bg-yellow-400/10' },
  Doubt: { label: 'Doubt', emoji: '🐛', color: 'text-red-400',     border: 'border-red-400/30',    bg: 'bg-red-400/10'    },
  General:   { label: 'General',   emoji: '☕', color: 'text-emerald-400', border: 'border-emerald-400/30',bg: 'bg-emerald-400/10'},
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return `${Math.floor(diff)}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const PREVIEW_LENGTH = 200;

export default function PostCard({ post, onOpen }) {
  const cat       = CATEGORY_META[post.category] || CATEGORY_META.General;
  const rank      = post.author?.rank || '';
  const rankColor = cfRankColor(rank);
  const isLong    = post.content?.length > PREVIEW_LENGTH;
  const isWing    = post.author?.isWingMember === true;

  const [upvoteCount, setUpvoteCount] = useState(post.upvotes?.length ?? 0);
  const [upvoted, setUpvoted]         = useState(false);

  const handleUpvote = async (e) => {
    e.stopPropagation();
    const wasUpvoted = upvoted;
    setUpvoted(!wasUpvoted);
    setUpvoteCount(c => wasUpvoted ? c - 1 : c + 1);

    if (post._id?.startsWith('m')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${post._id}/upvote`, {
        method: 'POST',
        credentials: 'include',
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

  const cardClass = isWing
    ? 'card p-5 flex flex-col gap-3 border border-yellow-500/40 hover:border-yellow-400/70 shadow-gold hover:shadow-gold-hover cursor-pointer group transition-all duration-200 hover:-translate-y-0.5'
    : 'card p-5 flex flex-col gap-3 hover:border-accent/30 cursor-pointer group transition-all duration-200 hover:-translate-y-0.5';

  return (
    <article
      className={cardClass}
      onClick={() => onOpen?.(post)}
      tabIndex={0}
      role="button"
      onKeyDown={e => e.key === 'Enter' && onOpen?.(post)}
      aria-label={`Open post: ${post.title}`}
    >
      {/* Top row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cat.bg} ${cat.border} ${cat.color}`}>
            {cat.emoji} {cat.label}
          </span>
          {isWing && (
            <span className="badge-wing" title="Written by a CP Wing member">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 16L3 6l5.5 4L12 4l3.5 6L21 6l-2 10H5zm0 2h14v2H5v-2z"/>
              </svg>
              Wing Member
            </span>
          )}
        </div>
        {post.createdAt && (
          <span className="text-xs text-slate-500 flex-shrink-0">{timeAgo(post.createdAt)}</span>
        )}
      </div>

      {/* Title */}
      <h2 className={`font-semibold text-base leading-snug group-hover:text-accent transition-colors
        ${isWing ? 'text-yellow-50' : 'text-slate-100'}`}>
        {post.title}
      </h2>

      {/* Content preview */}
      {post.content && (
        <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
          {post.content.replace(/\$+[^$]+\$+/g, '[math]').replace(/[#*`_~>]/g, '').slice(0, PREVIEW_LENGTH)}
          {isLong && <span className="text-slate-500"> … <span className="text-accent text-xs">read more</span></span>}
        </p>
      )}

      {/* CF problem pill */}
      {post.cfProblemId && (
        <a
          href={`https://codeforces.com/problemset/problem/${post.cfProblemId.replace(/([A-Za-z])/, '/$1')}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="self-start inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md bg-accent-cf/10 border border-accent-cf/30 text-accent-cf hover:bg-accent-cf/20 transition-colors"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
          CF {post.cfProblemId}
        </a>
      )}

      {/* Author + rank */}
      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-white/[0.06]">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0
          ${isWing
            ? 'bg-gradient-to-br from-yellow-500 to-amber-600 shadow-[0_0_8px_rgba(234,179,8,0.4)]'
            : 'bg-gradient-to-br from-accent to-accent-violet'
          }`}>
          {(post.author?.username || '?')[0].toUpperCase()}
        </div>
        <span className="text-sm text-slate-400 font-medium">{post.author?.username || 'Anonymous'}</span>
        {rank && (
          <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
            style={{ color: rankColor, background: `${rankColor}18`, border: `1px solid ${rankColor}40` }}>
            {rank.replace(/\b\w/g, c => c.toUpperCase())}
          </span>
        )}
      </div>

      {/* Upvote */}
      <div className="flex items-center gap-4 text-slate-500 text-xs">
        <button
          id={`upvote-${post._id}`}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-150 font-semibold
            ${upvoted
              ? 'text-accent border-accent/40 bg-accent/10'
              : 'text-slate-500 border-white/10 hover:text-accent hover:border-accent/30 hover:bg-accent/5'
            }`}
          onClick={handleUpvote}
          aria-label={upvoted ? 'Remove upvote' : 'Upvote post'}
          aria-pressed={upvoted}
        >
          <svg className={`w-3.5 h-3.5 ${upvoted ? 'scale-110' : ''} transition-transform duration-150`}
            viewBox="0 0 24 24" fill={upvoted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
          </svg>
          <span>{upvoteCount}</span>
        </button>
      </div>
    </article>
  );
}
