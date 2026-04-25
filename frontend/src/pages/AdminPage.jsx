import { useState, useEffect } from 'react';
import { API_BASE } from '../apiConfig';

export default function AdminPage() {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [authState, setAuthState] = useState('checking'); // 'checking' | 'authorized' | 'denied'
  const [activeTab, setActiveTab] = useState('roles'); // 'roles' | 'users'
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const [form, setForm] = useState({
    isAdmin: false,
    isCoordinator: false,
    isWingMember: true,
    customTitle: ''
  });

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/verify`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (data.isAuthenticated && data.user?.isAdmin) {
          setAuthState('authorized');
        } else {
          setAuthState('denied');
        }
      })
      .catch(() => setAuthState('denied'));
  }, []);

  const fetchAllUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (authState === 'authorized' && activeTab === 'users') {
      fetchAllUsers();
    }
  }, [authState, activeTab]);

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
      if (res.ok) {
        setStatus({ type: 'success', message: `Successfully updated roles for ${username}.` });
      } else {
        setStatus({ type: 'error', message: data.message || 'Update failed.' });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Network error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = usersList.filter(u => 
    u.username.toLowerCase().includes(searchFilter.toLowerCase()) || 
    (u.cfHandle && u.cfHandle.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="min-h-screen pt-24 px-6 max-w-4xl mx-auto flex flex-col items-center pb-20">
      <div className="card w-full p-8 border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-amber-500/5 shadow-[0_0_40px_rgba(234,179,8,0.1)]">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mb-4 border border-yellow-500/50 text-3xl shadow-gold">
            👑
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">RankUp Admin Console</h1>
          <p className="text-sm text-yellow-500/80 font-bold tracking-wide">Restricted Access Level. Administration enabled.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-white/10 mb-6">
          <button 
            onClick={() => setActiveTab('roles')} 
            className={`pb-3 text-sm font-bold transition-all whitespace-nowrap border-b-2 tracking-wide px-2 ${activeTab === 'roles' ? 'border-yellow-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            User Role Management
          </button>
          <button 
            onClick={() => setActiveTab('users')} 
            className={`pb-3 text-sm font-bold transition-all whitespace-nowrap border-b-2 tracking-wide px-2 ${activeTab === 'users' ? 'border-yellow-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            All Users List
          </button>
        </div>

        {activeTab === 'roles' && (
          <div className="bg-bg-deep/50 rounded-2xl p-6 md:p-8 border border-white/5 shadow-inner-dark animate-fade-up">
            <form onSubmit={handleUpdateRoles} className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Target Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-field py-3 placeholder:text-slate-600 bg-bg-surface border-white/10 text-white shadow-inner-dark"
                    placeholder="Enter exact RankUp username"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!username.trim()) return;
                    setLoading(true);
                    try {
                      const r = await fetch(`${API_BASE}/api/users/${username.trim()}`);
                      if (r.ok) {
                        const u = await r.json();
                        setForm({
                          isAdmin: u.isAdmin || false,
                          isCoordinator: u.isCoordinator || false,
                          isWingMember: u.isWingMember || false,
                          customTitle: u.customTitle || ''
                        });
                        setStatus({ type: 'success', message: `Loaded data for ${u.username}.` });
                      } else {
                        setStatus({ type: 'error', message: 'User not found.' });
                      }
                    } catch (err) {
                      setStatus({ type: 'error', message: 'Failed to fetch user.' });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-bold transition-colors border border-white/5"
                  disabled={loading}
                >
                  Fetch Data
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-black/20 p-5 rounded-xl border border-white/5">
                <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <input type="checkbox" checked={form.isAdmin} onChange={e => setForm({...form, isAdmin: e.target.checked})} className="w-4 h-4 accent-yellow-500" />
                  <span className="text-sm font-bold text-slate-300">Is Admin</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <input type="checkbox" checked={form.isCoordinator} onChange={e => setForm({...form, isCoordinator: e.target.checked})} className="w-4 h-4 accent-rose-500" />
                  <span className="text-sm font-bold text-slate-300">Is Coordinator</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <input type="checkbox" checked={form.isWingMember} onChange={e => setForm({...form, isWingMember: e.target.checked})} className="w-4 h-4 accent-amber-500" />
                  <span className="text-sm font-bold text-slate-300">Is Wing Member</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Custom Title</label>
                <input
                  type="text"
                  value={form.customTitle}
                  onChange={(e) => setForm({...form, customTitle: e.target.value})}
                  className="input-field py-3 placeholder:text-slate-600 bg-bg-surface border-white/10 text-white shadow-inner-dark"
                  placeholder="e.g. Master Coordinator"
                />
              </div>
              
              {status.message && (
                <div className={`p-4 rounded-xl text-sm font-bold border flex items-center gap-3 ${status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  {status.type === 'success' ? '✅' : '❌'} {status.message}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading || !username.trim()}
                className="mt-4 w-full flex items-center justify-center py-3.5 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-500 hover:to-amber-400 text-bg-deep font-extrabold text-sm shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-bg-deep/30 border-t-bg-deep rounded-full animate-spin" />
                ) : (
                  'Update User Privileges'
                )}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-bg-deep/50 rounded-2xl p-6 border border-white/5 shadow-inner-dark animate-fade-up flex flex-col min-h-[400px]">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                👥 Total Users: <span className="text-yellow-500">{usersList.length}</span>
              </h2>
              <input
                type="text"
                placeholder="Search users..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="input-field py-2 max-w-xs shadow-inner-dark bg-bg-surface"
              />
            </div>

            {usersLoading ? (
              <div className="m-auto w-8 h-8 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
            ) : filteredUsers.length === 0 ? (
              <div className="m-auto text-center text-slate-500 font-semibold text-sm">No users found.</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/20 custom-scrollbar flex-1">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 font-bold border-b border-white/5">Username</th>
                      <th className="px-4 py-3 font-bold border-b border-white/5">CF Handle</th>
                      <th className="px-4 py-3 font-bold border-b border-white/5">Rating</th>
                      <th className="px-4 py-3 font-bold border-b border-white/5">Roles</th>
                      <th className="px-4 py-3 font-bold border-b border-white/5">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map(u => (
                      <tr key={u._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-200">
                           <a href={`/profile/${u.username}`} className="hover:text-yellow-400">{u.username}</a>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{u.cfHandle || '-'}</td>
                        <td className="px-4 py-3 font-semibold">
                           <span className={u.rating >= 2400 ? 'text-red-500' : u.rating >= 2100 ? 'text-orange-400' : u.rating >= 1900 ? 'text-purple-400' : u.rating >= 1600 ? 'text-blue-400' : u.rating >= 1400 ? 'text-cyan-400' : u.rating >= 1200 ? 'text-green-400' : 'text-slate-400'}>
                             {u.rating || 'Unrated'}
                           </span>
                        </td>
                        <td className="px-4 py-3 flex gap-1.5 flex-wrap">
                          {u.isAdmin && <span className="text-[9px] uppercase tracking-wider font-bold bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/20">Admin</span>}
                          {u.isCoordinator && <span className="text-[9px] uppercase tracking-wider font-bold bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/20">Coord</span>}
                          {u.isWingMember && <span className="text-[9px] uppercase tracking-wider font-bold bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20">Wing</span>}
                          {!u.isAdmin && !u.isCoordinator && !u.isWingMember && <span className="text-[9px] uppercase tracking-wider font-bold text-slate-600">Member</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-8 pt-6 border-t border-white/5 text-center flex items-center justify-center gap-3">
            <a href="/" className="text-sm font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-wider">← Return to Hub</a>
        </div>
      </div>
    </div>
  );
}
