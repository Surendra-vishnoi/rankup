import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import { API_BASE } from '../apiConfig.js';
import { cfRankColor } from '../utils/cfRank.js';

/**
 * OG Contributors Page
 * Showcases the creators of the RankUp platform.
 */

const CREATORS = [
  {
    id: 1,
    name: "Ayush Verma",
    role: "Founder",
    cf_profiles: [
      { handle: "NoLosses", rating: 2132, rank: "master" },
      { handle: "Arc.", rating: 1754, rank: "expert" }
    ],
    handle_cc: "avone",
    stars_cc: 5,
    linkedin: "ayush-verma-486007326",
    photo: "/assets/contributors/ayush.jpg",
    bio: "Visionary leader and core developer. Driving the mission to innovate competitive programming."
  },
  {
    id: 2,
    name: "Surendra Vishnoi",
    role: "Founder",
    cf_profiles: [
      { handle: "Surendra_vishnoi", rating: 1845, rank: "candidate master" }
    ],
    handle_cc: "surendra_vishnoi",
    stars_cc: 4,
    linkedin: "surendravishnoi",
    photo: "https://github.com/Surendra-vishnoi.png",
    bio: "Lead Developer. Dedicated to building tools that empower the CP community."
  },
  {
    id: 3,
    name: "Contributor Name",
    role: "Founder",
    cf_profiles: [
      { handle: "Handle", rating: 0, rank: "newbie" }
    ],
    handle_cc: "Handle",
    stars_cc: 0,
    linkedin: "username",
    photo: "",
    bio: "Passionate developer contributing to the growth of RankUp."
  },
  {
    id: 4,
    name: "Contributor Name",
    role: "Founder",
    cf_profiles: [
      { handle: "Handle", rating: 0, rank: "newbie" }
    ],
    handle_cc: "Handle",
    stars_cc: 0,
    linkedin: "username",
    photo: "",
    bio: "Building robust systems and engaging features for the global CP community."
  }
];

export default function ContributorsPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/verify`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.isAuthenticated) setUser(d.user); })
      .catch(() => {});
    
    // Update document title for SEO
    document.title = "OG Contributors | RankUp";
  }, []);

  return (
    <div className="min-h-screen bg-bg-deep text-slate-100 flex flex-col selection:bg-accent/30 selection:text-white">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-accent/10 blur-[140px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent-violet/10 blur-[140px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[30%] left-[40%] w-[20%] h-[20%] bg-blue-500/5 blur-[100px] rounded-full" />
      </div>

      <Navbar user={user} />

      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-6 py-16 sm:py-24">
        {/* Hero Section */}
        <div className="text-center mb-20 sm:mb-28">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 animate-fade-in">
             <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
             <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-slate-400">The Architects</span>
          </div>
          <h1 className="text-4xl sm:text-7xl font-black tracking-tight mb-6 text-white text-gradient">
            The Pioneers of RankUp
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl font-medium max-w-3xl mx-auto leading-relaxed">
            The dedicated team of 4 creators pushing the boundaries of competitive programming tools and community engagement.
          </p>
        </div>

        {/* Contributors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {CREATORS.map((person, idx) => (
            <ContributorCard key={person.id} person={person} delay={idx * 100} />
          ))}
        </div>

        {/* Footer/Contact Section */}
        <div className="mt-32 text-center py-16 border-t border-white/5">
          <h3 className="text-2xl font-bold text-white mb-4">Want to contribute?</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-8">
            RankUp is a community-driven platform. Join our Discord or check out our GitHub to help us build the future of CP.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://github.com/Surendra-vishnoi/rankup" target="_blank" rel="noopener noreferrer" className="btn-ghost px-8 py-3 font-bold flex items-center gap-2">
               <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                 <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
               </svg>
               GitHub
            </a>
            <button className="btn-primary px-8 py-3 font-bold">Join Community</button>
          </div>
        </div>
      </main>
    </div>
  );
}

function ContributorCard({ person, delay }) {
  return (
    <div 
      className="group relative animate-fade-up" 
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {/* Card Hover Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-[2.5rem] -m-1 blur-2xl" />
      
      <div className="relative h-full bg-bg-card border border-white/5 p-6 sm:p-8 rounded-[2.5rem] flex flex-col backdrop-blur-xl shadow-2xl transition-all duration-500 group-hover:-translate-y-3 group-hover:border-accent/40 group-hover:shadow-accent/10">
        
        {/* Profile Image & Status */}
        <div className="relative mb-8 flex justify-center">
          <div className="absolute inset-0 bg-accent/20 rounded-full blur-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-700" />
          <div className="relative z-10 w-32 h-32 sm:w-40 sm:h-40 rounded-full border-[6px] border-white/5 overflow-hidden shadow-2xl group-hover:border-accent/40 transition-all duration-500 scale-100 group-hover:scale-105">
            {person.photo ? (
              <img src={person.photo} alt={person.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" title={person.name} />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-5xl font-black text-slate-700">
                {person.name[0]}
              </div>
            )}
          </div>
          
          {/* Role Badge Overlay */}
          <div className="absolute -bottom-4 bg-accent px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] text-white shadow-xl translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            {person.role}
          </div>
        </div>

        {/* Info */}
        <div className="text-center mb-8 flex-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-1 tracking-tight group-hover:text-accent transition-colors">{person.name}</h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-4">{person.role}</p>
          <p className="text-slate-400 text-xs leading-relaxed mb-6 px-2 font-medium italic">
            "{person.bio}"
          </p>

          {/* Social Stats */}
          <div className="flex flex-col gap-2.5 text-left">
            {/* Codeforces Profiles */}
            {person.cf_profiles.map((cf, i) => (
              <div key={i} className="group/stat flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-blue-500/30 transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover/stat:scale-110 transition-transform">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4.5 7.5L9 7.5L9 16.5L4.5 16.5L4.5 7.5ZM10.5 4.5L15 4.5L15 16.5L10.5 16.5L10.5 4.5ZM16.5 10.5L21 10.5L21 16.5L16.5 16.5L16.5 10.5Z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Codeforces {person.cf_profiles.length > 1 ? `#${i+1}` : ''}</div>
                    <div className="text-xs font-bold text-white tracking-tight">{cf.handle}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black" style={{ color: cfRankColor(cf.rank) }}>{cf.rating}</div>
                  <div className="text-[8px] font-bold opacity-60 uppercase">{cf.rank}</div>
                </div>
              </div>
            ))}

            {/* CodeChef */}
            <div className="group/stat flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-yellow-500/30 transition-all">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400 group-hover/stat:scale-110 transition-transform">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 14.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm0-3a1 1 0 1 1-2 0V8.5a1 1 0 1 1 2 0v5z"/>
                  </svg>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">CodeChef</div>
                  <div className="text-xs font-bold text-white tracking-tight">{person.handle_cc}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-0.5 text-yellow-500 font-extrabold text-sm">
                  {person.stars_cc} <span className="text-xs">★</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LinkedIn Button */}
        <a 
          href={`https://linkedin.com/in/${person.linkedin}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full py-3 px-6 rounded-2xl bg-slate-800 hover:bg-accent text-white text-sm font-bold transition-all duration-300 flex items-center justify-center gap-3 group/btn shadow-lg"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
          </svg>
          Connect
          <svg className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
      </div>
    </div>
  );
}
