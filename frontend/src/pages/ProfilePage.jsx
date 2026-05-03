import { useState, useEffect } from 'react';
import { API_BASE } from '../apiConfig';
import { cfRankColor } from '../utils/cfRank.js';
import GlobalSearch from '../components/GlobalSearch';
import NotificationBell from '../components/NotificationBell';

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
    <div className="bg-bg-surface border border-white/[0.07] rounded-xl p-4 flex flex-col gap-1 text-center">
      <div className="text-xl mb-1">{icon}</div>
      <div className={`text-2xl font-extrabold font-mono ${color}`}>{value ?? '—'}</div>
      <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
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
  const [cfStats, setCfStats] = useState({ solved: null, rating: null, rank: null });
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [actLoading, setActLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showEditRoles, setShowEditRoles] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangeUsername, setShowChangeUsername] = useState(false);

  // Fetch current session
  useEffect(() => {
    fetch(`${API_BASE}/api/auth/verify`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.isAuthenticated) setCurrentUser(d.user); })
      .catch(() => { });
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
      window.location.href = '/';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

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
    Promise.all([
      fetch(`https://codeforces.com/api/user.info?handles=${handle}`).then(r => r.json()),
      fetch(`https://codeforces.com/api/user.status?handle=${handle}`).then(r => r.json()),
    ]).then(([info, status]) => {
      const cfUser = info?.result?.[0];
      const solved = status?.status === 'OK'
        ? new Set(
          status.result
            .filter(s => s.verdict === 'OK' && s.problem?.contestId && s.problem?.index)
            .map(s => `${s.problem.contestId}${s.problem.index}`)
        ).size
        : null;
      setCfStats({
        rating: cfUser?.rating ?? null,
        rank: cfUser?.rank ?? null,
        solved,
      });
    }).catch(() => { });
  }, [profile]);

  const user = profile?.user;
  const stats = profile?.stats;
  const color = cfRankColor(cfStats.rank || user?.rank || '');
  const isOwn = currentUser && user && currentUser.username === user.username;

  if (error) return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center">
      <div className="card p-8 text-center max-w-sm">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Profile Not Found</h2>
        <p className="text-slate-500 text-sm mb-4">{error}</p>
        <a href="/" className="btn-primary text-sm">Back to Hub</a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-deep">
      {/* Background mesh */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 50% at 20% 0%, rgba(99,120,255,0.1) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(167,139,250,0.08) 0%, transparent 60%)'
        }} />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] backdrop-blur-xl bg-bg-deep/80">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 flex-shrink-0" aria-label="RankUp Home">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-violet flex items-center justify-center text-sm font-extrabold text-white shadow-btn">R</div>
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white to-accent-violet bg-clip-text text-transparent">RankUp</span>
          </a>
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <a href="/" className="hover:text-slate-200 transition-colors">Hub</a>
            <span>/</span>
            <span className="text-slate-300">Profile</span>
          </div>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-2">
            {currentUser && <NotificationBell />}

            <a href="/contests" className="text-slate-400 hover:text-slate-200 text-sm px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-1.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
              Contests
            </a>
            {currentUser?.isAdmin && (
              <a href="/admin" className="text-purple-400 hover:text-purple-300 text-sm px-3 py-1.5 rounded-lg hover:bg-purple-500/10 transition-colors flex items-center gap-1.5 font-bold">
                🛡️ Admin
              </a>
            )}
            {currentUser && (
              <button
                onClick={handleLogout}
                className="text-red-400 hover:text-red-300 text-sm px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors flex items-center gap-1.5 font-semibold"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Profile Header Card */}
        <div className="card p-6 mb-6">
          {loading ? (
            <div className="flex items-start gap-5">
              <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
              <div className="flex-1 pt-2">
                <Skeleton className="h-7 w-48 mb-2" />
                <Skeleton className="h-4 w-32 mb-4" />
                <Skeleton className="h-3 w-64" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-extrabold text-white flex-shrink-0 shadow-lg overflow-hidden border-2 border-transparent"
                  style={{
                    background: user?.isWingMember
                      ? 'linear-gradient(135deg, #eab308, #d97706)'
                      : `linear-gradient(135deg, ${color}cc, ${color}55)`,
                    boxShadow: user?.isWingMember ? '0 0 24px rgba(234,179,8,0.4)' : `0 0 24px ${color}33`,
                    borderColor: user?.avatarUrl ? (user.isWingMember ? '#eab308' : color) : 'transparent'
                  }}
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    (user?.username || '?')[0].toUpperCase()
                  )}
                </div>
                {isOwn && (
                  <button
                    onClick={() => {
                      const url = prompt('Enter image URL for your avatar:', user?.avatarUrl || '');
                      if (url !== null) {
                        fetch(`${API_BASE}/api/users/profile`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ avatarUrl: url })
                        }).then(r => r.json()).then(() => window.location.reload());
                      }
                    }}
                    className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-semibold text-white backdrop-blur-sm"
                  >
                    Edit
                  </button>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h1 className="text-2xl font-extrabold text-slate-100">{user?.username}</h1>
                  {isOwn && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-accent/15 border border-accent/30 text-accent">
                      You
                    </span>
                  )}
                  {currentUser?.isAdmin && !isOwn && (
                    <button
                      onClick={() => setShowEditRoles(true)}
                      className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors ml-2"
                    >
                      Edit Roles
                    </button>
                  )}
                  {user?.isAdmin && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/40">
                      🛡️ Admin
                    </span>
                  )}
                  {user?.isCoordinator ? (
                    <span className="badge-coordinator">
                      👑 Coordinator
                    </span>
                  ) : user?.isWingMember && (
                    <span className="badge-wing">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16L3 6l5.5 4L12 4l3.5 6L21 6l-2 10H5z" /></svg>
                      Wing Member
                    </span>
                  )}
                  {user?.isVerified && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                      CF Verified
                    </span>
                  )}
                </div>

                {/* CF handle + rank */}
                {user?.cfHandle && (
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <a
                      href={`https://codeforces.com/profile/${user.cfHandle}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
                      style={{ color }}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
                      {user.cfHandle}
                      {(cfStats.rank || user.rank) && (
                        <span className="ml-1 capitalize font-normal text-xs opacity-80">
                          · {(cfStats.rank || user.rank).replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                      )}
                    </a>
                    {user?.customTitle && (
                      <span className="text-xs font-bold text-slate-300 px-2 py-0.5 border border-white/10 rounded ml-2">
                        {user.customTitle}
                      </span>
                    )}
                  </div>
                )}

                <p className="text-xs text-slate-500">
                  Joined {new Date(user?.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </p>
              </div>

              {/* Actions */}
              <div className="mt-4 sm:mt-0 sm:ml-auto flex flex-col sm:items-end gap-2">
                {isOwn ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowChangeUsername(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors shadow-sm"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      Username
                    </button>
                    <button 
                      onClick={() => setShowChangePassword(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors shadow-sm"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      Password
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 border border-red-400/20 bg-red-400/5 hover:bg-red-400/10 hover:border-red-400/40 transition-colors shadow-sm"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Logout
                    </button>
                  </div>
                ) : currentUser ? (
                  <div className="flex flex-col sm:items-end gap-2">
                    <button
                      onClick={async () => {
                        const action = stats?.isFollowing ? 'unfollow' : 'follow';
                        try {
                          const r = await fetch(`${API_BASE}/api/users/${user.username}/${action}`, {
                            method: 'POST',
                            credentials: 'include'
                          });
                          if (r.ok) {
                            setProfile(prev => ({
                              ...prev,
                              stats: {
                                ...prev.stats,
                                isFollowing: !prev.stats.isFollowing,
                                followersCount: prev.stats.followersCount + (action === 'follow' ? 1 : -1)
                              }
                            }));
                          }
                        } catch (err) {
                          console.error('Follow action failed', err);
                        }
                      }}
                      className={`flex items-center justify-center gap-1.5 px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-btn ${stats?.isFollowing
                          ? 'bg-bg-surface border border-white/10 text-slate-300 hover:bg-white/5 hover:border-white/20'
                          : 'bg-gradient-to-r from-accent to-accent-violet text-white hover:scale-[1.02]'
                        }`}
                    >
                      {stats?.isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button
                      onClick={() => {
                        // Dispatch a custom event that ChatPanel listens for
                        window.dispatchEvent(new CustomEvent('open-chat', { detail: { username: user.username, avatarUrl: user.avatarUrl, rank: cfStats.rank || user.rank } }));
                      }}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Message
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
            <StatCard icon="⚡" label="CF Rating" value={cfStats.rating ?? user?.rating} color={`font-mono`} />
            <StatCard icon="✅" label="Solved" value={cfStats.solved} color="text-emerald-400" />
            <StatCard icon="👥" label="Followers" value={stats?.followersCount ?? 0} />
            <StatCard icon="👤" label="Following" value={stats?.followingCount ?? 0} />
            <StatCard icon="💚" label="Karma" value={user?.karma != null ? `+${user.karma}` : '0'} color="text-emerald-400" />
            <StatCard icon="📝" label="Posts" value={(stats?.postCount ?? 0) + (stats?.editorialCount ?? 0)} />
            <div className="bg-bg-surface rounded-xl p-3 text-center border border-white/[0.05] hover:border-white/10 transition-colors flex flex-col items-center justify-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Medals</p>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span title="Gold" className="text-yellow-400">🥇 {stats?.medals?.gold || 0}</span>
                <span title="Silver" className="text-slate-300">🥈 {stats?.medals?.silver || 0}</span>
                <span title="Bronze" className="text-amber-600">🥉 {stats?.medals?.bronze || 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* Activity Feed */}
        <div className="card p-0 overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-white/[0.07] bg-bg-surface/50">
            {ACTIVITY_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all border-b-2 -mb-px
                  ${activeTab === tab.key
                    ? 'text-accent border-accent bg-accent/5'
                    : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5'
                  }`}
              >
                <span>{tab.emoji}</span>
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                  ${activeTab === tab.key ? 'bg-accent/20 text-accent' : 'bg-white/10 text-slate-500'}`}>
                  {activity[tab.key]?.length ?? 0}
                </span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-4">
            {actLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex flex-col gap-2 p-3 border border-white/5 rounded-xl">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
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
