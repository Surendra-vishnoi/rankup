import { useState, useEffect } from 'react';
import MarkdownRenderer from '../components/MarkdownRenderer.jsx';
import { API_BASE } from '../apiConfig';

const CATEGORIES = [
  { value: 'Insight',   label: 'Insight',   emoji: '💡', desc: 'Insight or technique editorial' },
  { value: 'Doubt', label: 'Doubt', emoji: '🐛', desc: 'Step-by-step problem solution'  },
];

function TabBtn({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150
        ${active
          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          : 'text-slate-500 hover:text-slate-300 border border-transparent'
        }`}>
      {children}
    </button>
  );
}

/* ── Single hint input row with remove button ── */
function HintRow({ index, value, onChange, onRemove, canRemove }) {
  const COLORS = ['border-amber-400/40 focus:border-amber-400/70', 'border-orange-400/40 focus:border-orange-400/70', 'border-yellow-300/40 focus:border-yellow-300/70'];
  const col = COLORS[index % COLORS.length];

  return (
    <div className="flex gap-2 items-start">
      <div className="flex-shrink-0 w-6 h-6 rounded-full border border-amber-400/40 text-amber-400 text-[11px] font-extrabold flex items-center justify-center mt-3.5 bg-amber-400/5">
        {index + 1}
      </div>
      <textarea
        className={`input-field resize-none h-20 font-mono text-xs flex-1 border ${col}`}
        placeholder={`Hint ${index + 1}: A progressive nudge… Supports **bold**, $math$.`}
        value={value}
        onChange={e => onChange(index, e.target.value)}
        aria-label={`Hint ${index + 1}`}
      />
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="flex-shrink-0 mt-3 w-7 h-7 rounded-lg border border-white/10 text-slate-500 hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/5 flex items-center justify-center transition-all"
          aria-label={`Remove hint ${index + 1}`}
          title="Remove hint"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </div>
  );
}

export default function CreateEditorialPage() {
  const [authState, setAuthState] = useState('loading'); // 'loading' | 'ok' | 'not-wing' | 'not-auth'
  const [form, setForm] = useState({
    title: '', questionNumber: '', solution: '', category: 'Insight',
  });
  const [hints, setHints]         = useState(['']); // array of hint strings
  const [activeTab, setActiveTab] = useState('write');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  /* ── Hint helpers ── */
  const updateHint   = (i, val) => setHints(h => h.map((x, idx) => idx === i ? val : x));
  const addHint      = ()      => setHints(h => [...h, '']);
  const removeHint   = (i)     => setHints(h => h.filter((_, idx) => idx !== i));

  /* ── Auth guard ── */
  useEffect(() => {
    fetch(`${API_BASE}/api/auth/verify`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        if (!data.isAuthenticated)    { setAuthState('not-auth'); return; }
        if (!data.user?.isWingMember) { setAuthState('not-wing'); return; }
        setAuthState('ok');
      })
      .catch(() => setAuthState('not-auth'));
  }, []);

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim())          { setError('Title is required.'); return; }
    if (!form.questionNumber.trim()) { setError('Question link is required.'); return; }
    if (!form.solution.trim())       { setError('Solution body is required.'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/editorials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...form, hints: hints.filter(h => h.trim()) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to publish.');
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setForm({ title:'', questionNumber:'', solution:'', category:'Insight' });
    setHints(['']);
  };

  /* ── Gate screens ── */
  if (authState === 'loading') return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
    </div>
  );
  if (authState === 'not-auth') return <AccessDenied reason="auth" />;
  if (authState === 'not-wing') return <AccessDenied reason="wing" />;

  /* ── Success ── */
  if (success) return (
    <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center p-6">
      <div className="card-editorial p-10 max-w-md w-full text-center animate-pop-in">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center mx-auto mb-5 shadow-gold">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 className="text-xl font-extrabold text-yellow-50 mb-2">Editorial Published!</h2>
        <p className="text-slate-400 text-sm mb-6">Your editorial is now live on the RankUp Wing Editorials page.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a href="/editorials" className="btn-primary text-sm py-2">View Editorials</a>
          <button onClick={resetForm} className="btn-ghost text-sm py-2">Write another</button>
        </div>
      </div>
    </div>
  );

  /* ── Main drafting room ── */
  return (
    <div className="min-h-screen bg-bg-deep">
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 50% at 20% 0%, rgba(234,179,8,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(217,119,6,0.05) 0%, transparent 60%)'
        }} />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] backdrop-blur-xl bg-bg-deep/80">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2" aria-label="RankUp Home">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-violet flex items-center justify-center text-sm font-extrabold text-white shadow-btn">R</div>
            <span className="font-extrabold text-base tracking-tight text-gradient">RankUp</span>
          </a>
          <div className="flex items-center gap-2">
            <span className="badge-official hidden sm:inline-flex">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Drafting Room
            </span>
            <a href="/editorials" className="btn-ghost text-sm py-1.5">← Editorials</a>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-gold flex-shrink-0">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-yellow-50">The Drafting Room</h1>
              <p className="text-slate-500 text-sm">CP Wing — Official Editorial Composer</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed max-w-2xl mt-3">
            Craft structured editorials with progressive hints. Each hint is independently revealed by readers — add them in order from easiest nudge to most specific.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left: metadata + hints */}
            <div className="flex flex-col gap-5">

              {/* Question Link */}
              <div>
                <label htmlFor="question-link" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Question Link <span className="text-amber-400">*</span>
                </label>
                <input id="question-link" className="input-field font-mono" type="url"
                  placeholder="e.g. https://codeforces.com/problemset/problem/158/A" value={form.questionNumber}
                  onChange={e => set('questionNumber', e.target.value)} required />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Category <span className="text-amber-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat.value} type="button" onClick={() => set('category', cat.value)}
                      className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-center transition-all duration-150
                        ${form.category === cat.value
                          ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                          : 'border-white/10 bg-bg-surface text-slate-400 hover:border-white/20 hover:text-slate-200'
                        }`}>
                      <span className="text-xl">{cat.emoji}</span>
                      <span className="text-xs font-semibold">{cat.label}</span>
                      <span className="text-[10px] text-slate-500 leading-tight">{cat.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="editorial-title" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Title <span className="text-amber-400">*</span>
                </label>
                <input id="editorial-title" className="input-field" type="text"
                  placeholder="e.g. 158A — Next Round" value={form.title}
                  onChange={e => set('title', e.target.value)} maxLength={120} required />
              </div>

              {/* ── Progressive Hints ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Progressive Hints
                    <span className="text-slate-600 normal-case font-normal ml-1">(optional — Markdown supported)</span>
                  </label>
                  <span className="text-[10px] text-slate-600 font-mono">{hints.filter(h=>h.trim()).length} hint{hints.filter(h=>h.trim()).length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {hints.map((h, i) => (
                    <HintRow key={i} index={i} value={h}
                      onChange={updateHint} onRemove={removeHint} canRemove={hints.length > 1} />
                  ))}
                </div>
                <button type="button" onClick={addHint}
                  className="mt-2 flex items-center gap-1.5 text-xs text-amber-400/70 hover:text-amber-300 transition-colors font-semibold px-2 py-1">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add another hint
                </button>
                <p className="text-[11px] text-slate-600 mt-1 px-1">
                  Order hints from a gentle nudge → most specific. Readers reveal them one at a time.
                </p>
              </div>
            </div>

            {/* Right: solution composer */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Solution <span className="text-amber-400">*</span>
                  <span className="text-slate-600 normal-case font-normal ml-1">(Markdown + LaTeX)</span>
                </label>
                <div className="flex gap-1 p-0.5 bg-bg-surface rounded-lg border border-white/[0.07]">
                  <TabBtn active={activeTab === 'write'}   onClick={() => setActiveTab('write')}>Write</TabBtn>
                  <TabBtn active={activeTab === 'preview'} onClick={() => setActiveTab('preview')}>Preview</TabBtn>
                </div>
              </div>

              {activeTab === 'write' ? (
                <textarea id="editorial-solution" className="input-field resize-none font-mono text-xs flex-1"
                  style={{ minHeight: '420px' }}
                  placeholder={`## Solution\n\nWrite your full solution here.\nSupports **Markdown**, \`code blocks\`:\n\n\`\`\`cpp\n// your code\n\`\`\`\n\nAnd LaTeX: $O(n\\log n)$, $$\\sum_{i=1}^{n} a_i$$`}
                  value={form.solution}
                  onChange={e => set('solution', e.target.value)} />
              ) : (
                <div className="card-editorial p-5 flex-1 overflow-y-auto" style={{ minHeight: '420px' }}>
                  {form.solution
                    ? <MarkdownRenderer>{form.solution}</MarkdownRenderer>
                    : <p className="text-slate-600 text-sm italic">Nothing to preview yet.</p>
                  }
                </div>
              )}
            </div>
          </div>

          {/* Live preview strip */}
          {(form.questionNumber || form.title) && (
            <div className="card-editorial p-4 flex items-start gap-3 animate-fade-in">
              <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="badge-official">⭐ Wing Official</span>
                  {form.questionNumber && (
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300">
                      CF {form.questionNumber}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-yellow-50 mb-1">{form.title || '(no title yet)'}</p>
                {hints.filter(h => h.trim()).length > 0 && (
                  <p className="text-xs text-amber-200/50">
                    {hints.filter(h=>h.trim()).length} progressive hint{hints.filter(h=>h.trim()).length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 text-sm px-4 py-3 rounded-xl border bg-red-400/10 border-red-400/30 text-red-400 animate-fade-in" role="alert">
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 justify-end pt-2">
            <a href="/editorials" className="btn-ghost">Cancel</a>
            <button type="submit" id="publish-editorial-btn" className="btn-primary flex items-center gap-2" disabled={loading}>
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Publishing…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  Publish Editorial
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function AccessDenied({ reason }) {
  return (
    <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-400/10 border border-red-400/30 flex items-center justify-center mb-5">
        <svg className="w-8 h-8 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
      </div>
      <h1 className="text-xl font-extrabold text-slate-100 mb-2">
        {reason === 'auth' ? 'Login Required' : 'Wing Members Only'}
      </h1>
      <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-6">
        {reason === 'auth'
          ? 'You need to be logged in to access the Drafting Room.'
          : 'The Drafting Room is restricted to CP Wing members. Contact a Wing admin to join.'
        }
      </p>
      <a href="/editorials" className="btn-primary text-sm">← View Editorials</a>
    </div>
  );
}
