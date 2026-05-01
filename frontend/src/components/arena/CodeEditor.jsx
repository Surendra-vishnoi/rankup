import { useState, useRef, useEffect } from 'react';

const LANGUAGES = [
  { id: 'cpp',        label: 'C++17',      judge0Id: 54, placeholder: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // your solution\n    return 0;\n}' },
  { id: 'c',          label: 'C (GCC)',    judge0Id: 50, placeholder: '#include <stdio.h>\n\nint main() {\n    // your solution\n    return 0;\n}' },
  { id: 'python',     label: 'Python 3',   judge0Id: 71, placeholder: 'import sys\ninput = sys.stdin.readline\n\n# your solution\n' },
  { id: 'java',       label: 'Java',       judge0Id: 62, placeholder: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // your solution\n    }\n}' },
  { id: 'javascript', label: 'JavaScript', judge0Id: 63, placeholder: 'const lines = require("fs").readFileSync("/dev/stdin","utf8").trim().split("\\n");\n// your solution\n' },
];

export default function CodeEditor({ onRun, onSubmit, isSubmitting, isRunning, disabled }) {
  const [language, setLanguage]   = useState(LANGUAGES[0]);
  const [code, setCode]           = useState(LANGUAGES[0].placeholder);
  const [stdin, setStdin]         = useState('');
  const [runOutput, setRunOutput] = useState(null);
  const [showIO, setShowIO]       = useState(false);
  const textareaRef               = useRef(null);

  // Change language → reset to placeholder
  const handleLangChange = (langId) => {
    const lang = LANGUAGES.find(l => l.id === langId);
    if (!lang) return;
    setLanguage(lang);
    setCode(lang.placeholder);
    setRunOutput(null);
  };

  // Tab key inside textarea → insert spaces
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta    = textareaRef.current;
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4;
      });
    }
  };

  const handleRun = async () => {
    if (!onRun || isRunning) return;
    setRunOutput({ loading: true });
    setShowIO(true);
    const result = await onRun({ code, language: language.id, stdin });
    setRunOutput(result);
  };

  const handleSubmit = () => {
    if (!onSubmit || isSubmitting || disabled) return;
    onSubmit({ code, language: language.id });
  };

  return (
    <div className="editor-panel flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02] flex-shrink-0">
        {/* Language selector */}
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
          <select
            value={language.id}
            onChange={e => handleLangChange(e.target.value)}
            className="bg-bg-surface text-slate-200 text-xs font-mono font-semibold border border-white/10 rounded-lg px-2 py-1 outline-none focus:border-accent/50 cursor-pointer"
          >
            {LANGUAGES.map(l => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowIO(v => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
            </svg>
            I/O
          </button>

          <button
            onClick={handleRun}
            disabled={isRunning || disabled}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            ) : (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            )}
            {isRunning ? 'Running...' : 'Run'}
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || disabled}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-lg bg-gradient-to-r from-accent to-accent-violet text-white shadow-btn hover:shadow-btn-hover hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? (
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            ) : (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7"/></svg>
            )}
            {isSubmitting ? 'Judging...' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Code textarea */}
      <textarea
        ref={textareaRef}
        value={code}
        onChange={e => setCode(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        disabled={disabled}
        className="editor-textarea flex-1"
        style={{ minHeight: showIO ? '40%' : undefined }}
      />

      {/* I/O Panel */}
      {showIO && (
        <div className="border-t border-white/[0.06] flex flex-col bg-black/30 flex-shrink-0" style={{ maxHeight: '45%' }}>
          <div className="flex border-b border-white/[0.05]">
            <div className="flex-1 p-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 px-2">Custom Input</p>
              <textarea
                value={stdin}
                onChange={e => setStdin(e.target.value)}
                placeholder="Enter test input here..."
                className="w-full bg-transparent text-xs font-mono text-slate-300 outline-none resize-none placeholder:text-slate-600 px-2 h-16"
              />
            </div>
            <div className="flex-1 p-2 border-l border-white/[0.05]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 px-2">Output</p>
              <div className="px-2 h-16 overflow-y-auto">
                {runOutput?.loading ? (
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    Running...
                  </div>
                ) : runOutput ? (
                  <div>
                    {runOutput.stdout && <pre className="text-emerald-400 text-xs font-mono whitespace-pre-wrap">{runOutput.stdout}</pre>}
                    {runOutput.stderr && <pre className="text-red-400 text-xs font-mono whitespace-pre-wrap">{runOutput.stderr}</pre>}
                    {!runOutput.stdout && !runOutput.stderr && <span className="text-slate-500 text-xs italic">No output.</span>}
                    {runOutput.time && <p className="text-[10px] text-slate-600 mt-1">⏱ {runOutput.time}s</p>}
                  </div>
                ) : (
                  <span className="text-slate-600 text-xs italic">Press Run to see output.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
