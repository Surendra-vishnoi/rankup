import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { API_BASE } from '../apiConfig';

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

function Avatar({ username, avatarUrl, rank, size = 8 }) {
  const color = cfRankColor(rank);
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white overflow-hidden`}
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

// ── Main ChatPanel Component ──────────────────────────────────────────────────
export default function ChatPanel({ currentUser }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('list'); // 'list' | 'thread'
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // { username, avatarUrl, rank }
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const searchDebounce = useRef(null);
  const socket = getSocket();

  // Connect socket when user is present
  useEffect(() => {
    if (!currentUser) return;
    if (!socket.connected) socket.connect();

    const onReceive = (msg) => {
      const otherId = msg.sender._id === currentUser.id ? msg.recipient._id : msg.sender._id;
      const otherUsername = msg.sender.username === currentUser.username
        ? msg.recipient.username
        : msg.sender.username;

      // Update active thread if it matches
      setActiveChat(prev => {
        if (prev && prev.username === otherUsername) {
          setMessages(old => {
            const alreadyExists = old.some(m => m._id === msg._id);
            if (alreadyExists) return old;
            return [...old, msg];
          });
          return prev;
        }
        return prev;
      });

      // Update unread count if message is for us and panel is not on that thread
      if (msg.recipient._id === currentUser.id) {
        setActiveChat(prev => {
          if (!prev || prev.username !== otherUsername) {
            setUnreadTotal(n => n + 1);
            setConversations(old => {
              const existing = old.find(c => c.username === otherUsername);
              if (existing) {
                return old.map(c =>
                  c.username === otherUsername
                    ? { ...c, lastMessage: { content: msg.content, createdAt: msg.createdAt }, unreadCount: c.unreadCount + 1 }
                    : c
                ).sort((a, b) => new Date(b.lastMessage?.createdAt) - new Date(a.lastMessage?.createdAt));
              }
              return [{
                userId: otherId,
                username: otherUsername,
                avatarUrl: msg.sender.avatarUrl,
                rank: '',
                lastMessage: { content: msg.content, createdAt: msg.createdAt, senderId: msg.sender._id },
                unreadCount: 1,
              }, ...old];
            });
          }
          return prev;
        });
      } else {
        // Sent by us: update conversation list
        setConversations(old => {
          const existing = old.find(c => c.username === otherUsername);
          if (existing) {
            return old.map(c =>
              c.username === otherUsername
                ? { ...c, lastMessage: { content: msg.content, createdAt: msg.createdAt, senderId: msg.sender._id } }
                : c
            ).sort((a, b) => new Date(b.lastMessage?.createdAt) - new Date(a.lastMessage?.createdAt));
          }
          return old;
        });
      }
    };

    socket.on('receive_message', onReceive);
    return () => socket.off('receive_message', onReceive);
  }, [currentUser]);

  // Fetch unread count on mount
  useEffect(() => {
    if (!currentUser) return;
    fetch(`${API_BASE}/api/chat/unread-count`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : { count: 0 })
      .then(d => setUnreadTotal(d.count))
      .catch(() => {});
  }, [currentUser]);

  // Fetch conversations when panel opens to list view
  useEffect(() => {
    if (!open || view !== 'list' || !currentUser) return;
    setLoadingConvs(true);
    fetch(`${API_BASE}/api/chat/conversations`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : { conversations: [] })
      .then(d => setConversations(d.conversations || []))
      .catch(() => {})
      .finally(() => setLoadingConvs(false));
  }, [open, view, currentUser]);

  // Fetch messages when thread opens
  const openThread = useCallback(async (user) => {
    setActiveChat(user);
    setView('thread');
    setMessages([]);
    setLoadingMsgs(true);
    setDraft('');
    try {
      const r = await fetch(`${API_BASE}/api/chat/messages/${encodeURIComponent(user.username)}`, { credentials: 'include' });
      const d = r.ok ? await r.json() : { messages: [] };
      setMessages(d.messages || []);
      // Mark as read
      await fetch(`${API_BASE}/api/chat/messages/${encodeURIComponent(user.username)}/read`, {
        method: 'PUT', credentials: 'include'
      });
      setConversations(old => old.map(c =>
        c.username === user.username ? { ...c, unreadCount: 0 } : c
      ));
      setUnreadTotal(n => Math.max(0, n - (conversations.find(c => c.username === user.username)?.unreadCount || 0)));
    } catch {
    } finally {
      setLoadingMsgs(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [conversations]);

  // Scroll to bottom when new messages arrive in active thread
  useEffect(() => {
    if (view === 'thread') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, view]);

  // User search
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

  if (!currentUser) return null;

  return (
    <>
      {/* ── Floating Toggle Button ── */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) { setView('list'); setSearchQuery(''); setSearchResults([]); } }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 24px rgba(99,102,241,0.5)' }}
        aria-label="Toggle chat"
        id="chat-toggle-btn"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {unreadTotal > 0 && !open && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg">
            {unreadTotal > 99 ? '99+' : unreadTotal}
          </span>
        )}
      </button>

      {/* ── Chat Panel ── */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[360px] flex flex-col rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        style={{ height: '520px', background: '#0d1117', border: '1px solid rgba(255,255,255,0.09)' }}
      >
        {/* Panel header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07]" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))' }}>
          {view === 'thread' && (
            <button
              onClick={() => { setView('list'); setActiveChat(null); setMessages([]); }}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 flex-shrink-0"
              aria-label="Back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {view === 'thread' && activeChat ? (
            <>
              <Avatar username={activeChat.username} avatarUrl={activeChat.avatarUrl} rank={activeChat.rank} size={8} />
              <div className="flex-1 min-w-0">
                <a href={`/profile/${activeChat.username}`} className="text-sm font-bold text-slate-100 hover:text-accent transition-colors truncate block">
                  {activeChat.username}
                </a>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm font-bold text-slate-100">Messages</span>
              {unreadTotal > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                  {unreadTotal} new
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── List view ── */}
        {view === 'list' && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Search bar */}
            <div className="px-3 py-2.5 border-b border-white/[0.05]">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  className="w-full bg-white/5 border border-white/[0.08] rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors"
                  placeholder="Search users to message..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
                )}
              </div>
            </div>

            {/* Search results */}
            {searchQuery && (
              <div className="border-b border-white/[0.05]">
                {searchResults.length > 0 ? (
                  searchResults.map(u => (
                    <button
                      key={u._id}
                      onClick={() => { openThread({ username: u.username, avatarUrl: u.avatarUrl, rank: u.rank }); setSearchQuery(''); setSearchResults([]); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                    >
                      <Avatar username={u.username} avatarUrl={u.avatarUrl} rank={u.rank} size={8} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-200 truncate">{u.username}</p>
                        {u.rank && <p className="text-[11px] capitalize" style={{ color: cfRankColor(u.rank) }}>{u.rank}</p>}
                      </div>
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))
                ) : !searching ? (
                  <p className="text-xs text-slate-500 text-center py-3">No users found</p>
                ) : null}
              </div>
            )}

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              {loadingConvs ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-3 w-24 bg-white/10 rounded mb-2" />
                      <div className="h-2.5 w-36 bg-white/[0.07] rounded" />
                    </div>
                  </div>
                ))
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <svg className="w-8 h-8 text-accent/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-300">No conversations yet</p>
                    <p className="text-xs text-slate-500 mt-1">Search for a user above to start chatting</p>
                  </div>
                </div>
              ) : (
                conversations.map(conv => (
                  <button
                    key={conv.userId}
                    onClick={() => openThread({ username: conv.username, avatarUrl: conv.avatarUrl, rank: conv.rank })}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors text-left border-b border-white/[0.04] relative"
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar username={conv.username} avatarUrl={conv.avatarUrl} rank={conv.rank} size={10} />
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-accent text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-sm font-semibold truncate ${conv.unreadCount > 0 ? 'text-white' : 'text-slate-300'}`}>
                          {conv.username}
                        </span>
                        <span className="text-[10px] text-slate-600 flex-shrink-0">{timeAgo(conv.lastMessage?.createdAt)}</span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-slate-300 font-medium' : 'text-slate-500'}`}>
                        {conv.lastMessage?.senderId === currentUser.id ? 'You: ' : ''}{conv.lastMessage?.content}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Thread view ── */}
        {view === 'thread' && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1.5">
              {loadingMsgs ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
                  <Avatar username={activeChat?.username} avatarUrl={activeChat?.avatarUrl} rank={activeChat?.rank} size={14} />
                  <div>
                    <p className="text-sm font-bold text-slate-200 mt-2">{activeChat?.username}</p>
                    <p className="text-xs text-slate-500 mt-1">Say hello! Start the conversation.</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.sender._id === currentUser.id || msg.sender.username === currentUser.username;
                  const prevMsg = messages[i - 1];
                  const showAvatar = !isMe && (i === 0 || prevMsg?.sender?.username !== msg.sender?.username);
                  return (
                    <div key={msg._id || i} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isMe && (
                        <div className={`flex-shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                          <Avatar username={msg.sender?.username} avatarUrl={msg.sender?.avatarUrl} rank={activeChat?.rank} size={6} />
                        </div>
                      )}
                      <div className={`max-w-[72%] flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                            isMe
                              ? 'rounded-br-sm text-white'
                              : 'rounded-bl-sm bg-white/[0.07] text-slate-200'
                          }`}
                          style={isMe ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-slate-600 px-1">{timeAgo(msg.createdAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="px-3 py-3 border-t border-white/[0.07]">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  rows={1}
                  className="flex-1 bg-white/[0.06] border border-white/[0.09] rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors resize-none leading-relaxed"
                  placeholder={`Message ${activeChat?.username}…`}
                  value={draft}
                  onChange={e => {
                    setDraft(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                  }}
                  onKeyDown={handleKeyDown}
                  style={{ minHeight: '40px', maxHeight: '100px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!draft.trim() || sending}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                  style={{ background: draft.trim() ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.06)' }}
                  aria-label="Send message"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                  </svg>
                </button>
              </div>
              <p className="text-[10px] text-slate-600 mt-1.5 text-center">Enter to send · Shift+Enter for newline</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
