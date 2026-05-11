import { useEffect, useState } from 'react';
import { API_BASE } from '../apiConfig';

const CODE_TOKENS = [
  { text: "#include ", class: "text-pink-400" },
  { text: "<bits/stdc++.h>\n", class: "text-emerald-300" },
  { text: "using namespace ", class: "text-pink-400" },
  { text: "std;\n\n", class: "text-yellow-200" },
  { text: "int ", class: "text-blue-400" },
  { text: "main() {\n", class: "text-yellow-200" },
  { text: "  int ", class: "text-blue-400" },
  { text: "t; ", class: "text-slate-300" },
  { text: "cin >> t;\n", class: "text-blue-300" },
  { text: "  while ", class: "text-pink-400" },
  { text: "(t--) {\n", class: "text-slate-300" },
  { text: "    // Solve optimally\n", class: "text-slate-500" },
  { text: "    long long ", class: "text-blue-400" },
  { text: "n; cin >> n;\n", class: "text-slate-300" },
  { text: "    cout << ", class: "text-blue-300" },
  { text: "\"Accepted\\n\";\n", class: "text-emerald-300" },
  { text: "  }\n", class: "text-slate-300" },
  { text: "  return ", class: "text-pink-400" },
  { text: "0;\n", class: "text-purple-400" },
  { text: "}\n", class: "text-slate-300" }
];

export default function LandingPage({ currentUser }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [typedChars, setTypedChars] = useState(0);

  useEffect(() => {
    const totalChars = CODE_TOKENS.reduce((acc, t) => acc + t.text.length, 0);
    if (typedChars < totalChars) {
      const timeout = setTimeout(() => {
        setTypedChars(c => c + 1);
      }, Math.random() * 20 + 10);
      return () => clearTimeout(timeout);
    }
  }, [typedChars]);

  let remaining = typedChars;
  const renderedTokens = [];
  let isDoneTyping = false;
  for (const token of CODE_TOKENS) {
    if (remaining <= 0) break;
    if (remaining >= token.text.length) {
      renderedTokens.push(token);
      remaining -= token.text.length;
    } else {
      renderedTokens.push({ ...token, text: token.text.slice(0, remaining) });
      remaining = 0;
    }
  }
  if (typedChars >= CODE_TOKENS.reduce((acc, t) => acc + t.text.length, 0)) {
    isDoneTyping = true;
  }

  return (
    <div className="min-h-screen bg-bg-deep text-slate-200 selection:bg-accent/30 font-sans selection:text-white">
      {/* ── Dynamic Background ── */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        {/* Soft emerald glowing orbs */}
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(circle 800px at 15% 15%, rgba(16, 185, 129, 0.08) 0%, transparent 100%),
            radial-gradient(circle 600px at 85% 85%, rgba(16, 185, 129, 0.05) 0%, transparent 100%)
          `
        }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.2) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b ${
        isScrolled ? 'bg-bg-deep/80 backdrop-blur-md border-white/10 shadow-lg' : 'bg-transparent border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded flex items-center justify-center bg-gradient-to-br from-accent to-accent-violet shadow-glow-sm">
              <span className="text-white font-extrabold text-lg leading-none mt-0.5">R</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">RankUp</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#stats" className="hover:text-white transition-colors">Community</a>
          </div>

          <div className="flex items-center gap-4">
            {currentUser ? (
              <a href="/hub" className="btn-primary text-sm px-5 py-2">
                Go to Dashboard
              </a>
            ) : (
              <>
                <a href="/auth" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                  Log in
                </a>
                <a href="/auth" className="btn-primary text-sm px-5 py-2">
                  Sign Up
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="relative z-10">
        
        {/* ── Hero Section ── */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-accent mb-8 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              Platform v2.0 is now live
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight animate-fade-up">
              Master Competitive <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-emerald-300">
                Programming Faster.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto font-medium animate-fade-up" style={{ animationDelay: '0.1s' }}>
              A premium, minimalist platform designed for serious coders. Discuss strategies, view official editorials, and track your Codeforces progress in real-time.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <a href={currentUser ? "/hub" : "/auth"} className="btn-primary w-full sm:w-auto px-8 py-3.5 text-base shadow-glow flex items-center justify-center gap-2">
                Start Coding Now
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </a>
              <a href="#features" className="w-full sm:w-auto px-8 py-3.5 text-base font-bold rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all flex items-center justify-center">
                Explore Features
              </a>
            </div>

            {/* Terminal-like code snippet decorative element */}
            <div className="mt-16 mx-auto max-w-3xl border border-white/10 rounded-xl bg-[#0a0e17]/80 backdrop-blur-sm p-4 text-left shadow-2xl animate-fade-up relative overflow-hidden group" style={{ animationDelay: '0.3s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              <div className="flex items-center gap-2 mb-3 px-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                <div className="text-xs text-slate-500 ml-2 font-mono flex items-center gap-2">
                  solver.cpp <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                </div>
              </div>
              <pre className="text-sm md:text-base font-mono text-slate-300 overflow-x-auto p-2 min-h-[280px]">
                {renderedTokens.map((t, i) => (
                  <span key={i} className={t.class}>{t.text}</span>
                ))}
                {!isDoneTyping && (
                  <span className="inline-block w-2 h-4 bg-accent ml-0.5 animate-pulse" style={{ verticalAlign: 'middle' }} />
                )}
              </pre>
            </div>
          </div>
        </section>

        {/* ── Stats / Highlights ── */}
        <section id="stats" className="border-y border-white/5 bg-white/[0.02]">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/5">
              {[
                { label: 'Active Coders', value: '50K+' },
                { label: 'Problems Solved', value: '2M+' },
                { label: 'Live Editorials', value: '10K+' },
                { label: 'Global Ranking', value: 'Real-time' },
              ].map((stat, i) => (
                <div key={i} className="text-center px-4">
                  <div className="text-3xl md:text-4xl font-black text-white font-mono tracking-tight mb-1">{stat.value}</div>
                  <div className="text-sm text-slate-500 uppercase tracking-widest font-semibold">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features Section ── */}
        <section id="features" className="py-24 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">Built for Performance</h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                Everything you need to improve your rating and dominate the next contest, packed into a blazing-fast dashboard.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="card p-8 bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-accent/40 transition-colors duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Live Arena</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Compete in real-time 1v1 matches. Our matchmaking system finds opponents at your exact skill level using your Codeforces rating.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="card p-8 bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-accent/40 transition-colors duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20v-6M6 20V10M18 20V4"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Advanced Analytics</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Track your solved problems, accuracy, and rating progress automatically. Syncs instantly with Codeforces.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="card p-8 bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-accent/40 transition-colors duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Community Hub</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Discuss approaches, clarify doubts, and read premium editorials from Grandmasters with full LaTeX and code formatting.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── How It Works / Flow ── */}
        <section id="how-it-works" className="py-24 px-6 bg-[#0a0e17]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">The Learning Flow</h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                A simple, proven methodology to consistently increase your rating.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 relative">
              {/* Connecting line (desktop only) */}
              <div className="hidden md:block absolute top-8 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

              {/* Step 1 */}
              <div className="relative text-center">
                <div className="w-16 h-16 mx-auto bg-bg-surface border-2 border-accent rounded-full flex items-center justify-center text-xl font-bold text-white mb-6 relative z-10 shadow-glow-sm">
                  1
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Learn</h3>
                <p className="text-slate-400 text-sm">Review official editorials and community discussions to understand optimal approaches.</p>
              </div>

              {/* Step 2 */}
              <div className="relative text-center">
                <div className="w-16 h-16 mx-auto bg-bg-surface border-2 border-accent rounded-full flex items-center justify-center text-xl font-bold text-white mb-6 relative z-10 shadow-glow-sm">
                  2
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Compete</h3>
                <p className="text-slate-400 text-sm">Put your knowledge to the test in our Live Arena. Code against peers under time pressure.</p>
              </div>

              {/* Step 3 */}
              <div className="relative text-center">
                <div className="w-16 h-16 mx-auto bg-bg-surface border-2 border-accent rounded-full flex items-center justify-center text-xl font-bold text-white mb-6 relative z-10 shadow-glow-sm">
                  3
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Climb</h3>
                <p className="text-slate-400 text-sm">Watch your rating grow. Track your global ranking and unlock prestigious profile badges.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA Section ── */}
        <section className="py-24 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-accent/5 pointer-events-none"></div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Ready to reach the next tier?</h2>
            <p className="text-xl text-slate-400 mb-10">Join thousands of developers leveling up their problem-solving skills today.</p>
            <a href={currentUser ? "/hub" : "/auth"} className="btn-primary inline-flex items-center gap-2 px-10 py-4 text-lg shadow-glow">
              {currentUser ? "Go to Dashboard" : "Create Free Account"}
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </a>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 bg-[#06080d] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
            <div className="w-6 h-6 rounded flex items-center justify-center bg-accent">
              <span className="text-white font-bold text-xs leading-none">R</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">RankUp</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500 font-medium">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Codeforces API</a>
            <a href="https://github.com" className="hover:text-white transition-colors">GitHub</a>
          </div>
          <div className="text-sm text-slate-600">
            &copy; {new Date().getFullYear()} RankUp. Built for coders.
          </div>
        </div>
      </footer>
    </div>
  );
}
