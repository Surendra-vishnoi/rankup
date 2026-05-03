import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { API_BASE } from '../apiConfig';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ username: '', cfHandle: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const resetFormState = () => {
    setForm({ username: '', cfHandle: '', email: '', password: '' });
    setError('');
    setMessage('');
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await res.json();

      if (res.ok) {
        window.location.href = '/';
      } else {
        setError(data.message || 'Google authentication failed.');
      }
    } catch (err) {
      setError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (mode === 'login' && (!form.username || !form.password)) {
      setError('Username and password are required.');
      return;
    }
    if (mode === 'register') {
      if (!form.username || !form.password || !form.email) {
        setError('Username, email, and password are required.');
        return;
      }
    }

    setLoading(true);

    try {
      let endpoint = '';
      let bodyParams = {};

      if (mode === 'login') {
        endpoint = '/api/auth/login';
        bodyParams = { username: form.username.trim(), password: form.password };
      } else if (mode === 'register') {
        endpoint = '/api/auth/register';
        bodyParams = { 
          username: form.username.trim(), 
          cfHandle: form.cfHandle.trim(), 
          email: form.email.trim(),
          password: form.password 
        };
      }

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bodyParams),
      });

      const data = await res.json();

      if (res.ok) {
        if (mode === 'login') {
          window.location.href = '/';
        } else if (mode === 'register') {
          // On standard register, you could auto-login, but currently it just returns 201
          setMessage('Account created successfully. You can now log in.');
          setMode('login');
          resetFormState();
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

          <div className="flex flex-col gap-4 mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google authentication failed.')}
              theme="filled_black"
              size="large"
              width="100%"
              text={mode === 'login' ? "signin_with" : "signup_with"}
            />
          </div>

          <div className="relative flex items-center mb-6">
            <div className="flex-grow border-t border-white/[0.05]"></div>
            <span className="flex-shrink-0 mx-4 text-slate-500 text-xs font-semibold uppercase tracking-wider">Or continue with email</span>
            <div className="flex-grow border-t border-white/[0.05]"></div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="py-2.5 px-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-semibold animate-fade-in">
                {error}
              </div>
            )}
            {message && (
              <div className="py-2.5 px-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs text-center font-semibold animate-fade-in">
                {message}
              </div>
            )}

            {mode === 'login' && (
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
            )}

            {mode === 'register' && (
              <>
                <div className="animate-fade-in">
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
                <div className="animate-fade-in">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    className="input-field w-full"
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="your@email.com"
                  />
                </div>
                <div className="animate-fade-in">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="cfHandle">
                    Codeforces Handle (Optional)
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
              </>
            )}

            <div className="animate-fade-in">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  className="input-field w-full pr-10"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
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
                  resetFormState();
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
