import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../apiConfig';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id, link) => {
    try {
      await fetch(`${API_BASE}/api/notifications/${id}/read`, { 
        method: 'PUT', 
        credentials: 'include' 
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      if (link) window.location.href = link;
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    try {
      await fetch(`${API_BASE}/api/notifications/read-all`, { 
        method: 'PUT', 
        credentials: 'include' 
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  return (
    <div className="relative ml-2" ref={containerRef}>
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-bg-deep shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-bg-surface border border-white/10 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] overflow-hidden z-50 animate-fade-in flex flex-col max-h-[28rem]">
          <div className="p-3 border-b border-white/5 flex items-center justify-between bg-black/20">
            <h3 className="text-sm font-bold text-slate-200">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="text-[10px] uppercase tracking-wider font-bold text-accent hover:text-accent-violet transition-colors">
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs font-medium text-slate-500">
                No new notifications.
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-white/5">
                {notifications.map(n => (
                  <div 
                    key={n._id}
                    onClick={() => handleMarkAsRead(n._id, n.link)}
                    className={`p-3 cursor-pointer hover:bg-white/5 transition-colors flex gap-3 ${!n.isRead ? 'bg-accent/5' : ''}`}
                  >
                    <div className="mt-0.5">
                      {n.type === 'ANNOUNCEMENT' ? '📢' : n.type === 'NEW_EDITORIAL' ? '⭐' : '💬'}
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <p className={`text-xs leading-relaxed ${!n.isRead ? 'text-slate-200 font-semibold' : 'text-slate-400'}`}>
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-500">
                        {new Date(n.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {!n.isRead && (
                      <div className="w-2 h-2 rounded-full bg-accent mt-1 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
