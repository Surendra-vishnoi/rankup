import { useState } from 'react';
import { API_BASE } from '../apiConfig';

/* ── CF rank helper (inline for this page) ── */
const cfRankColor = (rank = '') => {
  const r = rank.toLowerCase();
  if (r.includes('legendary grandmaster'))     return '#ff0000';
  if (r.includes('international grandmaster')) return '#ff3700';
  if (r.includes('grandmaster'))               return '#ff0000';
  if (r.includes('international master'))      return '#ff8c00';
  if (r.includes('master'))                    return '#ffa500';
  if (r.includes('candidate master'))          return '#aa00aa';
  if (r.includes('expert'))                    return '#0000ff';
  if (r.includes('specialist'))               return '#03a89e';
  if (r.includes('pupil'))                     return '#008000';
  return '#808080';
};

/* ── Icons ── */
const ShieldIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const CheckIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const XIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function VerifyPage() {
  const [username, setUsername] = useState('');
  const [cfHandle, setCfHandle] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [status,   setStatus]   = useState(null); // { type, message }
  const [profile,  setProfile]  = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!username.trim() || !cfHandle.trim()) {
      setStatus({ type: 'error', message: 'Both fields are required.' });
      return;
    }
    setLoading(true);
    setStatus(null);
    setProfile(null);
    try {
      const res  = await fetch(`${API_BASE}/api/verify-handle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: username.trim(), cfHandle: cfHandle.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.isVerified) {
        setStatus({ type: 'success', message: data.message });
        if (data.profile) setProfile(data.profile);
      } else {
        setStatus({ type: 'error', message: data.message || 'Verification failed.' });
      }
    } catch {
      setStatus({ type: 'error', message: 'Could not reach the server. Is the backend running?' });
    } finally {
      setLoading(false);
    }
  };

  const rankColor = profile ? cfRankColor(profile.rank || '') : '#6378ff';

  return (
    <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center p-5 relative overflow-hidden">
      {/* Mesh gradient */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 60% at 20% 10%, rgba(99,120,255,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 90%, rgba(167,139,250,0.1) 0%, transparent 60%)'
        }} />
      </div>

      {/* Nav */}
      <nav className="w-full max-w-lg mb-10 flex items-center justify-between relative z-10">
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-violet flex items-center justify-center font-extrabold text-white text-sm shadow-btn">
            R
          </div>
          <span className="font-extrabold text-base bg-gradient-to-r from-white to-accent-violet bg-clip-text text-transparent">
            RankUp
          </span>
        </a>
        <a href="/" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
          ← Back to Hub
        </a>
      </nav>

      {/* Card */}
      <main className="w-full max-w-lg relative z-10 animate-fade-up" id="verify-page">
        <div className="card p-8 relative overflow-hidden">
          {/* Gradient overlay in card */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none rounded-2xl" />

          {/* Header */}
          <div className="text-center mb-8 relative">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent-violet uppercase tracking-wider mb-4">
              <ShieldIcon />
              Account Verification
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 mb-2">
              Verify your Codeforces handle
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Prove ownership of your CF account by triggering a compilation error. Takes under a minute.
            </p>
          </div>

          {/* Instructions box */}
          <div className="bg-bg-card2 rounded-xl border border-white/[0.07] border-l-2 p-4 mb-6 relative"
               style={{ borderLeftColor: '#f97316' }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-cf mb-3 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              How to verify
            </p>
            <ol className="flex flex-col gap-3">
              {[
                <>Open <a href="https://codeforces.com/problemset/problem/1/A" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-violet transition-colors font-medium">CF Problem 1A — Theatre Square</a> while signed in to Codeforces.</>,
                <>Submit any code that causes a <span className="text-accent-cf font-semibold">Compilation Error</span> — e.g. just type <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded font-mono">hello</code> and submit.</>,
                <>Come back here and click <strong className="text-slate-200">Verify Account</strong> within <strong className="text-slate-200">5 minutes</strong>.</>,
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-400 leading-relaxed">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-cf/15 border border-accent-cf/35 text-accent-cf text-[11px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Form */}
          <form onSubmit={handleVerify} className="flex flex-col gap-4" noValidate id="verify-form">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="username-input">
                RankUp Username
              </label>
              <input
                id="username-input"
                className="input-field"
                type="text"
                placeholder="e.g. competitive_coder"
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={loading || !!profile}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="cf-handle-input">
                Codeforces Handle
              </label>
              <input
                id="cf-handle-input"
                className="input-field"
                type="text"
                placeholder="e.g. tourist"
                value={cfHandle}
                onChange={e => setCfHandle(e.target.value)}
                disabled={loading || !!profile}
                autoComplete="off"
              />
            </div>

            {/* Status */}
            {status && (
              <div className={`flex items-start gap-2.5 text-sm px-4 py-3 rounded-lg border animate-fade-up
                ${status.type === 'success'
                  ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400'
                  : 'bg-red-400/10 border-red-400/30 text-red-400'
                }`}
                role="alert"
              >
                {status.type === 'success' ? <CheckIcon /> : <XIcon />}
                <span className="leading-relaxed">{status.message}</span>
              </div>
            )}

            {/* Synced profile card */}
            {profile && (
              <div className="bg-bg-card2 rounded-xl border border-emerald-400/20 p-4 animate-fade-up">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
                  <CheckIcon />
                  Codeforces Profile Synced
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Handle', value: profile.cfHandle },
                    { label: 'Rating', value: profile.rating ?? '—' },
                    { label: 'Rank',   value: profile.rank   ?? '—' },
                  ].map(s => (
                    <div key={s.label} className="bg-bg-surface rounded-lg p-3 text-center border border-white/[0.05]">
                      <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">{s.label}</div>
                      <div
                        className="text-sm font-bold font-mono capitalize"
                        style={s.label === 'Rank' ? { color: rankColor } : {}}
                      >
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>
                <a href="/" className="btn-primary w-full flex items-center justify-center gap-2 mt-3 text-sm py-2.5">
                  Go to Hub →
                </a>
              </div>
            )}

            {/* Submit */}
            {!profile && (
              <button
                id="verify-submit-btn"
                type="submit"
                className="btn-primary flex items-center justify-center gap-2 py-3 text-sm mt-1"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Checking submissions…
                  </>
                ) : (
                  <>
                    <ShieldIcon />
                    Verify Account
                  </>
                )}
              </button>
            )}
          </form>
        </div>

        <p className="text-center text-sm text-slate-600 mt-5">
          Already verified?{' '}
          <a href="/" className="text-accent hover:text-accent-violet transition-colors font-medium">
            Back to Hub
          </a>
        </p>
      </main>
    </div>
  );
}
