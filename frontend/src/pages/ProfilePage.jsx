import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../apiConfig';
import { cfRankColor } from '../utils/cfRank.js';
import GlobalSearch from '../components/GlobalSearch';
import NotificationBell from '../components/NotificationBell';
import Navbar from '../components/Navbar';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Skeleton({ className }) {
  return <div className={`animate-pulse bg-white/10 rounded ${className}`} />;
}

function StatCard({ label, value, icon, color = 'text-slate-100' }) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-md border border-white/[0.05] rounded-2xl p-5 flex flex-col relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300 cursor-default">
      <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/[0.02] rounded-full group-hover:scale-150 transition-transform duration-500"></div>
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{label}</div>
        <div className="text-xl group-hover:scale-110 group-hover:rotate-12 transition-transform origin-center">{icon}</div>
      </div>
      <div className={`text-2xl font-extrabold font-mono ${color} relative z-10`}>{value ?? '—'}</div>
    </div>
  );
}

const ACTIVITY_TABS = [
  { key: 'posts', label: 'Discussions', emoji: '📝' },
  { key: 'editorials', label: 'Editorials', emoji: '⭐' },
  { key: 'comments', label: 'Comments', emoji: '💬' },
];

export default function ProfilePage() {
  // Extract username from path: /profile/:username
  const username = window.location.pathname.split('/profile/')[1]?.split('?')[0] || '';

  const [profile, setProfile] = useState(null);
  const [activity, setActivity] = useState({ posts: [], editorials: [], comments: [] });
  const [cfStats, setCfStats] = useState({ rating: null, rank: null });
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [actLoading, setActLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showEditRoles, setShowEditRoles] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangeUsername, setShowChangeUsername] = useState(false);
  const [showEditLinks, setShowEditLinks] = useState(false);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('File is too large. Maximum size is 2MB.');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64Data = ev.target.result;
      fetch(`${API_BASE}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ avatarUrl: base64Data })
      })
        .then(r => r.json())
        .then(() => {
          setProfile(prev => prev ? { ...prev, user: { ...prev.user, avatarUrl: base64Data } } : prev);
          setUploading(false);
        })
        .catch(err => {
          console.error(err);
          alert('Failed to upload image');
          setUploading(false);
        });
    };
    reader.readAsDataURL(file);
  };
  // Fetch current session
  useEffect(() => {
    fetch(`${API_BASE}/api/auth/verify`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.isAuthenticated) setCurrentUser(d.user); })
      .catch(() => { });
  }, []);


  // Fetch user profile from our backend
  useEffect(() => {
    if (!username) { setError('No username provided.'); setLoading(false); return; }
    setLoading(true);
    fetch(`${API_BASE}/api/users/${encodeURIComponent(username)}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => { setProfile(data); setLoading(false); })
      .catch(status => {
        setError(status === 404 ? `User "${username}" not found.` : 'Failed to load profile.');
        setLoading(false);
      });
  }, [username]);

  // Fetch activity feed
  useEffect(() => {
    if (!username) return;
    setActLoading(true);
    fetch(`${API_BASE}/api/users/${encodeURIComponent(username)}/activity`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setActivity(data);
        setActLoading(false);
        if (data.posts?.length === 0) {
          if (data.editorials?.length > 0) setActiveTab('editorials');
          else if (data.comments?.length > 0) setActiveTab('comments');
        }
      })
      .catch(() => setActLoading(false));
  }, [username]);

  // Fetch live CF stats
  useEffect(() => {
    if (!profile?.user?.cfHandle) return;
    const handle = profile.user.cfHandle;
    fetch(`https://codeforces.com/api/user.info?handles=${handle}`)
      .then(r => r.json())
      .then(info => {
        const cfUser = info?.result?.[0];
        setCfStats({
          rating: cfUser?.rating ?? null,
          rank: cfUser?.rank ?? null,
        });
      })
      .catch(() => { });
  }, [profile]);

  const user = profile?.user;
  const stats = profile?.stats;
  const color = cfRankColor(cfStats.rank || user?.rank || '');
  const isOwn = currentUser && user && currentUser.username === user.username;

  // Fire streak update when the logged-in user visits their OWN profile
  useEffect(() => {
    if (!isOwn) return;
    fetch(`${API_BASE}/api/users/streak`, { method: 'POST', credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setProfile(prev => prev ? {
            ...prev,
            user: { ...prev.user, streakCount: d.streakCount, maxStreak: d.maxStreak }
          } : prev);
        }
      })
      .catch(() => {});
  }, [isOwn]);

  // Derived real values from backend
  const bio = user?.bio || '';
  const streak = user?.streakCount ?? 0;
  const maxStreak = user?.maxStreak ?? 0;
  const contestsParticipated = user?.contestsParticipated ?? 0;
  const profileViews = user?.profileViews ?? 0;
  const lastActiveAt = user?.lastActiveAt;

  // Achievements derived from real data
  const achievements = [];
  if (maxStreak >= 7) achievements.push({ title: `${maxStreak} Day Max Streak`, icon: '🔥', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30' });
  if (user?.isVerified) achievements.push({ title: 'CF Verified', icon: '✅', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' });
  if ((stats?.medals?.gold || 0) > 0) achievements.push({ title: `${stats.medals.gold} Contest Win${stats.medals.gold > 1 ? 's' : ''}`, icon: '🥇', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30' });
  if (user?.isWingMember || user?.isCoordinator) achievements.push({ title: user.isCoordinator ? 'Coordinator' : 'Wing Member', icon: '⭐', color: 'text-yellow-300', bg: 'bg-yellow-300/10', border: 'border-yellow-300/30' });
  if ((stats?.postCount || 0) + (stats?.editorialCount || 0) >= 10) achievements.push({ title: '10+ Posts', icon: '📝', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30' });

  // Activity grid based on user active dates
  const renderContributionGrid = () => {
    const weeks = 14;
    const days = weeks * 7;
    const activeSet = new Set();
    const now = new Date();
    // Neutralize time to match UTC dates from backend properly
    const nowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    if (user?.activeDates) {
      user.activeDates.forEach(dateStr => {
        const parts = dateStr.split('-');
        if(parts.length === 3) {
           const d = new Date(Date.UTC(parts[0], parts[1]-1, parts[2]));
           const diffDays = Math.round((nowUTC - d) / 86400000);
           if (diffDays >= 0 && diffDays < days) activeSet.add(diffDays);
        }
      });
    }
    const grid = [];
    for (let i = days - 1; i >= 0; i--) {
      const active = activeSet.has(i);
      const colorClass = active ? 'bg-emerald-500' : 'bg-white/5';
      grid.push(<div key={i} className={`w-3 h-3 rounded-sm ${colorClass} transition-colors hover:ring-1 hover:ring-emerald-400/60`} title={active ? 'Active' : 'No activity'} />);
    }
    return (
      <div className="overflow-x-auto pb-2">
        <div className="grid grid-rows-7 grid-flow-col gap-1 w-max">
          {grid}
        </div>
        <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-white/5" />
          <div className="w-3 h-3 rounded-sm bg-emerald-500/40" />
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span>More</span>
        </div>
      </div>
    );
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
      window.location.reload();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (error) return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center">
      <div className="card p-8 text-center max-w-sm border border-white/[0.05] shadow-xl">
        <div className="text-5xl mb-4 animate-bounce">😕</div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Profile Not Found</h2>
        <p className="text-slate-500 text-sm mb-6">{error}</p>
        <a href="/hub" className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold transition-colors inline-block">Back to Hub</a>
      </div>
    </div>
  );


  const coursesEnrolled = user?.coursesEnrolled ?? 0;

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200 selection:bg-emerald-500/30 font-sans">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.08)_0%,transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      </div>

      <Navbar user={currentUser} middle={<GlobalSearch />} />

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-10 animate-[fadeIn_0.5s_ease-out]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
             <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
             <p className="text-sm font-semibold text-slate-400 animate-pulse">Loading profile...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            
            {/* Top Section: Hero Card */}
            <div className="relative rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-white/[0.05] shadow-2xl overflow-hidden group">
              {/* Banner / Header pattern */}
              <div className="h-32 sm:h-44 w-full bg-gradient-to-r from-emerald-900/50 via-emerald-800/20 to-teal-900/40 relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                <div className="absolute -bottom-16 right-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-[60px]"></div>
              </div>
              
              <div className="px-6 sm:px-10 pb-8 relative z-10 flex flex-col sm:flex-row gap-6 sm:gap-8 sm:items-end -mt-12 sm:-mt-16">
                {/* Avatar */}
                <div className="relative group/avatar shrink-0">
                  <div
                    className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl flex items-center justify-center text-5xl font-extrabold text-white shadow-2xl overflow-hidden border-4 border-[#0B1120] relative z-10 ring-4 ring-emerald-500/10 bg-[#0B1120]"
                    style={{
                      background: user?.isWingMember
                        ? 'linear-gradient(135deg, #eab308, #d97706)'
                        : `linear-gradient(135deg, ${color}cc, ${color}55)`
                    }}
                  >
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-105" />
                    ) : (
                      (user?.username || '?')[0].toUpperCase()
                    )}
                  </div>
                  {isOwn && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 z-20 bg-black/60 rounded-3xl flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer text-sm font-bold text-white backdrop-blur-sm"
                    >
                      {uploading ? (
                        <span className="flex items-center gap-2 animate-pulse"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Uploading...</span>
                      ) : (
                        <span className="flex items-center gap-2"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>Edit</span>
                      )}
                    </button>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                </div>

                {/* User Info */}
                <div className="flex-1 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-2">
                  <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{user?.username}</h1>
                      <div className="flex items-center gap-2">
                        {user?.isAdmin && <span className="px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-widest shadow-sm">Admin</span>}
                        {user?.isCoordinator ? <span className="px-2.5 py-1 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-widest shadow-sm">Coordinator</span> : user?.isWingMember && <span className="px-2.5 py-1 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-bold uppercase tracking-widest shadow-sm">Wing</span>}
                        {user?.isVerified && <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest shadow-sm">Verified</span>}
                      </div>
                    </div>

                    {user?.cfHandle && (
                      <a
                        href={`https://codeforces.com/profile/${user.cfHandle}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-white transition-colors"
                        style={{ color }}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                        {user.cfHandle}
                        {(cfStats.rank || user.rank) && (
                          <span className="opacity-70 ml-1 text-xs uppercase tracking-wider font-bold">· {cfStats.rank || user.rank}</span>
                        )}
                      </a>
                    )}
                    
                    <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
                      {bio || "Passionate developer & problem solver. Building the future one line of code at a time."}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                    {isOwn ? (
                      <div className="flex items-center gap-2 w-full">
                        <button onClick={() => setShowChangeUsername(true)} className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold text-slate-300 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors shadow-sm">Username</button>
                        <button onClick={() => setShowChangePassword(true)} className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold text-slate-300 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors shadow-sm">Password</button>
                        <button onClick={handleLogout} className="p-2 rounded-xl text-red-400 bg-red-400/10 hover:bg-red-400/20 hover:scale-105 transition-all shadow-sm" title="Logout"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg></button>
                      </div>
                    ) : currentUser ? (
                      <div className="flex items-center gap-2 w-full">
                        <button
                          onClick={async () => {
                            const action = stats?.isFollowing ? 'unfollow' : 'follow';
                            try {
                              const r = await fetch(`${API_BASE}/api/users/${user.username}/${action}`, { method: 'POST', credentials: 'include' });
                              if (r.ok) {
                                setProfile(prev => ({ ...prev, stats: { ...prev.stats, isFollowing: !prev.stats.isFollowing, followersCount: prev.stats.followersCount + (action === 'follow' ? 1 : -1) } }));
                              }
                            } catch (err) { }
                          }}
                          className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${stats?.isFollowing ? 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10' : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] hover:-translate-y-0.5'}`}
                        >
                          {stats?.isFollowing ? 'Following' : 'Follow'}
                        </button>
                        <button
                          onClick={() => window.dispatchEvent(new CustomEvent('open-chat', { detail: { username: user.username, avatarUrl: user.avatarUrl, rank: cfStats.rank || user.rank } }))}
                          className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-bold border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                          Message
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              
              {/* Left Column (Meta, Skills, Achievements) */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* Meta Info */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-white/[0.05] rounded-2xl p-6 shadow-lg">
                  <h3 className="text-[10px] font-extrabold text-slate-500 mb-5 uppercase tracking-widest">About Member</h3>
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg></div>
                      <div><p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Joined</p><p className="text-slate-200 font-semibold">{new Date(user?.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p></div>
                    </div>
                    {lastActiveAt && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg></div>
                        <div><p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Last Active</p><p className="text-slate-200 font-semibold">{timeAgo(lastActiveAt)}</p></div>
                      </div>
                    )}
                  </div>
                </div>



                {/* Achievements */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-white/[0.05] rounded-2xl p-6 shadow-lg">
                  <h3 className="text-[10px] font-extrabold text-slate-500 mb-5 uppercase tracking-widest">Badges & Achievements</h3>
                  {achievements.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No achievements unlocked yet.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {achievements.map((ach, idx) => (
                        <div key={idx} className={`flex items-center gap-4 p-3.5 rounded-xl border ${ach.border} ${ach.bg} hover:scale-[1.02] transition-transform origin-left shadow-sm`}>
                          <div className={`w-11 h-11 rounded-full ${ach.bg} flex items-center justify-center text-2xl shrink-0 shadow-inner`}>{ach.icon}</div>
                          <div>
                            <p className={`text-sm font-extrabold ${ach.color}`}>{ach.title}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">Unlocked</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Social Links Box */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-white/[0.05] rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Social & Coding Profiles</h3>
                    {isOwn && (
                      <button onClick={() => setShowEditLinks(true)} className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest hover:text-emerald-300 transition-colors">Edit Links</button>
                    )}
                  </div>
                  {!user?.socialLinks || Object.values(user.socialLinks).every(v => !v) ? (
                    <p className="text-sm text-slate-500 italic">No profile links added yet.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {Object.entries(user.socialLinks).filter(([_, val]) => val).map(([key, url]) => (
                        <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.05] hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition-colors capitalize text-xs font-bold shrink-0">
                            {key[0]}
                          </div>
                          <span className="text-sm font-semibold text-slate-300 group-hover:text-emerald-400 transition-colors capitalize">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <svg className="w-4 h-4 ml-auto text-slate-600 group-hover:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column (Stats, Activity Graph, Tabs) */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard icon="⚡" label="CF Rating" value={cfStats.rating ?? user?.rating ?? '—'} color="text-emerald-400" />
                  <StatCard icon="🔥" label="Streak" value={streak > 0 ? `${streak}d` : '0d'} color="text-orange-400" />
                  <StatCard icon="🏆" label="Contests" value={contestsParticipated} />
                  <StatCard icon="👥" label="Followers" value={stats?.followersCount ?? 0} />
                  <StatCard icon="💚" label="Karma" value={user?.karma != null ? `+${user.karma}` : '0'} color="text-emerald-400" />
                  <StatCard icon="📝" label="Posts" value={(stats?.postCount ?? 0) + (stats?.editorialCount ?? 0)} />
                  <StatCard icon="💬" label="Comments" value={stats?.commentCount ?? 0} />
                </div>

                {/* Contribution Graph */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-white/[0.05] rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Contribution Graph</h3>
                    <div className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">Last 14 Weeks</div>
                  </div>
                  {renderContributionGrid()}
                </div>

                {/* Activity Feed */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-white/[0.05] rounded-2xl flex-1 flex flex-col overflow-hidden shadow-lg min-h-[300px]">
                  <div className="flex border-b border-white/[0.05] overflow-x-auto hide-scrollbar bg-white/[0.01]">
                    {ACTIVITY_TABS.map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 flex items-center justify-center gap-2.5 px-6 py-4 text-sm font-bold transition-all border-b-2 -mb-px whitespace-nowrap
                          ${activeTab === tab.key
                            ? 'text-emerald-400 border-emerald-400 bg-emerald-400/5'
                            : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/[0.02]'
                          }`}
                      >
                        <span className="text-lg">{tab.emoji}</span>
                        <span>{tab.label}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold
                          ${activeTab === tab.key ? 'bg-emerald-400/20 text-emerald-400' : 'bg-white/10 text-slate-400'}`}>
                          {activity[tab.key]?.length ?? 0}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="p-6 flex-1">
                    {actLoading ? (
                      <div className="flex flex-col gap-4">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="animate-pulse flex flex-col gap-3 p-5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                        ))}
                      </div>
                    ) : activeTab === 'posts' ? (
                      <PostsTab posts={activity.posts} currentUser={currentUser} />
                    ) : activeTab === 'editorials' ? (
                      <EditorialsTab editorials={activity.editorials} currentUser={currentUser} />
                    ) : (
                      <CommentsTab comments={activity.comments} />
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </main>

      {/* Edit Roles Modal */}
      {showEditRoles && (
        <EditRolesModal
          user={user}
          onClose={() => setShowEditRoles(false)}
          onSuccess={() => window.location.reload()}
        />
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}

      {/* Change Username Modal */}
      {showChangeUsername && (
        <ChangeUsernameModal
          onClose={() => setShowChangeUsername(false)}
          currentUsername={user?.username}
        />
      )}

      {/* Edit Social Links Modal */}
      {showEditLinks && (
        <EditLinksModal
          currentLinks={user?.socialLinks || {}}
          onClose={() => setShowEditLinks(false)}
          onSuccess={(updatedLinks) => {
            setProfile((prev) =>
              prev
                ? {
                    ...prev,
                    user: {
                      ...prev.user,
                      socialLinks: updatedLinks,
                    },
                  }
                : prev
            );
          }}
        />
      )}
    </div>
  );
}

const CAT_COLOR = {
  Insight: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  Doubt: 'text-red-400 bg-red-400/10 border-red-400/30',
  General: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
};
const CAT_EMOJI = { Insight: '💡', Doubt: '🐛', General: '☕' };

function PostsTab({ posts, currentUser }) {
  if (!posts.length) return <EmptyState icon="📝" text="No posts yet." />;
  return (
    <div className="flex flex-col gap-3">
      {posts.map(p => (
        <a
          key={p._id}
          href={`/post/${p._id}`}
          className="flex flex-col gap-2 p-4 rounded-xl border border-white/[0.06] hover:border-accent/30 hover:bg-white/[0.02] transition-all group"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${CAT_COLOR[p.category] || CAT_COLOR.General}`}>
              {CAT_EMOJI[p.category]} {p.category}
            </span>
            <span className="text-xs text-slate-500 ml-auto">{timeAgo(p.createdAt)}</span>
          </div>
          <p className="text-sm font-semibold text-slate-200 group-hover:text-accent transition-colors line-clamp-2">{p.title}</p>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" /><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg>
              {p.upvotes?.length ?? 0} upvotes
            </span>
            {currentUser?.isAdmin && (
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!window.confirm('Delete post?')) return;
                  await fetch(`${API_BASE}/api/posts/${p._id}`, { method: 'DELETE', credentials: 'include' });
                  window.location.reload();
                }}
                className="ml-auto text-red-400 hover:text-red-300 font-bold"
              >
                Delete
              </button>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}

function EditorialsTab({ editorials, currentUser }) {
  if (!editorials.length) return <EmptyState icon="⭐" text="No editorials yet." />;
  return (
    <div className="flex flex-col gap-3">
      {editorials.map(e => (
        <a
          key={e._id}
          href={`/editorial/${e._id}`}
          className="flex flex-col gap-2 p-4 rounded-xl border border-yellow-500/20 hover:border-yellow-400/40 hover:bg-yellow-500/[0.03] transition-all group"
          style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.04) 0%, transparent 60%)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400">
              ⭐ Editorial
            </span>
            {e.questionNumber && (
              <span className="text-xs font-mono text-slate-400">
                {e.questionNumber.startsWith('http') ? 'Problem Link ↗' : `CF ${e.questionNumber}`}
              </span>
            )}
            <span className="text-xs text-slate-500 ml-auto">{timeAgo(e.createdAt)}</span>
          </div>
          <p className="text-sm font-semibold text-yellow-50 group-hover:text-yellow-300 transition-colors line-clamp-2">{e.title}</p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">{e.upvotes?.length ?? 0} upvotes</p>
            {currentUser?.isAdmin && (
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!window.confirm('Delete editorial?')) return;
                  await fetch(`${API_BASE}/api/editorials/${e._id}`, { method: 'DELETE', credentials: 'include' });
                  window.location.reload();
                }}
                className="text-red-400 hover:text-red-300 text-xs font-bold"
              >
                Delete
              </button>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}

function CommentsTab({ comments }) {
  if (!comments.length) return <EmptyState icon="💬" text="No comments yet." />;
  return (
    <div className="flex flex-col gap-3">
      {comments.map(c => (
        <div
          key={c._id}
          className="flex flex-col gap-1.5 p-4 rounded-xl border border-white/[0.06] hover:border-white/10 transition-all"
        >
          {c.post && (
            <a
              href={`/?post=${c.post._id}`}
              className="text-xs text-slate-500 hover:text-accent transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
              On: {c.post.title}
            </a>
          )}
          <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">{c.content}</p>
          <p className="text-xs text-slate-600">{timeAgo(c.createdAt)}</p>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="py-12 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-slate-500 text-sm">{text}</p>
    </div>
  );
}

function EditRolesModal({ user, onClose, onSuccess }) {
  const [form, setForm] = useState({
    isAdmin: user.isAdmin || false,
    isWingMember: user.isWingMember || false,
    isCoordinator: user.isCoordinator || false,
    customTitle: user.customTitle || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/users/${user.username}/roles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed to update roles');
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold text-slate-100 mb-4">Edit Roles: {user.username}</h2>
        {error && <div className="text-red-400 text-sm mb-4 bg-red-400/10 p-2 rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isAdmin} onChange={e => setForm({ ...form, isAdmin: e.target.checked })} className="w-4 h-4 accent-accent" />
            <span className="text-sm font-semibold text-slate-200">Is Admin</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isCoordinator} onChange={e => setForm({ ...form, isCoordinator: e.target.checked })} className="w-4 h-4 accent-accent" />
            <span className="text-sm font-semibold text-slate-200">Is Coordinator</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isWingMember} onChange={e => setForm({ ...form, isWingMember: e.target.checked })} className="w-4 h-4 accent-accent" />
            <span className="text-sm font-semibold text-slate-200">Is Wing Member</span>
          </label>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Custom Title</label>
            <input
              type="text"
              value={form.customTitle}
              onChange={e => setForm({ ...form, customTitle: e.target.value })}
              className="input-field py-1.5"
              placeholder="e.g. Master Chef"
            />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="btn-ghost px-4 py-2">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary px-4 py-2 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChangeUsernameModal({ onClose, currentUsername }) {
  const [newUsername, setNewUsername] = useState(currentUsername || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      setError('Username is required.');
      return;
    }
    if (newUsername.trim() === currentUsername) {
      onClose();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/users/profile/username`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newUsername: newUsername.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        // Redirect to the new profile URL after a short delay
        setTimeout(() => {
          window.location.href = `/profile/${data.username}`;
        }, 1500);
      } else {
        setError(data.message || 'Failed to update username.');
      }
    } catch (err) {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold text-slate-100 mb-4">Change Username</h2>

        {success ? (
          <div className="py-8 text-center text-emerald-400 font-bold">
            <div className="text-4xl mb-2">✅</div>
            Username updated!
            <p className="text-xs text-slate-500 mt-2 font-normal">Redirecting to your new profile...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <div className="text-red-400 text-xs font-semibold bg-red-500/10 border border-red-500/20 p-2 rounded-xl text-center">{error}</div>}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">New Username</label>
              <input
                type="text"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                className="input-field py-2"
                placeholder="Unique username"
              />
              <p className="text-[10px] text-slate-500 mt-2">
                <span className="text-amber-400 font-bold">Note:</span> Changing your username will change your profile URL.
              </p>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={onClose} className="btn-ghost px-4 py-2">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary px-4 py-2 flex items-center justify-center min-w-[100px]">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Update'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function ChangePasswordModal({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      setError('New password is required.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(onClose, 2000);
      } else {
        setError(data.message || 'Failed to change password.');
      }
    } catch (err) {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold text-slate-100 mb-4">Change Password</h2>

        {success ? (
          <div className="py-8 text-center text-emerald-400 font-bold">
            <div className="text-4xl mb-2">✅</div>
            Password updated!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <div className="text-red-400 text-xs font-semibold bg-red-500/10 border border-red-500/20 p-2 rounded-xl text-center">{error}</div>}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="input-field py-2"
                placeholder="Required if you have one"
              />
              <p className="text-[10px] text-slate-500 mt-1">Leave blank if you signed up with Google.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="input-field py-2"
                placeholder="New strong password"
              />
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={onClose} className="btn-ghost px-4 py-2">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary px-4 py-2 flex items-center justify-center min-w-[100px]">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Update'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function EditLinksModal({ currentLinks, onClose, onSuccess }) {
  const convertObjectToArray = (linksObj) => {
    const entries = Object.entries(linksObj || {}).filter(([_, url]) => url);

    if (entries.length === 0) {
      return [{ platform: '', url: '' }];
    }

    return entries.map(([platform, url]) => ({
      platform,
      url,
    }));
  };

  const [links, setLinks] = useState(convertObjectToArray(currentLinks));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (index, field, value) => {
    const updatedLinks = [...links];
    updatedLinks[index][field] = value;
    setLinks(updatedLinks);
  };

  const handleAddLink = () => {
    setLinks([...links, { platform: '', url: '' }]);
  };

  const handleRemoveLink = (index) => {
    if (links.length === 1) {
      setLinks([{ platform: '', url: '' }]);
      return;
    }

    const updatedLinks = links.filter((_, i) => i !== index);
    setLinks(updatedLinks);
  };

  const normalizePlatformName = (name) => {
    return name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanedLinks = {};

    for (const item of links) {
      const platform = normalizePlatformName(item.platform);
      const url = item.url.trim();

      if (!platform && !url) continue;

      if (!platform || !url) {
        setError('Please fill both platform name and URL.');
        return;
      }

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        setError('URL must start with http:// or https://');
        return;
      }

      cleanedLinks[platform] = url;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          socialLinks: cleanedLinks,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update links.');
      }

      onSuccess(cleanedLinks);
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-xl shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              Edit Profile Links
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Add your GitHub, LinkedIn, LeetCode, portfolio, CodeChef, or any other link.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 text-red-400 text-xs font-semibold bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
            {links.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
              >
                <input
                  type="text"
                  value={item.platform}
                  onChange={(e) =>
                    handleChange(index, 'platform', e.target.value)
                  }
                  placeholder="Platform name"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                />

                <input
                  type="url"
                  value={item.url}
                  onChange={(e) => handleChange(index, 'url', e.target.value)}
                  placeholder="https://example.com/username"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                />

                <button
                  type="button"
                  onClick={() => handleRemoveLink(index)}
                  className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddLink}
            className="w-full py-2.5 rounded-xl border border-dashed border-emerald-500/40 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 text-sm font-bold transition-colors"
          >
            + Add Another Link
          </button>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-300 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-50 transition-colors min-w-[110px]"
            >
              {loading ? 'Saving...' : 'Save Links'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

