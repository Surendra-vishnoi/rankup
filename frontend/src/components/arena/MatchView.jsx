import { useState, useEffect, useRef } from 'react';
import CodeEditor from './CodeEditor.jsx';
import { API_BASE } from '../../apiConfig.js';

function useTimer(endTime) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!endTime) return;
    const calc = () => Math.max(0, Math.floor((new Date(endTime) - Date.now()) / 1000));
    setTimeLeft(calc());
    const iv = setInterval(() => {
      const t = calc();
      setTimeLeft(t);
      if (t === 0) clearInterval(iv);
    }, 1000);
    return () => clearInterval(iv);
  }, [endTime]);

  if (timeLeft === null) return { display: '--:--', isCritical: false, expired: false };
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  return {
    display: `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
    isCritical: timeLeft < 120,   // last 2 minutes
    expired: timeLeft === 0,
  };
}

function cfRankColor(rank = '') {
  const r = rank.toLowerCase();
  if (r.includes('legendary')) return '#ff0000';
  if (r.includes('international grandmaster')) return '#ff3700';
  if (r.includes('grandmaster'))  return '#ff0000';
  if (r.includes('international master')) return '#ffa500';
  if (r.includes('master'))       return '#ffa500';
  if (r.includes('candidate'))    return '#aa00aa';
  if (r.includes('expert'))       return '#0000ff';
  if (r.includes('specialist'))   return '#03a89e';
  if (r.includes('pupil'))        return '#008000';
  return '#808080';
}

export default function MatchView({ matchData, currentUser, socket, onMatchEnd }) {
  const { matchId, problem, endTime, opponent } = matchData;
  const timer = useTimer(endTime);

  const [submitStatus, setSubmitStatus]     = useState(null); // null | 'judging' | {verdict, isAC, ...}
  const [runStatus, setRunStatus]           = useState(null);
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [isRunning, setIsRunning]           = useState(false);
  const [opponentSubmitted, setOpponentSubmitted] = useState(false);
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);

  // Listen for opponent submissions (just a status update)
  useEffect(() => {
    if (!socket) return;

    const handleOpponentSubmit = (data) => {
      // We get a partial broadcast if the opponent submitted (not their code)
      setOpponentSubmitted(true);
    };

    socket.on('arena:opponent_submitted', handleOpponentSubmit);
    return () => socket.off('arena:opponent_submitted', handleOpponentSubmit);
  }, [socket]);

  const handleRun = async ({ code, language, stdin }) => {
    if (!socket) return { stdout: '', stderr: 'Socket not connected', status: { description: 'Error' } };
    setIsRunning(true);
    try {
      const res = await fetch(`${API_BASE}/api/arena/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_code: code, language_id: getJudge0Id(language), stdin }),
        credentials: 'include',
      });
      const data = await res.json();
      setIsRunning(false);
      return data;
    } catch (err) {
      setIsRunning(false);
      return { stdout: '', stderr: err.message, status: { description: 'Error' } };
    }
  };

  const handleSubmit = ({ code, language }) => {
    if (!socket || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitStatus({ status: 'judging' });
    socket.emit('arena:submit', { matchId, code, language });
  };

  const handleForfeit = () => {
    if (!socket) return;
    socket.emit('arena:forfeit', { matchId });
    setShowForfeitConfirm(false);
  };

  useEffect(() => {
    if (!socket) return;
    const handleResult = (data) => {
      setIsSubmitting(false);
      onMatchEnd?.(data);
    };
    const handleSubmitResult = (data) => {
      setIsSubmitting(false);
      setSubmitStatus(data);
    };
    socket.on('arena:result', handleResult);
    socket.on('arena:submit_result', handleSubmitResult);
    return () => {
      socket.off('arena:result', handleResult);
      socket.off('arena:submit_result', handleSubmitResult);
    };
  }, [socket, onMatchEnd]);

  // When timer expires, result comes from server
  useEffect(() => {
    if (timer.expired) {
      setIsSubmitting(false);
    }
  }, [timer.expired]);

  const opponentColor = cfRankColor(opponent?.rank || '');

  return (
    <div className="flex flex-col h-screen bg-bg-deep overflow-hidden">
      {/* ── Top Bar ── */}
      <header className="flex-shrink-0 flex items-center gap-4 px-4 py-2.5 border-b border-white/[0.07] bg-bg-deep/95 backdrop-blur-xl z-20">
        {/* Logo */}
        <a href="/" className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-accent-violet flex items-center justify-center text-sm font-extrabold text-white">R</div>
          <span className="font-extrabold text-sm hidden sm:block">RankUp</span>
        </a>

        {/* Arena badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-bold text-red-400 tracking-wide">LIVE</span>
        </div>

        {/* Problem */}
        <div className="flex items-center gap-2 min-w-0">
          <a
            href={problem?.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-sm font-mono font-bold text-amber-300 hover:text-amber-200 truncate transition-colors"
          >
            {problem?.contestId}{problem?.index} — {problem?.name}
          </a>
          {problem?.rating && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 font-bold flex-shrink-0">
              ★ {problem.rating}
            </span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Timer */}
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border font-mono font-bold text-xl tabular-nums flex-shrink-0 transition-all
          ${timer.isCritical
            ? 'border-red-500/50 bg-red-500/10 arena-timer-critical'
            : 'border-white/10 bg-white/[0.04] text-slate-100'
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {timer.display}
        </div>

        {/* Opponent */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400 leading-none mb-0.5">vs</p>
            <p className="text-sm font-bold text-slate-100">{opponent?.username || 'Opponent'}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {(opponent?.username || '?')[0].toUpperCase()}
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xs font-bold text-slate-300">{opponent?.arenaElo || 1000} Elo</span>
            {opponent?.cfRating && <span className="text-[10px] text-slate-500">CF {opponent.cfRating}</span>}
          </div>
          {opponentSubmitted && (
            <span className="text-xs font-bold text-yellow-400 animate-pulse ml-1">⚡ Submitted!</span>
          )}
        </div>

        {/* Forfeit */}
        <button
          onClick={() => setShowForfeitConfirm(true)}
          className="flex-shrink-0 text-xs font-semibold text-slate-500 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
        >
          Forfeit
        </button>
      </header>

      {/* ── Submit status banner ── */}
      {submitStatus && (
        <div className={`flex-shrink-0 flex items-center justify-between gap-4 px-6 py-2 text-sm font-semibold border-b transition-all
          ${submitStatus.status === 'judging'
            ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300'
            : submitStatus.isAC
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-red-500/10 border-red-500/20 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {submitStatus.status === 'judging' ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                Judging your submission...
              </>
            ) : submitStatus.isAC ? (
              <>✅ Accepted — Waiting for result...</>
            ) : (
              <>{submitStatus.mock ? '🔧 Mock Mode' : '❌'} {submitStatus.verdict || 'Error'}</>
            )}
          </div>
          {submitStatus.time && <span className="text-xs opacity-70">⏱ {submitStatus.time}s</span>}
          <button onClick={() => setSubmitStatus(null)} className="ml-auto opacity-50 hover:opacity-100 transition-opacity text-lg leading-none">×</button>
        </div>
      )}

      {/* ── Main split layout ── */}
      <div className="flex-1 flex overflow-hidden gap-3 p-3 min-h-0">
        {/* Problem Panel */}
        <div className="problem-panel w-1/2 flex-shrink-0">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h1 className="text-base font-bold text-slate-100">
                {problem?.contestId}{problem?.index}. {problem?.name}
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {problem?.rating && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold">
                  Difficulty: {problem.rating}
                </span>
              )}
              {(problem?.tags || []).slice(0, 4).map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-4 mb-4">
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              The full problem statement is available on Codeforces. Click the link below to read it in a new tab.
            </p>
            <a
              href={problem?.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-sm hover:bg-amber-500/20 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
              </svg>
              Open Problem on Codeforces ↗
            </a>
          </div>

          {/* Embedded iframe attempt */}
          <div className="border border-white/[0.06] rounded-xl overflow-hidden" style={{ height: '400px' }}>
            <iframe
              src={problem?.link ? `${problem.link.replace('https://codeforces.com', 'https://codeforces.com')}` : ''}
              className="w-full h-full"
              title="Problem Statement"
              sandbox="allow-same-origin allow-scripts"
              style={{ background: '#fff', border: 'none' }}
            />
          </div>
          <p className="text-xs text-slate-600 mt-2 text-center">
            If the iframe is blocked by CORS, use the "Open on Codeforces" link above.
          </p>
        </div>

        {/* Code Editor */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          <CodeEditor
            onRun={handleRun}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isRunning={isRunning}
            disabled={timer.expired || !!submitStatus?.isAC}
          />
        </div>
      </div>

      {/* ── Forfeit Confirm Modal ── */}
      {showForfeitConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowForfeitConfirm(false)}
        >
          <div className="card p-8 max-w-sm w-full mx-4 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-4">🏳️</div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">Forfeit the match?</h2>
            <p className="text-sm text-slate-400 mb-6">You will lose this match and Elo points will be deducted.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowForfeitConfirm(false)} className="flex-1 btn-ghost">
                Cancel
              </button>
              <button onClick={handleForfeit} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500 hover:text-white transition-all">
                Forfeit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getJudge0Id(lang) {
  const map = { cpp: 54, c: 50, python: 71, java: 62, javascript: 63 };
  return map[lang] || 54;
}
