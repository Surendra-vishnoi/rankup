import { useState, useEffect } from 'react';
import { API_BASE } from '../apiConfig.js';
import Navbar from '../components/Navbar.jsx';

export default function AiHintsPage() {
  const [problemUrl, setProblemUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // AI Response state
  const [hintsData, setHintsData] = useState(null);
  const [currentHintIndex, setCurrentHintIndex] = useState(-1);
  const [showEditorial, setShowEditorial] = useState(false);

  useEffect(() => {
    const key = localStorage.getItem('geminiApiKey');
    if (key) setApiKey(key);
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!apiKey) {
      setError('Please set your Gemini API key in Settings first.');
      return;
    }
    if (!problemUrl.includes('codeforces.com')) {
      setError('Please provide a valid Codeforces problem URL.');
      return;
    }

    setLoading(true);
    setError('');
    setHintsData(null);
    setCurrentHintIndex(-1);
    setShowEditorial(false);

    try {
      const res = await fetch(`${API_BASE}/api/ai-editorials/generate-hints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemUrl: problemUrl.trim(), apiKey })
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textData = await res.text();
        throw new Error(`Server returned an invalid response (not JSON). Please restart the backend server. Preview: ${textData.substring(0, 40)}`);
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate hints');
      }

      setHintsData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const hasMoreHints = hintsData && currentHintIndex < hintsData.hints?.length - 1;

  return (
    <div className="min-h-screen bg-bg-deep flex flex-col">
      {/* Background mesh */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 50% at 20% 0%, rgba(99,120,255,0.05) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(167,139,250,0.05) 0%, transparent 60%)'
        }} />
      </div>

      {/* Navbar */}
      <Navbar />

      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        {!apiKey && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
            <div className="text-amber-400 text-xl">⚠️</div>
            <div>
              <h3 className="text-amber-400 font-bold text-sm mb-1">API Key Missing</h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                You need to configure your Gemini API Key in the <a href="/settings" className="font-bold underline hover:text-white">Settings</a> before you can generate hints.
              </p>
            </div>
          </div>
        )}

        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-violet">Hints</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Stuck on a Codeforces problem? Paste the link below to get progressive hints powered by Google Gemini, helping you solve it without spoilers!
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3 mb-10 card p-4 items-center">
          <input
            type="text"
            placeholder="https://codeforces.com/contest/1900/problem/A"
            className="input-field flex-1 py-3 text-sm"
            value={problemUrl}
            onChange={(e) => setProblemUrl(e.target.value)}
            required
          />
          <button 
            type="submit" 
            disabled={loading || !problemUrl}
            className="btn-primary py-3 px-6 font-bold shadow-btn whitespace-nowrap disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Generate Hints
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center text-sm font-semibold mb-8 animate-fade-in">
            {error}
          </div>
        )}

        {/* Loading State Skeleton */}
        {loading && (
          <div className="animate-pulse flex flex-col gap-6">
            <div className="card p-6 border-l-4 border-l-accent/50">
              <div className="h-5 bg-white/10 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-white/5 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-white/5 rounded w-1/2"></div>
            </div>
            <div className="card p-6">
              <div className="h-5 bg-white/10 rounded w-20 mb-4"></div>
              <div className="h-4 bg-white/5 rounded w-full mb-2"></div>
              <div className="h-4 bg-white/5 rounded w-4/5"></div>
            </div>
          </div>
        )}

        {/* AI Output */}
        {hintsData && !loading && (
          <div className="flex flex-col gap-6 pb-20 animate-fade-in-up">
            
            {/* Direction to Think */}
            <div className="card p-6 border-l-4 border-l-accent bg-bg-surface relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 blur-[2px] group-hover:blur-none transition-all duration-500">
                 <svg className="w-16 h-16 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
              </div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-accent mb-3 flex items-center gap-2">
                Direction to Think
              </h2>
              <p className="text-slate-200 text-[15px] leading-relaxed font-medium relative z-10">
                {hintsData.directionToThink}
              </p>
            </div>

            {/* Progressive Hints */}
            {hintsData.hints?.slice(0, currentHintIndex + 1).map((hintObj, idx) => (
               <div key={idx} className="card p-5 border border-white/[0.05] shadow-sm animate-fade-in-up">
                 <div className="flex items-center gap-2 mb-3">
                   <div className="bg-white/10 text-white font-mono text-xs px-2 py-1 rounded font-bold">Hint {idx + 1}</div>
                 </div>
                 <p className="text-slate-300 text-[15px] leading-relaxed mb-4">{hintObj.hint}</p>
                 
                 {hintObj.catch && (
                   <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm flex gap-3">
                     <span className="text-amber-400 mt-0.5">⚠️</span>
                     <div>
                       <span className="font-bold text-amber-400 flex items-center gap-1.5 mb-0.5">
                         The Catch
                       </span>
                       <span className="text-amber-200/80 leading-relaxed">{hintObj.catch}</span>
                     </div>
                   </div>
                 )}
               </div>
            ))}

            {/* Show Next Hint Button */}
            {hasMoreHints && !showEditorial && (
              <div className="text-center py-4">
                <button 
                  onClick={() => setCurrentHintIndex(i => i + 1)}
                  className="btn-ghost py-3 px-6 font-semibold flex items-center gap-2 mx-auto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path></svg>
                  Reveal Next Hint
                </button>
              </div>
            )}

            {/* Full Editorial Reveal */}
            {!hasMoreHints && !showEditorial && (
              <div className="text-center py-8">
                <p className="text-slate-400 text-sm mb-4">You've seen all the hints! Still stuck?</p>
                <button 
                  onClick={() => setShowEditorial(true)}
                  className="bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 py-2.5 px-6 rounded-xl font-bold transition-colors"
                >
                  Reveal Full Editorial & Solution
                </button>
              </div>
            )}

            {/* Editorial & Solution Code */}
            {showEditorial && (
              <div className="animate-fade-in-up flex flex-col gap-6 mt-4 pt-8 border-t border-white/10">
                <div className="text-center mb-2">
                  <h2 className="text-2xl font-extrabold text-white">Full Editorial</h2>
                </div>
                
                {hintsData.editorial?.map((section, idx) => (
                  <div key={idx} className="card p-6 bg-white/[0.02] border border-white/[0.05]">
                    <h3 className="text-lg font-bold text-slate-200 mb-3 text-accent">{section.title}</h3>
                    <p className="text-slate-400 text-[15px] leading-relaxed whitespace-pre-wrap">{section.content}</p>
                  </div>
                ))}

                {hintsData.solutionCode && (
                  <div className="card p-0 overflow-hidden border border-white/[0.1] mt-4">
                    <div className="bg-[#1e1e1e] px-4 py-2 border-b border-white/10 flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-400 font-bold">Solution (C++)</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(hintsData.solutionCode)}
                        className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        Copy
                      </button>
                    </div>
                    <pre className="p-4 bg-[#1e1e1e] overflow-x-auto text-[13px] font-mono text-slate-300 leading-relaxed">
                      <code>{hintsData.solutionCode}</code>
                    </pre>
                  </div>
                )}
                
                {hintsData.solutionExplanation && (
                  <div className="card p-5 border-l-4 border-l-emerald-500 bg-emerald-500/5">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">How it works</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{hintsData.solutionExplanation}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
