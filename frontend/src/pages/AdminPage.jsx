import { useState, useEffect } from 'react';
import { API_BASE } from '../apiConfig';

export default function AdminPage() {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [authState, setAuthState] = useState('checking'); // 'checking' | 'authorized' | 'denied'

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/verify`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (data.isAuthenticated && data.user?.username === 'Surendra_vishnoi') {
          setAuthState('authorized');
        } else {
          setAuthState('denied');
        }
      })
      .catch(() => setAuthState('denied'));
  }, []);

  if (authState === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (authState === 'denied') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="card p-8 max-w-md w-full text-center border-red-500/30">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/40 text-3xl">
            🚫
          </div>
          <h1 className="text-xl font-extrabold text-red-400 mb-2">Access Denied</h1>
          <p className="text-sm text-slate-400 mb-6">You are not authorized to access the Admin Console.</p>
          <a href="/" className="text-sm font-semibold text-slate-500 hover:text-white transition-colors">← Return to Hub</a>
        </div>
      </div>
    );
  }

  const handlePromote = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await fetch(`${API_BASE}/api/users/make-wing-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
        credentials: 'include'
      });

      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', message: data.message });
        setUsername('');
      } else {
        setStatus({ type: 'error', message: data.message || 'Promotion failed.' });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Network error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 px-6 max-w-2xl mx-auto flex flex-col items-center">
      <div className="card w-full p-8 border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-amber-500/5 shadow-[0_0_40px_rgba(234,179,8,0.1)]">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mb-4 border border-yellow-500/50 text-3xl">
            👑
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">RankUp Admin Console</h1>
          <p className="text-sm text-yellow-500/80 font-medium">Restricted Access Level. Unauthorized interactions are logged.</p>
        </div>

        <div className="bg-bg-deep/50 rounded-xl p-6 border border-white/5">
          <h2 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            Grant Wing Member Access
          </h2>
          <form onSubmit={handlePromote} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Target Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field placeholder:text-slate-600 bg-bg-surface border-white/10 text-white"
                placeholder="Enter exact RankUp username"
                required
              />
            </div>
            
            {status.message && (
              <div className={`p-3 rounded-lg text-sm font-medium border ${status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                {status.message}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || !username.trim()}
              className="mt-2 w-full flex items-center justify-center py-3 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-500 hover:to-amber-400 text-bg-deep font-extrabold text-sm shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-bg-deep/30 border-t-bg-deep rounded-full animate-spin" />
              ) : (
                'Elevate Privileges'
              )}
            </button>
          </form>
        </div>
        
        <div className="mt-8 pt-6 border-t border-white/5 text-center flex items-center justify-center gap-3">
            <a href="/" className="text-sm font-semibold text-slate-500 hover:text-white transition-colors">← Return to Hub</a>
        </div>
      </div>
    </div>
  );
}
