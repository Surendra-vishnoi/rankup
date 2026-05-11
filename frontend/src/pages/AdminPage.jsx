import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../apiConfig';
import GlobalSearch from '../components/GlobalSearch';
import NotificationBell from '../components/NotificationBell';

/* ── Animated floating symbols background ── */
function AnimatedBg() {
  const symbols = ['{ }', '//', '=>', '&&', '||', '===', '++', '--', '<<', '>>', '!==', '( )', '[ ]', '0x', '/**', '*/'];
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
      {symbols.map((sym, i) => (
        <span
          key={i}
          className="absolute font-mono text-emerald-500/[0.07] text-sm font-bold select-none animate-float-sym"
          style={{
            left: `${(i * 6.5) % 100}%`,
            top: `${(i * 13 + 5) % 100}%`,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${8 + (i % 5) * 2}s`,
            fontSize: `${0.65 + (i % 3) * 0.2}rem`,
          }}
        >
          {sym}
        </span>
      ))}
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: 'linear-gradient(rgba(16,185,129,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.6) 1px, transparent 1px)',
        backgroundSize: '48px 48px'
      }} />
      {/* Glow orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 -right-20 w-80 h-80 bg-emerald-500/4 rounded-full blur-3xl" />
    </div>
  );
}

/* ── Role badge ── */
function RoleBadge({ label, color }) {
  const colors = {
    admin: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    coord: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    wing:  'bg-amber-500/10 text-amber-400 border-amber-500/30',
    member:'text-slate-600 border-transparent bg-transparent',
  };
  return <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${colors[color]}`}>{label}</span>;
}

/* ── Stat card ── */
function StatCard({ icon, label, value, accent }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 group hover:-translate-y-0.5 transition-all duration-300 ${accent}`}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{background:'linear-gradient(135deg,rgba(16,185,129,0.04),transparent)'}} />
      <div className="flex items-center gap-3 relative z-10">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-2xl font-black text-white font-mono tracking-tight">{value}</p>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mt-0.5">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [authState, setAuthState] = useState('checking');
  const [activeTab, setActiveTab] = useState('roles');
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [form, setForm] = useState({ isAdmin: false, isCoordinator: false, isWingMember: true, customTitle: '' });

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/verify`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setAuthState(data.isAuthenticated && data.user?.isAdmin ? 'authorized' : 'denied'))
      .catch(() => setAuthState('denied'));
  }, []);

  const fetchAllUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users`, { credentials: 'include' });
      if (res.ok) { const data = await res.json(); setUsersList(data.users || []); }
    } catch (err) { console.error('Failed to fetch users', err); }
    finally { setUsersLoading(false); }
  };

  useEffect(() => {
    if (authState === 'authorized' && activeTab === 'users') fetchAllUsers();
  }, [authState, activeTab]);

  const handleUpdateRoles = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await fetch(`${API_BASE}/api/users/${username.trim()}/roles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include'
      });
      const data = await res.json();
      setStatus(res.ok
        ? { type: 'success', message: `Successfully updated roles for ${username}.` }
        : { type: 'error', message: data.message || 'Update failed.' });
    } catch { setStatus({ type: 'error', message: 'Network error occurred.' }); }
    finally { setLoading(false); }
  };

  const handleFetchUser = async () => {
    if (!username.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/users/${username.trim()}`);
      if (r.ok) {
        const u = await r.json();
        setForm({ isAdmin: u.isAdmin||false, isCoordinator: u.isCoordinator||false, isWingMember: u.isWingMember||false, customTitle: u.customTitle||'' });
        setStatus({ type: 'success', message: `Loaded data for ${u.username}.` });
      } else { setStatus({ type: 'error', message: 'User not found.' }); }
    } catch { setStatus({ type: 'error', message: 'Failed to fetch user.' }); }
    finally { setLoading(false); }
  };

  const filteredUsers = usersList.filter(u =>
    u.username.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (u.cfHandle && u.cfHandle.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const admins  = usersList.filter(u => u.isAdmin).length;
  const coords  = usersList.filter(u => u.isCoordinator).length;
  const wings   = usersList.filter(u => u.isWingMember).length;

  /* ── Loading state ── */
  if (authState === 'checking') return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center">
      <AnimatedBg />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
        <p className="text-sm text-slate-500 font-mono">Verifying credentials...</p>
      </div>
    </div>
  );

  /* ── Access denied state ── */
  if (authState === 'denied') return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center px-6">
      <AnimatedBg />
      <div className="relative z-10 max-w-md w-full rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4 text-3xl">🚫</div>
        <h1 className="text-xl font-extrabold text-red-400 mb-2">Access Denied</h1>
        <p className="text-sm text-slate-400 mb-6">You are not authorized to access the Admin Console.</p>
        <a href="/hub" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-white transition-colors">← Return to Hub</a>
      </div>
    </div>
  );

  const TABS = [
    { key: 'roles', label: 'Role Management', icon: '🛡️' },
    { key: 'users', label: 'All Users',        icon: '👥' },
  ];

  return (
    <div className="min-h-screen bg-bg-deep text-slate-100 relative">
      <AnimatedBg />

      {/* ── Hero Header ── */}
      <div className="relative z-10 border-b border-white/[0.06] bg-bg-deep/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/10">
                🛡️
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500/70 font-mono">RankUp System</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-emerald-500/60">ONLINE</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Admin Console</h1>
                <p className="text-xs text-slate-500 mt-0.5">Restricted access · Administration enabled</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <GlobalSearch />
              {authState === 'authorized' && <NotificationBell />}
              <a href="/hub" className="text-xs font-bold text-slate-500 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/10 hover:bg-white/5">← Hub</a>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">

        {/* ── Stats Row (only shown on users tab when data loaded) ── */}
        {activeTab === 'users' && usersList.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatCard icon="👤" label="Total Users"  value={usersList.length} accent="border-white/[0.07] bg-bg-surface/60" />
            <StatCard icon="👑" label="Admins"       value={admins}           accent="border-yellow-500/15 bg-yellow-500/5" />
            <StatCard icon="🎯" label="Coordinators" value={coords}           accent="border-rose-500/15 bg-rose-500/5" />
            <StatCard icon="⭐" label="Wing Members" value={wings}            accent="border-amber-500/15 bg-amber-500/5" />
          </div>
        )}

        {/* ── Tab Switcher ── */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-6 w-full sm:w-auto inline-flex">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200
                ${activeTab === t.key
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-inner'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
            >
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* ── Role Management Tab ── */}
        {activeTab === 'roles' && (
          <div className="max-w-2xl">
            <div className="rounded-2xl border border-white/[0.07] bg-bg-surface/40 backdrop-blur-xl shadow-2xl overflow-hidden">
              {/* Card header bar */}
              <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3 bg-white/[0.02]">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">User Role Editor</span>
              </div>

              <form onSubmit={handleUpdateRoles} className="p-6 flex flex-col gap-6">

                {/* Username + Fetch */}
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">Target Username</label>
                    <div className="relative group">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">@</span>
                      <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full bg-bg-deep border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all hover:border-white/15 font-mono"
                        placeholder="exact_username"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleFetchUser}
                    disabled={loading}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-sm font-bold text-slate-300 transition-all duration-200 disabled:opacity-50 whitespace-nowrap"
                  >
                    {loading ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin"/>Loading</span> : '⬇ Fetch Data'}
                  </button>
                </div>

                {/* Role Toggles */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 font-mono">Role Flags</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { key:'isAdmin',       label:'Admin',       icon:'👑', accent:'yellow' },
                      { key:'isCoordinator', label:'Coordinator', icon:'🎯', accent:'rose' },
                      { key:'isWingMember',  label:'Wing Member', icon:'⭐', accent:'amber' },
                    ].map(({ key, label, icon, accent }) => {
                      const checked = form[key];
                      const colors = { yellow:'border-yellow-500/40 bg-yellow-500/10 text-yellow-400', rose:'border-rose-500/40 bg-rose-500/10 text-rose-400', amber:'border-amber-500/40 bg-amber-500/10 text-amber-400' };
                      return (
                        <label key={key}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 group
                            ${checked ? colors[accent] : 'border-white/[0.06] bg-white/[0.02] text-slate-500 hover:border-white/10 hover:bg-white/[0.04]'}`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0
                            ${checked ? `border-current bg-current/20` : 'border-white/20 bg-transparent'}`}>
                            {checked && <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                          </div>
                          <input type="checkbox" checked={form[key]} onChange={e => setForm({...form, [key]: e.target.checked})} className="hidden" />
                          <span className="text-sm font-bold">{icon} {label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Title */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">Custom Title</label>
                  <input
                    type="text"
                    value={form.customTitle}
                    onChange={e => setForm({...form, customTitle: e.target.value})}
                    className="w-full bg-bg-deep border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all hover:border-white/15"
                    placeholder="e.g. Master Coordinator"
                  />
                </div>

                {/* Status message */}
                {status.message && (
                  <div className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-semibold
                    ${status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    <span>{status.type === 'success' ? '✅' : '❌'}</span>
                    {status.message}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !username.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-extrabold text-sm uppercase tracking-wider transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed
                    bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-bg-deep shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5"
                >
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-bg-deep/30 border-t-bg-deep rounded-full animate-spin" />Processing…</>
                    : <><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Update Privileges</>
                  }
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── All Users Tab ── */}
        {activeTab === 'users' && (
          <div className="rounded-2xl border border-white/[0.07] bg-bg-surface/40 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.02] flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">
                  User Registry · <span className="text-emerald-400">{usersList.length} total</span>
                </span>
              </div>
              <div className="relative w-full sm:w-64">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  className="w-full bg-bg-deep border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                />
              </div>
            </div>

            {usersLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                  <span className="text-xs text-slate-500 font-mono">Loading users...</span>
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-20 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-slate-500 font-semibold text-sm">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {['Username','CF Handle','Rating','Roles','Joined'].map(h => (
                        <th key={h} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono bg-white/[0.01]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredUsers.map(u => (
                      <tr key={u._id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-5 py-3.5">
                          <a href={`/profile/${u.username}`} className="font-bold text-slate-200 hover:text-emerald-400 transition-colors flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0">
                              {u.username[0].toUpperCase()}
                            </div>
                            {u.username}
                          </a>
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">{u.cfHandle || '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className={`font-bold font-mono text-xs ${u.rating >= 2400 ? 'text-red-400' : u.rating >= 2100 ? 'text-orange-400' : u.rating >= 1900 ? 'text-purple-400' : u.rating >= 1600 ? 'text-blue-400' : u.rating >= 1400 ? 'text-cyan-400' : u.rating >= 1200 ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {u.rating || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex gap-1.5 flex-wrap">
                            {u.isAdmin        && <RoleBadge label="Admin"  color="admin" />}
                            {u.isCoordinator  && <RoleBadge label="Coord"  color="coord" />}
                            {u.isWingMember   && <RoleBadge label="Wing"   color="wing"  />}
                            {!u.isAdmin && !u.isCoordinator && !u.isWingMember && <RoleBadge label="Member" color="member" />}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes floatSym {
          0%   { transform: translateY(0px) rotate(0deg); opacity: 0.6; }
          50%  { transform: translateY(-18px) rotate(3deg); opacity: 1; }
          100% { transform: translateY(0px) rotate(0deg); opacity: 0.6; }
        }
        .animate-float-sym { animation: floatSym 8s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
