import { useState, useEffect } from 'react';
import { API_BASE } from '../apiConfig';

export default function FloatingMessageButton({ currentUser }) {
  const [unreadTotal, setUnreadTotal] = useState(0);

  useEffect(() => {
    if (!currentUser) return;
    fetch(`${API_BASE}/api/chat/unread-count`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : { count: 0 })
      .then(d => setUnreadTotal(d.count))
      .catch(() => {});
  }, [currentUser]);

  return (
    <a
      href="/messages"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 group"
      style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 24px rgba(16,185,129,0.4)' }}
      aria-label="Messages"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      {unreadTotal > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg">
          {unreadTotal > 99 ? '99+' : unreadTotal}
        </span>
      )}
    </a>
  );
}
