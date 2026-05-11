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
  
  // Theme toggle logic
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  React.useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

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
      <header className="sticky top-0 z-50 border-b border-black/5 dark:border-white/[0.07] backdrop-blur-xl bg-white/80 dark:bg-bg-deep/80 text-slate-900 dark:text-white transition-colors duration-300">
        <div className="w-full px-4 lg:px-8 h-14 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Hamburger Button */}
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center group"
              aria-label="Open side menu"
            >
              <div className="space-y-1.5 transition-all group-hover:scale-110">
                <div className="w-5 h-0.5 bg-current rounded-full" />
                <div className="w-3 h-0.5 bg-current rounded-full" />
                <div className="w-5 h-0.5 bg-current rounded-full" />
              </div>
            </button>

            {/* Logo */}
            <a href="/" className="flex items-center gap-2 group" aria-label="RankUp Home">
              <img src="/favicon.svg" alt="RankUp" className="w-8 h-8 transition-transform group-hover:scale-105" />
            </a>
          </div>

          {/* Search slot / Middle slot */}
          <div className="flex-1 max-w-sm hidden md:block">
            {middle ? middle : (
              onSearchChange !== undefined && (
                <div className="relative group">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-accent transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    className="w-full bg-slate-100 dark:bg-bg-surface border border-black/5 dark:border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/10 transition-all"
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
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-black/5 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 transition-all mr-1"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {user && <NotificationBell />}
            
            {/* Desktop Only Actions */}
            <div className="hidden sm:flex items-center gap-2">
              {!user ? (
                <a href="/auth" className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  Log In
                </a>
              ) : !user.isVerified ? (
                <a href="/verify" className="text-sm text-amber-500 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-500/10 dark:hover:bg-amber-400/5 transition-colors font-bold border border-amber-500/20 dark:border-amber-400/20">
                  Verify CF
                </a>
              ) : null}

              {user?.isAdmin && (
                <a href="/admin" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 px-3 py-1.5 rounded-lg hover:bg-purple-600/10 dark:hover:bg-purple-500/10 transition-colors flex items-center gap-1.5 text-sm font-bold" title="Admin Console">
                   🛡️ Admin
                </a>
              )}
            </div>

            {/* Profile/Menu trigger */}
            {user ? (
               <div className="flex items-center gap-2 pl-2 border-l border-black/10 dark:border-white/10">
                 <a href={`/profile/${user.username}`} className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-violet flex items-center justify-center text-xs font-bold text-white border border-black/5 dark:border-white/10 group-hover:scale-105 transition-transform shadow-sm">
                      {user.username[0].toUpperCase()}
                    </div>
                 </a>
                 <button 
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all hidden sm:flex"
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
