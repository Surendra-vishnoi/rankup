import { useState, useRef, useEffect } from 'react';
import { API_BASE } from '../apiConfig.js';
import Navbar from '../components/Navbar.jsx';

const LANGUAGES = [
  { id: 'cpp',        label: 'C++17',      judge0Id: 54, placeholder: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    cout << "Hello, RankUp!" << endl;\n    return 0;\n}' },
  { id: 'c',          label: 'C (GCC)',    judge0Id: 50, placeholder: '#include <stdio.h>\n\nint main() {\n    printf("Hello, RankUp!\\n");\n    return 0;\n}' },
  { id: 'python',     label: 'Python 3',   judge0Id: 71, placeholder: 'import sys\n\ndef main():\n    print("Hello, RankUp!")\n\nif __name__ == "__main__":\n    main()' },
  { id: 'java',       label: 'Java',       judge0Id: 62, placeholder: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, RankUp!");\n    }\n}' },
  { id: 'javascript', label: 'JavaScript', judge0Id: 63, placeholder: 'console.log("Hello, RankUp!");' },
];

export default function PlaygroundPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(LANGUAGES[0].placeholder);
  const [stdin, setStdin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [outputData, setOutputData] = useState(null);

  // Auth check on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/auth/verify`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.isAuthenticated) {
          setCurrentUser(d.user);
        } else {
          window.location.href = '/auth';
        }
      })
      .catch(() => window.location.href = '/auth');
  }, []);

  const editorRef = useRef(null);
  const lineNumbersRef = useRef(null);

  // Sync scroll between line numbers and textarea
  const handleScroll = () => {
    if (editorRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = editorRef.current.scrollTop;
    }
  };

  // Change language template
  const handleLangChange = (e) => {
    const lang = LANGUAGES.find(l => l.id === e.target.value);
    if (!lang) return;
    setSelectedLang(lang);
    setCode(lang.placeholder);
    setOutputData(null);
    setError('');
  };

  // Tab key indenter
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = editorRef.current;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4;
      });
    }
  };

  const handleRun = async () => {
    setLoading(true);
    setError('');
    setOutputData(null);

    try {
      const res = await fetch(`${API_BASE}/api/arena/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          source_code: code,
          language_id: selectedLang.judge0Id,
          stdin: stdin,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Failed to run code.');
      }

      const result = await res.json();
      setOutputData(result);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Server error. Please ensure your backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const lines = code.split('\n');

  return (
    <div className="min-h-screen bg-bg-deep flex flex-col text-slate-100">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 20% 100%, rgba(139,92,246,0.05) 0%, transparent 60%)'
        }} />
      </div>

      <Navbar user={currentUser} />

      <main className="relative z-10 flex-1 flex flex-col px-4 py-6 md:px-8 max-w-7xl mx-auto w-full gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2.5">
              <span>Code</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-violet">Playground</span>
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              Quickly draft, run, and test code logic using a variety of languages.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="flex items-center gap-2 bg-bg-surface border border-white/10 rounded-xl px-3 py-1.5 shadow-sm">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Lang:</span>
              <select
                value={selectedLang.id}
                onChange={handleLangChange}
                className="bg-transparent text-white text-sm font-semibold outline-none cursor-pointer"
              >
                {LANGUAGES.map(l => (
                  <option key={l.id} value={l.id} className="bg-bg-deep text-slate-200">{l.label}</option>
                ))}
              </select>
            </div>

            {/* Run Button */}
            <button
              onClick={handleRun}
              disabled={loading}
              className="btn-primary flex items-center gap-2 px-5 py-2 text-sm font-bold shadow-btn disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Run Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Editor & I/O split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[500px]">
          {/* Left: Code Editor Container */}
          <div className="lg:col-span-7 card p-0 flex flex-col border border-white/[0.08] overflow-hidden bg-bg-surface/40 backdrop-blur-md rounded-2xl">
            {/* Editor Header */}
            <div className="px-4 py-3 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400">main.{selectedLang.id === 'cpp' ? 'cpp' : selectedLang.id === 'python' ? 'py' : selectedLang.id === 'java' ? 'java' : selectedLang.id === 'c' ? 'c' : 'js'}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(code);
                }}
                className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1.5 transition-colors"
                title="Copy code"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy
              </button>
            </div>

            {/* Code Field with custom Line Numbers */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* Line Numbers gutter */}
              <div 
                ref={lineNumbersRef}
                className="w-12 bg-white/[0.01] border-r border-white/[0.05] py-4 select-none font-mono text-[13px] text-right pr-3 text-slate-600 overflow-hidden leading-[20px]"
              >
                {lines.map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Textarea */}
              <textarea
                ref={editorRef}
                value={code}
                onChange={e => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                onScroll={handleScroll}
                spellCheck="false"
                className="flex-1 bg-transparent py-4 px-3 outline-none resize-none font-mono text-[13px] text-slate-200 overflow-y-auto leading-[20px]"
                placeholder="Write your code here..."
              />
            </div>
          </div>

          {/* Right: Custom Input & Output Panels */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Custom Input */}
            <div className="card flex flex-col p-4 border border-white/[0.08] bg-bg-surface/30 backdrop-blur-md rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Custom Input</h3>
              </div>
              <textarea
                value={stdin}
                onChange={e => setStdin(e.target.value)}
                placeholder="Provide standard input (stdin) for your program here..."
                className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-xs font-mono text-slate-300 placeholder:text-slate-600 outline-none focus:border-accent/40 h-28 resize-none transition-colors"
              />
            </div>

            {/* Output Panel */}
            <div className="card flex-1 flex flex-col p-4 border border-white/[0.08] bg-bg-surface/30 backdrop-blur-md rounded-2xl overflow-hidden min-h-[250px]">
              <div className="flex items-center justify-between gap-4 mb-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Output Console</h3>
                </div>

                {/* Compilation Metadata */}
                {outputData && !loading && (
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {outputData.time && <span>⏱️ {outputData.time}s</span>}
                    {outputData.memory && <span>💾 {(outputData.memory / 1024).toFixed(1)} MB</span>}
                  </div>
                )}
              </div>

              {/* Status Header */}
              {outputData && (
                <div className={`mb-3 p-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between ${
                  outputData.status?.id === 3 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  <span>Status: {outputData.status?.description || 'Compiled'}</span>
                  <span>Code {outputData.status?.id === 3 ? 'AC' : 'Failed'}</span>
                </div>
              )}

              {/* Console Body */}
              <div className="flex-1 bg-black/35 rounded-xl p-3 border border-white/5 overflow-y-auto font-mono text-xs relative">
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <div className="flex items-center gap-2.5 text-slate-400">
                      <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                      <span>Compiling and executing...</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="text-red-400 whitespace-pre-wrap">{error}</div>
                )}

                {!outputData && !loading && !error && (
                  <div className="text-slate-600 italic">Run your code to review stdout, stderr, or compile errors.</div>
                )}

                {outputData && (
                  <div className="space-y-4">
                    {/* stdout */}
                    {outputData.stdout && (
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Standard Output (stdout)</div>
                        <pre className="text-emerald-400 whitespace-pre-wrap">{outputData.stdout}</pre>
                      </div>
                    )}

                    {/* stderr */}
                    {outputData.stderr && (
                      <div>
                        <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider mb-1">Runtime Error (stderr)</div>
                        <pre className="text-red-300 whitespace-pre-wrap">{outputData.stderr}</pre>
                      </div>
                    )}

                    {/* compile_output */}
                    {outputData.compile_output && (
                      <div>
                        <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider mb-1">Compilation Logs</div>
                        <pre className="text-red-300 whitespace-pre-wrap">{outputData.compile_output}</pre>
                      </div>
                    )}

                    {!outputData.stdout && !outputData.stderr && !outputData.compile_output && (
                      <div className="text-slate-500 italic">Program finished executing with no output (exit code 0).</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
