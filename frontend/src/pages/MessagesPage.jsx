import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { API_BASE } from '../apiConfig';
import Navbar from '../components/Navbar';
import GlobalSearch from '../components/GlobalSearch';

// ── Helpers ──────────────────────────────────────────────────────────────────
const cfRankColor = (rank = '') => {
  const r = (rank || '').toLowerCase();
  if (r.includes('legendary grandmaster'))     return '#ff0000';
  if (r.includes('international grandmaster')) return '#ff3700';
  if (r.includes('grandmaster'))               return '#ff0000';
  if (r.includes('international master'))      return '#ff8c00';
  if (r.includes('master'))                    return '#ffa500';
  if (r.includes('candidate master'))          return '#aa00aa';
  if (r.includes('expert'))                    return '#6666ff';
  if (r.includes('specialist'))                return '#03a89e';
  if (r.includes('pupil'))                     return '#008000';
  return '#94a3b8';
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return `${Math.floor(diff)}s`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function Avatar({ username, avatarUrl, rank, size = 10 }) {
  const color = cfRankColor(rank);
  return (
    <div
      className={`w-${size} h-${size} rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold text-white overflow-hidden`}
      style={{ background: `linear-gradient(135deg, ${color}cc, ${color}55)` }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
      ) : (
        (username || '?')[0].toUpperCase()
      )}
    </div>
  );
}

// ── Socket singleton ──────────────────────────────────────────────────────────
let socketInstance = null;
function getSocket() {
  if (!socketInstance) {
    const SOCKET_URL = import.meta.env.PROD
      ? (import.meta.env.VITE_API_URL || window.location.origin)
      : 'http://localhost:5000';
    socketInstance = io(SOCKET_URL, { withCredentials: true, autoConnect: false });
  }
  return socketInstance;
}

export default function MessagesPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // { username, avatarUrl, rank }
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Typing indicator states
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const emitTypingTimeoutRef = useRef(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const searchDebounce = useRef(null);
  const socket = getSocket();

  // Active chat ref for socket closures
  const activeChatRef = useRef(activeChat);
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  // Auth fetch
  useEffect(() => {
    fetch(`${API_BASE}/api/auth/verify`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.isAuthenticated) setCurrentUser(d.user); else window.location.href = '/auth'; })
      .catch(() => window.location.href = '/auth');
  }, []);

  // Socket logic
  useEffect(() => {
    if (!currentUser) return;
    if (!socket.connected) socket.connect();

    const onReceive = (msg) => {
      const otherId = msg.sender._id === currentUser.id ? msg.recipient._id : msg.sender._id;
      const otherUsername = msg.sender.username === currentUser.username ? msg.recipient.username : msg.sender.username;

      if (activeChatRef.current?.username === otherUsername) {
        setMessages(old => {
          if (old.some(m => m._id === msg._id)) return old;
          return [...old, msg];
        });
        
        // Mark as read immediately if it's the active chat and we received it
        if (msg.recipient._id === currentUser.id) {
            fetch(`${API_BASE}/api/chat/messages/${encodeURIComponent(otherUsername)}/read`, {
                method: 'PUT', credentials: 'include'
            }).catch(() => {});
        }
      }

      setConversations(old => {
        const existing = old.find(c => c.username === otherUsername);
        const unreadInc = (msg.recipient._id === currentUser.id && activeChatRef.current?.username !== otherUsername) ? 1 : 0;
        
        if (existing) {
          return old.map(c =>
            c.username === otherUsername
              ? { ...c, lastMessage: { content: msg.content, createdAt: msg.createdAt, senderId: msg.sender._id }, unreadCount: c.unreadCount + unreadInc }
              : c
          ).sort((a, b) => new Date(b.lastMessage?.createdAt) - new Date(a.lastMessage?.createdAt));
        }
        return [{
          userId: otherId,
          username: otherUsername,
          avatarUrl: msg.sender.avatarUrl,
          rank: '',
          lastMessage: { content: msg.content, createdAt: msg.createdAt, senderId: msg.sender._id },
          unreadCount: unreadInc,
        }, ...old];
      });
    };

    const onTyping = ({ senderUsername }) => {
      if (activeChatRef.current?.username === senderUsername) {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    };

    const onStopTyping = ({ senderUsername }) => {
      if (activeChatRef.current?.username === senderUsername) {
        setIsTyping(false);
        clearTimeout(typingTimeoutRef.current);
      }
    };

    socket.on('receive_message', onReceive);
    socket.on('typing', onTyping);
    socket.on('stop_typing', onStopTyping);

    return () => {
      socket.off('receive_message', onReceive);
      socket.off('typing', onTyping);
      socket.off('stop_typing', onStopTyping);
    };
  }, [currentUser]);

  // Fetch convs
  useEffect(() => {
    if (!currentUser) return;
    setLoadingConvs(true);
    fetch(`${API_BASE}/api/chat/conversations`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : { conversations: [] })
      .then(d => setConversations(d.conversations || []))
      .catch(() => {})
      .finally(() => setLoadingConvs(false));
  }, [currentUser]);

  const openThread = useCallback(async (user) => {
    setActiveChat(user);
    setMessages([]);
    setIsTyping(false);
    setLoadingMsgs(true);
    setDraft('');
    try {
      const r = await fetch(`${API_BASE}/api/chat/messages/${encodeURIComponent(user.username)}`, { credentials: 'include' });
      const d = r.ok ? await r.json() : { messages: [] };
      setMessages(d.messages || []);
      
      await fetch(`${API_BASE}/api/chat/messages/${encodeURIComponent(user.username)}/read`, {
        method: 'PUT', credentials: 'include'
      });
      setConversations(old => old.map(c => c.username === user.username ? { ...c, unreadCount: 0 } : c));
    } catch {
    } finally {
      setLoadingMsgs(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    clearTimeout(searchDebounce.current);
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    searchDebounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`${API_BASE}/api/users/search?q=${encodeURIComponent(searchQuery)}&limit=8`, { credentials: 'include' });
        const d = r.ok ? await r.json() : { users: [] };
        setSearchResults((d.users || []).filter(u => u.username !== currentUser?.username));
      } catch {} finally {
        setSearching(false);
      }
    }, 300);
  }, [searchQuery, currentUser]);

  const handleSend = () => {
    if (!draft.trim() || !activeChat || sending) return;
    setSending(true);
    socket.emit('send_message', { recipientUsername: activeChat.username, content: draft.trim() });
    socket.emit('stop_typing', { recipientUsername: activeChat.username });
    setDraft('');
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setDraft(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
    
    if (activeChat) {
        socket.emit('typing', { recipientUsername: activeChat.username });
        clearTimeout(emitTypingTimeoutRef.current);
        emitTypingTimeoutRef.current = setTimeout(() => {
            socket.emit('stop_typing', { recipientUsername: activeChat.username });
        }, 2000);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-bg-deep flex flex-col font-sans transition-colors duration-300">
      <Navbar user={currentUser} middle={<GlobalSearch />} />

      <main className="flex-1 flex overflow-hidden max-w-[1400px] mx-auto w-full px-4 py-6 gap-6 relative z-10">
        
        {/* ── Left Sidebar (Conversations) ── */}
        <aside className="w-[380px] flex-shrink-0 flex flex-col bg-white dark:bg-bg-surface/40 backdrop-blur-md border border-black/5 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl relative">
          {/* subtle noise/texture */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
          
          <div className="px-5 py-5 border-b border-black/5 dark:border-white/[0.08] relative z-10">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Messages
            </h1>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="w-full bg-slate-100 dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all shadow-inner"
                placeholder="Search users to message..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
            {searchQuery ? (
              <div className="p-2">
                <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-500">Search Results</p>
                {searchResults.length > 0 ? (
                  searchResults.map(u => (
                    <button
                      key={u._id}
                      onClick={() => { openThread({ username: u.username, avatarUrl: u.avatarUrl, rank: u.rank }); setSearchQuery(''); setSearchResults([]); }}
                      className="w-full flex items-center gap-3 px-3 py-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all text-left"
                    >
                      <Avatar username={u.username} avatarUrl={u.avatarUrl} rank={u.rank} size={10} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-200 truncate">{u.username}</p>
                        {u.rank && <p className="text-[11px] font-semibold capitalize" style={{ color: cfRankColor(u.rank) }}>{u.rank}</p>}
                      </div>
                    </button>
                  ))
                ) : !searching ? (
                  <p className="text-sm text-slate-500 text-center py-6">No users found.</p>
                ) : null}
              </div>
            ) : (
              <div className="flex flex-col">
                {loadingConvs ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse border-b border-black/5 dark:border-white/5">
                      <div className="w-12 h-12 rounded-xl bg-black/10 dark:bg-white/10 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="h-4 w-32 bg-black/10 dark:bg-white/10 rounded mb-2.5" />
                        <div className="h-3 w-48 bg-black/5 dark:bg-white/[0.05] rounded" />
                      </div>
                    </div>
                  ))
                ) : conversations.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-20 px-6 text-center opacity-60">
                     <div className="w-16 h-16 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center mb-4">
                       <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                         <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                       </svg>
                     </div>
                     <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No active conversations</p>
                     <p className="text-xs text-slate-500 mt-1">Use the search bar to find someone.</p>
                   </div>
                ) : (
                  conversations.map(conv => (
                    <button
                      key={conv.userId}
                      onClick={() => openThread({ username: conv.username, avatarUrl: conv.avatarUrl, rank: conv.rank })}
                      className={`w-full flex items-center gap-4 px-5 py-4 transition-all text-left border-l-4 ${activeChat?.username === conv.username ? 'bg-accent/5 border-accent' : 'border-transparent hover:bg-black/[0.02] dark:hover:bg-white/[0.02] border-b border-b-black/[0.04] dark:border-b-white/[0.04]'}`}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar username={conv.username} avatarUrl={conv.avatarUrl} rank={conv.rank} size={12} />
                        {conv.unreadCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-accent text-white text-[10px] font-extrabold rounded-full flex items-center justify-center px-1 shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`text-[15px] font-bold truncate ${conv.unreadCount > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                            {conv.username}
                          </span>
                          <span className={`text-[11px] font-medium flex-shrink-0 ${conv.unreadCount > 0 ? 'text-accent' : 'text-slate-500'}`}>
                            {timeAgo(conv.lastMessage?.createdAt)}
                          </span>
                        </div>
                        <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-slate-500 font-medium'}`}>
                          {conv.lastMessage?.senderId === currentUser.id ? 'You: ' : ''}{conv.lastMessage?.content}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </aside>

        {/* ── Right Main Area (Active Chat) ── */}
        <section className="flex-1 flex flex-col bg-white dark:bg-bg-surface/20 backdrop-blur-sm border border-black/5 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl relative">
          {activeChat ? (
            <>
              {/* Active Chat Header */}
              <div className="px-6 py-4 border-b border-black/5 dark:border-white/[0.08] flex items-center gap-4 bg-slate-50 dark:bg-white/[0.02] backdrop-blur-md z-10 relative">
                <Avatar username={activeChat.username} avatarUrl={activeChat.avatarUrl} rank={activeChat.rank} size={12} />
                <div className="flex flex-col">
                  <a href={`/profile/${activeChat.username}`} className="text-lg font-extrabold text-slate-900 dark:text-white hover:text-accent transition-colors flex items-center gap-2">
                    {activeChat.username}
                  </a>
                  {isTyping ? (
                    <span className="text-xs font-semibold text-emerald-500 animate-pulse mt-0.5">
                      typing...
                    </span>
                  ) : activeChat.rank ? (
                    <span className="text-xs font-semibold capitalize mt-0.5" style={{ color: cfRankColor(activeChat.rank) }}>
                      {activeChat.rank}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4 relative z-0 custom-scrollbar">
                {loadingMsgs ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                     <p className="text-sm font-bold text-slate-700 dark:text-slate-300">This is the start of your conversation.</p>
                     <p className="text-xs text-slate-500 mt-1">Send a message to {activeChat.username}.</p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.sender._id === currentUser.id || msg.sender.username === currentUser.username;
                    const prevMsg = messages[i - 1];
                    const showAvatar = !isMe && (i === 0 || prevMsg?.sender?.username !== msg.sender?.username);
                    const showTime = i === 0 || (new Date(msg.createdAt) - new Date(prevMsg.createdAt) > 5 * 60 * 1000); // show time if > 5 mins gap

                    return (
                      <div key={msg._id || i} className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                        {showTime && (
                           <div className="w-full text-center my-3">
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{timeAgo(msg.createdAt)} ago</span>
                           </div>
                        )}
                        <div className={`flex items-end gap-3 max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          {!isMe && (
                            <div className={`flex-shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0'} w-8`}>
                              {showAvatar && <Avatar username={msg.sender?.username} avatarUrl={msg.sender?.avatarUrl} rank={activeChat?.rank} size={8} />}
                            </div>
                          )}
                          <div
                            className={`px-4 py-2.5 text-[15px] leading-relaxed break-words shadow-sm ${
                              isMe
                                ? 'bg-accent/20 border border-accent/30 text-emerald-900 dark:text-emerald-50 rounded-2xl rounded-br-sm'
                                : 'bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10 text-slate-800 dark:text-slate-200 rounded-2xl rounded-bl-sm'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border-t border-black/5 dark:border-white/[0.08] backdrop-blur-md z-10 relative">
                <div className="flex items-end gap-3 bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-2xl p-2 shadow-sm dark:shadow-inner focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/20 transition-all">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    className="flex-1 bg-transparent px-3 py-2.5 text-[15px] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none resize-none leading-relaxed custom-scrollbar"
                    placeholder={`Message ${activeChat.username}...`}
                    value={draft}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    style={{ minHeight: '44px', maxHeight: '150px' }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!draft.trim() || sending}
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 bg-accent/20 text-accent hover:bg-accent hover:text-white"
                    aria-label="Send message"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                    </svg>
                  </button>
                </div>
                <div className="flex justify-between items-center mt-2 px-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <strong>Enter</strong> to send &middot; <strong>Shift+Enter</strong> for newline
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50 dark:bg-[#0a0e17] relative z-0">
               {/* Decorative coding background */}
               <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,1) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
               <div className="absolute inset-0 dark:opacity-[0.02] hidden dark:block" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
               
               <div className="w-24 h-24 mb-6 rounded-3xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center shadow-sm dark:shadow-2xl relative z-10">
                 <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-400 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                 </svg>
               </div>
               <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-2 relative z-10">Select a conversation</h2>
               <p className="text-slate-500 dark:text-slate-400 max-w-sm relative z-10">Choose an existing conversation from the sidebar or search for a user to start a new thread.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
