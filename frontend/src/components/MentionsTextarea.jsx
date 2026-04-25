import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE } from '../apiConfig';

export default function MentionsTextarea({ value, onChange, onKeyDown: parentOnKeyDown, placeholder, className, rows }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [mentionStartIdx, setMentionStartIdx] = useState(-1);
  const textareaRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (!showDropdown || !query) {
      setUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/search?q=${query}`);
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users.slice(0, 5)); // Limit to 5 suggestions
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error('Search error', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, showDropdown]);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.substring(0, cursorPos);
    
    // Find if the cursor is currently inside a word starting with @
    const match = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_]*)$/);
    if (match) {
      setShowDropdown(true);
      setQuery(match[1]);
      setMentionStartIdx(cursorPos - match[1].length - 1); // Index of the '@'
    } else {
      setShowDropdown(false);
    }
  };

  const handleSelect = useCallback((username) => {
    const textBefore = value.substring(0, mentionStartIdx);
    // Find the end of the current word
    const textAfterCursor = value.substring(textareaRef.current.selectionStart);
    const textAfterMatch = textAfterCursor.replace(/^[a-zA-Z0-9_]*/, ''); // Remove the rest of the typed word

    const newValue = `${textBefore}@${username} ${textAfterMatch}`;
    onChange(newValue);
    setShowDropdown(false);
    
    // Focus back and set cursor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = mentionStartIdx + username.length + 2; // +2 for @ and space
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  }, [value, mentionStartIdx, onChange]);

  const handleKeyDown = (e) => {
    if (showDropdown && users.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % users.length);
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + users.length) % users.length);
        return;
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleSelect(users[selectedIndex].username);
        return;
      } else if (e.key === 'Escape') {
        setShowDropdown(false);
        return;
      }
    }
    
    // Call parent onKeyDown if it exists and we didn't handle it
    if (parentOnKeyDown) {
      parentOnKeyDown(e);
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClick = (e) => {
      if (textareaRef.current && !textareaRef.current.contains(e.target)) {
        // give time for handleSelect to fire if clicking a suggestion
        setTimeout(() => setShowDropdown(false), 200); 
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        rows={rows}
      />
      
      {showDropdown && users.length > 0 && (
        <div className="absolute z-50 left-0 w-64 bg-bg-surface border border-white/10 rounded-lg shadow-xl overflow-hidden mt-1 max-h-48 overflow-y-auto">
          {users.map((u, idx) => (
            <div
              key={u._id}
              onClick={() => handleSelect(u.username)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`flex items-center gap-2 p-2 cursor-pointer transition-colors
                ${idx === selectedIndex ? 'bg-accent/20 border-l-2 border-accent' : 'hover:bg-white/5 border-l-2 border-transparent'}`}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent to-accent-violet flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                {u.username[0].toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-200 truncate">{u.username}</span>
                {u.cfHandle && <span className="text-[10px] text-slate-500 truncate">@{u.cfHandle}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
