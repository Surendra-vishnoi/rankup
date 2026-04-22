import { useState } from 'react';
import { API_BASE } from '../apiConfig';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ username: '', cfHandle: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError('Username and password are required.');
      return;
    }
    if (mode === 'register' && !form.cfHandle) {
      setError('Codeforces handle is required for registration.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const bodyParams = mode === 'login'
        ? { username: form.username.trim(), password: form.password }
        : { username: form.username.trim(), cfHandle: form.cfHandle.trim(), password: form.password };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bodyParams),
      });

      const data = await res.json();

      if (res.ok) {
        if (mode === 'login') {
          // Send them to the hub
          window.location.href = '/';
        } else {
          // Registration successful, send them to /verify
          window.location.href = '/verify';
        }
      } else {
        setError(data.message || 'Authentication failed.');
      }
    } catch (err) {
      setError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center p-5 relative overflow-hidden">
      {/* Mesh gradient */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 60% at 20% 10%, rgba(99,120,255,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 90%, rgba(167,139,250,0.1) 0%, transparent 60%)'
        }} />
      </div>

      {/* Nav */}
      <nav className="w-full max-w-sm mb-8 flex items-center justify-between relative z-10">
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

      {/* Form Card */}
      <main className="w-full max-w-sm relative z-10 animate-fade-up">
        <div className="card p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 mb-2">
              {mode === 'login' ? 'Welcome back' : 'Create an account'}
            </h1>
            <p className="text-slate-400 text-sm">
              {mode === 'login' ? 'Log in to your RankUp account.' : 'Join the elite Codeforces community.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="py-2.5 px-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-semibold animate-fade-in">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                className="input-field"
                type="text"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="Unique username"
              />
            </div>

            {mode === 'register' && (
              <div className="animate-fade-in">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="cfHandle">
                  Codeforces Handle
                </label>
                <input
                  id="cfHandle"
                  className="input-field"
                  type="text"
                  value={form.cfHandle}
                  onChange={e => setForm({ ...form, cfHandle: e.target.value })}
                  placeholder="e.g. tourist"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                className="input-field"
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 flex items-center justify-center mt-2 shadow-gold">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/[0.05] text-center">
            <p className="text-sm text-slate-400">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                className="text-accent hover:text-accent-violet font-semibold transition-colors focus:outline-none"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                }}
              >
                {mode === 'login' ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
