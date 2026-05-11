import React from 'react';

/**
 * SideMenu Component
 * A slide-in drawer for primary navigation links.
 */
export default function SideMenu({ isOpen, onClose, user }) {
  const menuItems = [
    {
      label: 'Competitive',
      items: [
        { href: '/arena', label: 'CodeArena', icon: '⚔️', color: 'bg-red-500/10', text: 'text-red-500' },
        { href: '/contests', label: 'Contests Hub', icon: '🏆', color: 'bg-yellow-500/10', text: 'text-yellow-500' },
      ]
    },
    {
      label: 'Tools',
      items: [
        { href: '/recommender', label: 'Problem Recommender', icon: '🎯', color: 'bg-blue-500/10', text: 'text-blue-400' },
        { href: '/ai-hints', label: 'AI Editorials', icon: '🔮', color: 'bg-accent/10', text: 'text-accent' },
      ]
    },
    {
      label: 'Main',
      items: [
        { href: '/contributors', label: 'OG Contributors', icon: '🎨', color: 'bg-indigo-500/10', text: 'text-indigo-400' },
        { href: '/hub', label: 'Feed Hub', icon: '🏠', color: 'bg-emerald-500/10', text: 'text-emerald-400' },
        { href: '/editorials', label: 'Wing Editorials', icon: '📖', color: 'bg-amber-500/10', text: 'text-amber-400' },
      ]
    },
    {
      label: 'Account',
      items: [
        { href: '/settings', label: 'Settings', icon: '⚙️', color: 'bg-slate-500/10', text: 'text-slate-400' },
      ]
    }
  ];

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Menu Drawer */}
      <aside 
        className={`fixed left-0 top-0 h-full w-72 z-[70] bg-bg-deep border-r border-white/10 transition-transform duration-300 ease-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl`}
      >
        {/* Glow effect */}
        <div className="absolute top-0 left-0 w-full h-32 bg-accent/5 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-6 pb-2 flex items-center justify-between border-b border-white/5 relative z-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-violet flex items-center justify-center text-lg font-extrabold text-white shadow-btn">
              R
            </div>
            <div>
              <span className="font-extrabold text-lg text-white block">RankUp</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Navigation</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all"
            aria-label="Close Menu"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Links scrollarea */}
        <div className="h-[calc(100%-80px)] overflow-y-auto px-4 py-8 space-y-8 relative z-10 custom-scrollbar">
          {menuItems.map((group, idx) => (
            <div key={idx} className="space-y-3">
              <h3 className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                {group.label}
              </h3>
              <div className="space-y-1">
                {group.items.map((item, i) => (
                  <a 
                    key={i}
                    href={item.href} 
                    className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-white/5 transition-all text-slate-400 hover:text-white group border border-transparent hover:border-white/5"
                  >
                    <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center text-base group-hover:scale-110 transition-transform duration-200`}>
                      {item.icon}
                    </div>
                    <span className="font-bold text-sm tracking-tight">{item.label}</span>
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                         <path d="m9 18 6-6-6-6"/>
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}

          {/* User Section (Mobile Context) */}
          {user && (
            <div className="pt-8 mt-8 border-t border-white/5">
              <div className="px-4 mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Account</span>
              </div>
              <a 
                href={`/profile/${user.username}`}
                className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-white/5 transition-all text-slate-400 hover:text-white group border border-transparent hover:border-white/5"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-accent-violet flex items-center justify-center text-sm font-bold text-white">
                  {user.username[0].toUpperCase()}
                </div>
                <div>
                  <span className="font-bold text-sm block tracking-tight">{user.username}</span>
                  <span className="text-[10px] text-slate-500">View Profile</span>
                </div>
              </a>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
