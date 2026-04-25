import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../apiConfig';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search results with debouncing
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const t = setTimeout(() => {
      fetch(`${API_BASE}/api/users/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((d) => setResults(d.users || []))
        .catch(() => setResults([]));
    }, 300);

    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="relative w-full max-w-xs ml-2 sm:ml-4" ref={containerRef}>
      <div className="relative flex items-center">
        <svg className="absolute left-3 w-4 h-4 text-slate-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search users..."
          className="w-full bg-black/20 border border-white/10 text-sm text-slate-200 placeholder-slate-500 rounded-full py-1.5 pl-9 pr-4 focus:outline-none focus:border-accent/50 focus:bg-white/[0.05] transition-all"
        />
      </div>

      {isOpen && query.trim() !== '' && (
        <div className="absolute top-full mt-2 left-0 w-full bg-bg-surface border border-white/10 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] overflow-hidden z-50 animate-fade-in max-h-64 overflow-y-auto custom-scrollbar">
          {results.length === 0 ? (
            <div className="p-4 text-center text-xs font-semibold text-slate-500">
              No users found.
            </div>
          ) : (
            <div className="flex flex-col py-1.5">
              {results.map((u) => (
                <a
                  key={u._id}
                  href={`/profile/${u.username}`}
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 hover:bg-white/5 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                        {u.username[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-200">{u.username}</span>
                      {u.cfHandle && <span className="text-[10px] text-slate-500">{u.cfHandle}</span>}
                    </div>
                  </div>
                  {u.isWingMember && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Wing</span>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
