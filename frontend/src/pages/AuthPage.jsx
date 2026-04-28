import { useState } from 'react';
import { API_BASE } from '../apiConfig';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot-password'
  const [form, setForm] = useState({ username: '', cfHandle: '', email: '', password: '', otp: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const resetFormState = () => {
    setForm({ username: '', cfHandle: '', email: '', password: '', otp: '' });
    setError('');
    setMessage('');
    setOtpSent(false);
  };

  const handleSendOTP = async () => {
    if (!form.email) {
      setError('Email is required to send OTP.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), type: mode }),
      });
      const data = await res.json();

      if (res.ok) {
        setOtpSent(true);
        setMessage('OTP sent successfully. Please check your email.');
      } else {
        setError(data.message || 'Failed to send OTP.');
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
      if (!form.username || !form.password || !form.email || !form.otp) {
        setError('All fields are required.');
        return;
      }
      if (!form.cfHandle) {
        setError('Codeforces handle is required for registration.');
        return;
      }
    }
    if (mode === 'forgot-password' && (!form.email || !form.otp || !form.password)) {
      setError('All fields are required.');
      return;
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
          otp: form.otp.trim(),
          password: form.password 
        };
      } else if (mode === 'forgot-password') {
        endpoint = '/api/auth/reset-password';
        bodyParams = {
          email: form.email.trim(),
          otp: form.otp.trim(),
          newPassword: form.password
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
          window.location.href = '/verify';
        } else if (mode === 'forgot-password') {
          setMessage('Password reset successfully. You can now log in.');
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
              {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create an account' : 'Reset Password'}
            </h1>
            <p className="text-slate-400 text-sm">
              {mode === 'login' ? 'Log in to your RankUp account.' : mode === 'register' ? 'Join the elite Codeforces community.' : 'We will send you an OTP to reset your password.'}
            </p>
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
                    disabled={otpSent}
                  />
                </div>
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
                    disabled={otpSent}
                  />
                </div>
              </>
            )}

            {(mode === 'register' || mode === 'forgot-password') && (
              <div className="animate-fade-in">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="email">
                  Email
                </label>
                <div className="flex gap-2">
                  <input
                    id="email"
                    className="input-field flex-1"
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="your@email.com"
                    disabled={otpSent}
                  />
                  {!otpSent && (
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={loading || !form.email}
                      className="px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      Send OTP
                    </button>
                  )}
                </div>
              </div>
            )}

            {((mode === 'register' && otpSent) || (mode === 'forgot-password' && otpSent)) && (
              <div className="animate-fade-in">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="otp">
                  OTP
                </label>
                <input
                  id="otp"
                  className="input-field"
                  type="text"
                  value={form.otp}
                  onChange={e => setForm({ ...form, otp: e.target.value })}
                  placeholder="6-digit code"
                />
              </div>
            )}

            {(mode === 'login' || ((mode === 'register' || mode === 'forgot-password') && otpSent)) && (
              <div className="animate-fade-in">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between" htmlFor="password">
                  <span>{mode === 'forgot-password' ? 'New Password' : 'Password'}</span>
                  {mode === 'login' && (
                    <button
                      type="button"
                      className="text-accent hover:text-accent-violet transition-colors focus:outline-none capitalize"
                      onClick={() => {
                        setMode('forgot-password');
                        resetFormState();
                      }}
                    >
                      Forgot?
                    </button>
                  )}
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
                      <svg xmlns="http://www.w3.org/2000/ বাতাসে" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
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
            )}

            {(!((mode === 'register' || mode === 'forgot-password') && !otpSent)) && (
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 flex items-center justify-center mt-2 shadow-gold">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : mode === 'login' ? 'Log In' : mode === 'register' ? 'Sign Up' : 'Reset Password'}
              </button>
            )}
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
