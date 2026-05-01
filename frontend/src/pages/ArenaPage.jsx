import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import MatchView from '../components/arena/MatchView.jsx';
import { API_BASE } from '../apiConfig.js';
import NotificationBell from '../components/NotificationBell.jsx';

const MATCH_TIMERS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
];

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return `${Math.floor(diff)}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function EloDelta({ delta }) {
  if (delta === 0) return <span className="elo-same font-bold">—</span>;
  return (
    <span className={delta > 0 ? 'elo-up font-bold' : 'elo-down font-bold'}>
      {delta > 0 ? '+' : ''}{delta}
    </span>
  );
}

// ── State: 'lobby' | 'searching' | 'live' | 'result'
export default function ArenaPage() {
  const [state, setState]           = useState('lobby');
  const [currentUser, setCurrentUser] = useState(null);
  const [timerMinutes, setTimerMinutes] = useState(30);
  const [matchData, setMatchData]   = useState(null);
  const [resultData, setResultData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [matchHistory, setMatchHistory] = useState([]);
  const [loadingLB, setLoadingLB]   = useState(true);
  const [queueTime, setQueueTime]   = useState(0);
  const socketRef = useRef(null);
  const queueTimerRef = useRef(null);

  // ── Auth check ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/auth/verify`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.isAuthenticated) {
          setCurrentUser(d.user);
        } else {
          window.location.href = '/auth';
        }
      })
      .catch(() => window.location.href = '/auth');
  }, []);

  // ── Leaderboard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/arena/leaderboard`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.users) setLeaderboard(d.users); })
      .catch(() => {})
      .finally(() => setLoadingLB(false));
  }, []);

  // ── Match history (once user is known) ──────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.username) return;
    fetch(`${API_BASE}/api/arena/history/${currentUser.username}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.matches) setMatchHistory(d.matches); })
      .catch(() => {});
  }, [currentUser]);

  // ── Socket.IO setup ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    const socket = io(API_BASE, { withCredentials: true, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => console.log('[Arena] Socket connected'));
    socket.on('connect_error', err => console.error('[Arena] Socket error:', err.message));

    socket.on('arena:queued', () => {
      setState('searching');
      setQueueTime(0);
      queueTimerRef.current = setInterval(() => setQueueTime(t => t + 1), 1000);
    });

    socket.on('arena:queue_left', () => {
      setState('lobby');
      clearInterval(queueTimerRef.current);
      setQueueTime(0);
    });

    socket.on('arena:match_found', (data) => {
      clearInterval(queueTimerRef.current);
      setMatchData(data);
      setState('live');
    });

    socket.on('arena:result', (data) => {
      setResultData(data);
      setState('result');
      // Refresh history & leaderboard
      if (currentUser?.username) {
        fetch(`${API_BASE}/api/arena/history/${currentUser.username}`)
          .then(r => r.ok ? r.json() : null)
          .then(d => { if (d?.matches) setMatchHistory(d.matches); })
          .catch(() => {});
        fetch(`${API_BASE}/api/arena/leaderboard`)
          .then(r => r.ok ? r.json() : null)
          .then(d => { if (d?.users) setLeaderboard(d.users); })
          .catch(() => {});
      }
    });

    return () => {
      socket.disconnect();
      clearInterval(queueTimerRef.current);
    };
  }, [currentUser]);

  const handleJoinQueue = () => {
    if (!socketRef.current) return;
    socketRef.current.emit('arena:join_queue', { timerMinutes });
  };

  const handleLeaveQueue = () => {
    if (!socketRef.current) return;
    socketRef.current.emit('arena:leave_queue');
  };

  const handleMatchEnd = (data) => {
    setResultData(data);
    setState('result');
  };

  const handleLogout = async () => {
    await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    window.location.href = '/';
  };

  // ── Live match view ─────────────────────────────────────────────────────────
  if (state === 'live' && matchData) {
    return (
      <MatchView
        matchData={matchData}
        currentUser={currentUser}
        socket={socketRef.current}
        onMatchEnd={handleMatchEnd}
      />
    );
  }

  // ── My Elo from result or from currentUser ──────────────────────────────────
  const myElo = currentUser?.arenaElo ?? 1000;
  const myUsername = currentUser?.username || '';

  // ── Result panel (shown on lobby after match) ───────────────────────────────
  const ResultBanner = () => {
    if (!resultData || state !== 'result') return null;
    const won  = resultData.winner?.username === myUsername;
    const draw = resultData.isDraw;
    const myData = [resultData.user1, resultData.user2].find(u => u?.username === myUsername);
    const delta = myData?.eloDelta ?? 0;

    return (
      <div className={`mb-6 rounded-2xl p-6 text-center border shadow-2xl
        ${draw ? 'bg-slate-800/50 border-slate-500/30' : won ? 'bg-emerald-900/30 border-emerald-500/30' : 'bg-red-900/20 border-red-500/20'}`}
      >
        <div className="text-5xl mb-3">{draw ? '🤝' : won ? '🏆' : '💀'}</div>
        <h2 className="text-2xl font-extrabold text-slate-100 mb-1">
          {draw ? 'Draw!' : won ? 'You Won!' : 'You Lost!'}
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          {draw ? 'Time expired with no decisive winner.' : won ? `You solved it first!` : `${resultData.winner?.username} solved it first.`}
        </p>
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Elo Change</p>
            <p className="text-3xl font-black">
              <EloDelta delta={delta} />
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">New Elo</p>
            <p className="text-3xl font-black text-slate-100">{myData?.newElo ?? myElo}</p>
          </div>
        </div>
        <button
          onClick={() => { setState('lobby'); setResultData(null); setMatchData(null); }}
          className="mt-5 btn-primary"
        >
          Back to Lobby
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-bg-deep flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 70% 45% at 10% 0%, rgba(239,68,68,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 90% 100%, rgba(99,102,241,0.10) 0%, transparent 60%)'
        }} />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] backdrop-blur-xl bg-bg-deep/80">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-violet flex items-center justify-center text-sm font-extrabold text-white shadow-btn">R</div>
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white to-accent-violet bg-clip-text text-transparent">RankUp</span>
          </a>

          {/* Nav links */}
          <nav className="flex items-center gap-1 text-sm">
            <a href="/" className="text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">Hub</a>
            <a href="/editorials" className="text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">Editorials</a>
            <a href="/contests" className="text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">Contests</a>
            <span className="text-slate-100 font-bold px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">⚔️ Arena</span>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {currentUser && <NotificationBell />}
            {currentUser && (
              <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 text-sm px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors font-semibold">
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {/* Result banner */}
        <ResultBanner />

        {/* Page header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-extrabold text-slate-100">⚔️ CodeArena</h1>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 uppercase tracking-wider">BETA</span>
            </div>
            <p className="text-slate-400 text-sm">1v1 real-time competitive coding battles.</p>
          </div>
          {currentUser && (
            <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent-violet flex items-center justify-center text-sm font-bold text-white">
                {myUsername[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-xs text-slate-500">Your Arena Elo</p>
                <p className="text-2xl font-black text-slate-100">{myElo}</p>
              </div>
              <div className="ml-2 pl-4 border-l border-white/[0.08] text-xs text-slate-500 space-y-0.5">
                <p>W: <span className="text-emerald-400 font-bold">{currentUser?.arenaWins ?? 0}</span></p>
                <p>L: <span className="text-red-400 font-bold">{currentUser?.arenaLosses ?? 0}</span></p>
                <p>D: <span className="text-slate-300 font-bold">{currentUser?.arenaDraws ?? 0}</span></p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Queue / Searching card */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            {/* Matchmaking card */}
            <div className="card p-6 arena-gradient">
              {state === 'searching' ? (
                <div className="flex flex-col items-center text-center py-4">
                  <div className="relative mb-5">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-accent-violet flex items-center justify-center queue-pulse shadow-btn">
                      <svg className="w-9 h-9 text-white animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mb-1">Finding Opponent...</h3>
                  <p className="text-sm text-slate-400 mb-1">Looking for a player near your Elo ({myElo})</p>
                  <p className="text-xs text-slate-500 font-mono tabular-nums mb-5">
                    {String(Math.floor(queueTime / 60)).padStart(2,'0')}:{String(queueTime % 60).padStart(2,'0')}
                  </p>
                  <button
                    onClick={handleLeaveQueue}
                    className="px-6 py-2.5 rounded-xl border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-slate-100 mb-1 flex items-center gap-2">
                    <span>Join the Queue</span>
                    <span className="text-base">⚔️</span>
                  </h2>
                  <p className="text-xs text-slate-500 mb-5">Match with players within ±200 Elo of yours.</p>

                  {/* Timer selector */}
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Match Duration</p>
                    <div className="grid grid-cols-4 gap-2">
                      {MATCH_TIMERS.map(t => (
                        <button
                          key={t.value}
                          onClick={() => setTimerMinutes(t.value)}
                          className={`py-2 rounded-lg text-xs font-bold border transition-all
                            ${timerMinutes === t.value
                              ? 'bg-accent text-white border-accent shadow-btn'
                              : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
                            }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleJoinQueue}
                    disabled={!currentUser}
                    className="w-full btn-primary py-3 text-base font-bold flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5zM9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5zM10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5zM14 14.5c0 .83.67 1.5 1.5 1.5h5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5h-5c-.83 0-1.5.67-1.5 1.5z"/>
                    </svg>
                    Find Opponent
                  </button>

                  {!currentUser && (
                    <p className="text-xs text-slate-500 text-center mt-3">
                      <a href="/auth" className="text-accent hover:underline font-semibold">Log in</a> to join the arena.
                    </p>
                  )}
                </>
              )}
            </div>

            {/* How it works */}
            <div className="card p-5">
              <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                <span className="text-base">📖</span> How it Works
              </h3>
              <ol className="space-y-2.5 text-xs text-slate-400">
                {[
                  'Join the queue and get matched with a nearby-rated player.',
                  'Both players get the same Codeforces problem (suited to the weaker player\'s rating).',
                  'Solve it first to win! Use any supported language.',
                  'Elo updates based on result — win, lose, or draw.',
                ].map((step, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 border border-accent/30 text-accent text-[10px] font-bold flex items-center justify-center">{i+1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Right: Leaderboard + History */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Leaderboard */}
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.07] flex items-center gap-2">
                <span className="text-lg">🏆</span>
                <h2 className="text-base font-bold text-slate-100">Arena Leaderboard</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.05]">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-10">#</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Player</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Elo</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">W</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">L</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">CF Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingLB ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i} className="border-b border-white/[0.04]">
                          {[6, 4, 4, 4, 4, 4].map((w, j) => (
                            <td key={j} className="px-4 py-3">
                              <div className={`h-3 bg-white/10 rounded animate-pulse w-${w}/12`} />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : leaderboard.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-500 text-sm">No players yet. Be the first to compete!</td>
                      </tr>
                    ) : (
                      leaderboard.map((player, idx) => {
                        const isMe = player.username === myUsername;
                        return (
                          <tr key={player._id || idx}
                            className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]
                              ${isMe ? 'bg-accent/[0.06]' : ''}`}
                          >
                            <td className="px-6 py-3 text-xs font-bold text-slate-500">
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx+1}`}
                            </td>
                            <td className="px-4 py-3">
                              <a href={`/profile/${player.username}`} className="flex items-center gap-2 group w-fit">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-accent-violet flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                  {player.username[0].toUpperCase()}
                                </div>
                                <span className={`font-semibold group-hover:text-accent transition-colors ${isMe ? 'text-accent' : 'text-slate-200'}`}>
                                  {player.username}
                                  {isMe && <span className="ml-1 text-xs text-accent/60">(you)</span>}
                                </span>
                              </a>
                            </td>
                            <td className="px-4 py-3 text-right font-black text-slate-100 tabular-nums">{player.arenaElo}</td>
                            <td className="px-4 py-3 text-right text-emerald-400 font-bold hidden sm:table-cell">{player.arenaWins ?? 0}</td>
                            <td className="px-4 py-3 text-right text-red-400 font-bold hidden sm:table-cell">{player.arenaLosses ?? 0}</td>
                            <td className="px-4 py-3 text-right text-slate-400 hidden sm:table-cell">{player.rating ?? '—'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Match history */}
            {matchHistory.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.07] flex items-center gap-2">
                  <span className="text-lg">📜</span>
                  <h2 className="text-base font-bold text-slate-100">Your Recent Matches</h2>
                </div>
                <div className="divide-y divide-white/[0.05]">
                  {matchHistory.map(m => {
                    const iWon  = m.winner?.username === myUsername;
                    const isDraw = m.isDraw;
                    const opponent = m.user1?.username === myUsername ? m.user2 : m.user1;
                    const myDelta = m.user1?.username === myUsername ? m.user1EloDelta : m.user2EloDelta;
                    return (
                      <div key={m._id} className="flex items-center gap-4 px-6 py-3 hover:bg-white/[0.02] transition-colors">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isDraw ? 'bg-slate-500' : iWon ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-200 font-semibold truncate">
                            vs <a href={`/profile/${opponent?.username}`} className="hover:text-accent transition-colors">{opponent?.username}</a>
                            <span className="text-slate-500 font-normal text-xs ml-2">• {m.problem?.name}</span>
                          </p>
                          <p className="text-xs text-slate-500">{timeAgo(m.updatedAt)}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-xs font-bold ${isDraw ? 'text-slate-400' : iWon ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isDraw ? 'Draw' : iWon ? 'Win' : 'Loss'}
                          </p>
                          <p className="text-xs">
                            <EloDelta delta={myDelta ?? 0} />
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
