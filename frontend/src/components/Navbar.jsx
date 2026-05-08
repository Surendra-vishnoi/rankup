import React, { useState } from 'react';
import SideMenu from './SideMenu.jsx';
import NotificationBell from './NotificationBell.jsx';
import { API_BASE } from '../apiConfig.js';

/**
 * Navbar Component
 * A unified navigation bar that includes the SideMenu trigger.
 */
export default function Navbar({ user, searchQuery, onSearchChange, placeholder = "Search...", children, middle }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
      window.location.reload();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/[0.07] backdrop-blur-xl bg-bg-deep/80">
        <div className="w-full px-4 lg:px-8 h-14 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Hamburger Button */}
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all flex items-center justify-center group"
              aria-label="Open side menu"
            >
              <div className="space-y-1.5 transition-all group-hover:scale-110">
                <div className="w-5 h-0.5 bg-current rounded-full" />
                <div className="w-3 h-0.5 bg-current rounded-full" />
                <div className="w-5 h-0.5 bg-current rounded-full" />
              </div>
            </button>

            {/* Logo */}
            <a href="/" className="flex items-center gap-2" aria-label="RankUp Home">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-violet flex items-center justify-center text-sm font-extrabold text-white shadow-btn relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                R
              </div>
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white to-accent-violet bg-clip-text text-transparent hidden sm:block">
                RankUp
              </span>
            </a>
          </div>

          {/* Search slot / Middle slot */}
          <div className="flex-1 max-w-sm hidden md:block">
            {middle ? middle : (
              onSearchChange !== undefined && (
                <div className="relative group">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-accent transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    className="w-full bg-bg-surface border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/10 transition-all"
                    type="search"
                    placeholder={placeholder}
                    value={searchQuery}
                    onChange={e => onSearchChange(e.target.value)}
                    aria-label={placeholder}
                  />
                </div>
              )
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            {user && <NotificationBell />}
            
            {/* Desktop Only Actions */}
            <div className="hidden sm:flex items-center gap-2">
              {!user ? (
                <a href="/auth" className="text-sm font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  Log In
                </a>
              ) : !user.isVerified ? (
                <a href="/verify" className="text-sm text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-400/5 transition-colors font-bold border border-amber-400/20">
                  Verify CF
                </a>
              ) : null}

              {user?.isAdmin && (
                <a href="/admin" className="text-purple-400 hover:text-purple-300 px-3 py-1.5 rounded-lg hover:bg-purple-500/10 transition-colors flex items-center gap-1.5 text-sm font-bold" title="Admin Console">
                   🛡️ Admin
                </a>
              )}
            </div>

            {/* Profile/Menu trigger */}
            {user ? (
               <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                 <a href={`/profile/${user.username}`} className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-violet flex items-center justify-center text-xs font-bold text-white border border-white/10 group-hover:scale-105 transition-transform">
                      {user.username[0].toUpperCase()}
                    </div>
                 </a>
                 <button 
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all hidden sm:flex"
                  title="Logout"
                >
                  <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                </button>
               </div>
            ) : (
               <a href="/auth" className="sm:hidden btn-primary text-xs py-1.5 px-3">Log In</a>
            )}

            {/* Additional children (Page-specific buttons) */}
            {children}
          </div>
        </div>
      </header>


      <SideMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        user={user}
      />
    </>
  );
}
