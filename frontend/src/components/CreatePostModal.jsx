import { useState } from 'react';
import { API_BASE } from '../apiConfig';
import MentionsTextarea from './MentionsTextarea';

const CATEGORIES = [
  { value: 'Insight',   label: 'Insight',   emoji: '💡', desc: 'Share an insight, trick, or discovery' },
  { value: 'Doubt', label: 'Doubt', emoji: '🐛', desc: 'Ask for help on a specific problem'     },
  { value: 'General',   label: 'General',   emoji: '☕', desc: 'General discussion or off-topic'      },
];

export default function CreatePostModal({ onClose, onCreated, currentUser }) {
  const isTitledUser = currentUser && (currentUser.isWingMember || currentUser.isCoordinator || currentUser.isAdmin);
  const categories = isTitledUser 
    ? [...CATEGORIES, { value: 'Announcement', label: 'Announce', emoji: '📢', desc: 'Official announcement' }] 
    : CATEGORIES;

  const [form, setForm] = useState({ title: '', content: '', category: '', cfProblemId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim() || !form.category) {
      setError('Title, content and category are all required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const body = { ...form };
      if (form.category !== 'Doubt') delete body.cfProblemId;
      const res  = await fetch(`${API_BASE}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create post.');
      onCreated?.(data.post);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="card w-full max-w-lg p-6 animate-fade-up relative">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-200 transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <h2 id="modal-title" className="text-lg font-bold text-slate-100 mb-5">Create a Post</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {/* Category selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Category
            </label>
            <div className={`grid gap-2 ${categories.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
              {categories.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => set('category', cat.value)}
                  className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-center transition-all duration-150
                    ${form.category === cat.value
                      ? (cat.value === 'Announcement' ? 'border-purple-500 bg-purple-500/10 text-purple-400' : 'border-accent bg-accent/10 text-accent')
                      : 'border-white/10 bg-bg-surface text-slate-400 hover:border-white/20 hover:text-slate-200'
                    }`}
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="text-xs font-semibold">{cat.label}</span>
                  <span className="text-[10px] text-slate-500 leading-tight hidden sm:block">{cat.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* CF Problem ID — only for Doubt */}
          {form.category === 'Doubt' && (
            <div className="animate-fade-up">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="cf-problem-id">
                Question Link or Problem ID
              </label>
              <input
                id="cf-problem-id"
                className="input-field font-mono"
                type="text"
                placeholder="e.g. 158A or https://codeforces.com/..."
                value={form.cfProblemId}
                onChange={e => set('cfProblemId', e.target.value)}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                The problem link or Codeforces ID (e.g. <span className="font-mono">1A</span>).
              </p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="post-title">
              Title
            </label>
            <input
              id="post-title"
              className="input-field"
              type="text"
              placeholder="Write a clear, descriptive title…"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              maxLength={120}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="post-content">
              Content <span className="text-slate-600 normal-case">(Markdown supported)</span>
            </label>
            <MentionsTextarea
              id="post-content"
              className="input-field resize-none h-32"
              placeholder="Explain your idea, problem, or question…"
              value={form.content}
              onChange={val => set('content', val)}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Posting…' : 'Publish Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
