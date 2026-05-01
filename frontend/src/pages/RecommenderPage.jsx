import { useState, useEffect, useMemo, useCallback } from 'react';
import { API_BASE } from '../apiConfig';

export default function RecommenderPage() {
    const [handlesInput, setHandlesInput] = useState('');
    const [minRating, setMinRating] = useState(800);
    const [maxRating, setMaxRating] = useState(1200);
    
    const [allTags, setAllTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState(new Set());
    
    const [problems, setProblems] = useState([]);
    const [ratedContests, setRatedContests] = useState(new Set());
    
    const [loadingData, setLoadingData] = useState(true);
    const [searching, setSearching] = useState(false);
    
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        // Fetch logged in user CF handle if any
        fetch(`${API_BASE}/api/auth/verify`, { credentials: 'include' })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.isAuthenticated && data.user?.cfHandle) {
                    setHandlesInput(data.user.cfHandle);
                }
            })
            .catch(() => {});

        // Fetch problems and contests
        const loadGlobalData = async () => {
            try {
                // Fetch problemset
                const probRes = await fetch("https://codeforces.com/api/problemset.problems");
                const probData = await probRes.json();
                if (probData.status === 'OK') {
                    const sortedProbs = probData.result.problems.sort((a, b) => (b.contestId || 0) - (a.contestId || 0));
                    setProblems(sortedProbs);
                    
                    const tagSet = new Set();
                    sortedProbs.forEach(p => {
                        (p.tags || []).forEach(t => tagSet.add(t));
                    });
                    setAllTags(Array.from(tagSet).sort());
                }

                // Fetch rated contests
                const contestRes = await fetch("https://codeforces.com/api/contest.list");
                const contestData = await contestRes.json();
                if (contestData.status === 'OK') {
                    const rated = new Set();
                    contestData.result.forEach(contest => {
                        const name = (contest.name || "").toLowerCase();
                        if (!name.includes('unrated')) {
                            rated.add(contest.id);
                        }
                    });
                    setRatedContests(rated);
                }
            } catch (err) {
                console.error("Failed to load Codeforces data", err);
            } finally {
                setLoadingData(false);
            }
        };

        loadGlobalData();
    }, []);

    const toggleTag = (tag) => {
        setSelectedTags(prev => {
            const next = new Set(prev);
            if (next.has(tag)) next.delete(tag);
            else next.add(tag);
            return next;
        });
    };

    const handleSearch = async () => {
        if (!handlesInput.trim()) {
            setErrorMsg("Please enter at least one Codeforces handle.");
            return;
        }
        if (loadingData || problems.length === 0) {
            setErrorMsg("Still loading problem list from Codeforces, please wait...");
            return;
        }

        setErrorMsg('');
        setSearching(true);
        setResult(null);

        const handles = handlesInput.split(',').map(h => h.trim()).filter(h => h !== '');
        const attemptedProblems = new Set();
        const attemptedContests = new Set();

        try {
            // Fetch status for all provided handles
            for (const handle of handles) {
                const url = `https://codeforces.com/api/user.status?handle=${handle}`;
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.status === 'OK') {
                    data.result.forEach(submission => {
                        const problem = submission.problem;
                        if (problem.contestId && problem.index) {
                            attemptedProblems.add(`${problem.contestId}_${problem.index}`);
                            attemptedContests.add(problem.contestId);
                        }
                    });
                } else if (data.status === 'FAILED') {
                    throw new Error(`Codeforces API error for handle ${handle}: ${data.comment}`);
                }
            }

            // Find problem logic
            const ratingFiltered = problems.filter(p => 
                p.rating && p.rating >= minRating && p.rating <= maxRating
            );

            let found = null;
            const targetTagsArr = Array.from(selectedTags);

            for (const p of ratingFiltered) {
                const problemId = `${p.contestId}_${p.index}`;
                const problemTags = p.tags || [];

                const isAvailable = attemptedContests.has(p.contestId) && 
                                    ratedContests.has(p.contestId) &&
                                    !attemptedProblems.has(problemId);

                if (!isAvailable) continue;

                // Intersection check for tags
                if (targetTagsArr.length > 0) {
                    const hasSelectedTag = targetTagsArr.some(tag => problemTags.includes(tag));
                    if (!hasSelectedTag) continue;
                }

                found = p;
                break;
            }

            if (found) {
                setResult(found);
            } else {
                setErrorMsg("PROBLME IS NOT AVAILABLE AT THIS rating for this tag");
            }
        } catch (err) {
            console.error(err);
            setErrorMsg(err.message || "An error occurred while fetching user data.");
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-deep relative overflow-hidden">
            {/* Mesh background */}
            <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
                <div className="absolute inset-0" style={{
                    background: 'radial-gradient(circle at 10% 20%, rgba(99,120,255,0.1) 0%, transparent 50%), radial-gradient(circle at 90% 80%, rgba(167,139,250,0.1) 0%, transparent 50%)'
                }} />
            </div>

            <header className="sticky top-0 z-40 border-b border-white/[0.07] backdrop-blur-xl bg-bg-deep/80 h-14 flex items-center px-6">
                <a href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-violet flex items-center justify-center text-sm font-extrabold text-white shadow-btn">R</div>
                    <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white to-accent-violet bg-clip-text text-transparent">RankUp</span>
                </a>
            </header>

            <main className="relative z-10 max-w-4xl mx-auto px-6 py-12">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold tracking-tight text-white mb-3">
                        Problem Recommender
                    </h1>
                    <p className="text-slate-400">
                        Find unsolved Codeforces problems that match your current skill level and favorite topics.
                    </p>
                </div>

                <div className="card p-6 border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] mb-8 relative">
                    {loadingData && (
                        <div className="absolute top-2 right-4 text-xs font-semibold text-accent animate-pulse flex items-center gap-2">
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="30 30" opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>
                            Caching CF Database...
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Codeforces Handles (comma separated)</label>
                            <input 
                                type="text" 
                                className="w-full bg-bg-surface border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-accent outline-none transition-colors"
                                value={handlesInput}
                                onChange={e => setHandlesInput(e.target.value)}
                                placeholder="tourist, Benq"
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Min Rating</label>
                                <input 
                                    type="number" 
                                    step="100"
                                    className="w-full bg-bg-surface border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-accent outline-none transition-colors"
                                    value={minRating}
                                    onChange={e => setMinRating(Number(e.target.value))}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Max Rating</label>
                                <input 
                                    type="number" 
                                    step="100"
                                    className="w-full bg-bg-surface border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-accent outline-none transition-colors"
                                    value={maxRating}
                                    onChange={e => setMaxRating(Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Filter by Tags <span className="text-slate-500 font-normal text-xs">(Must contain ANY selected tag)</span></label>
                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-bg-surface/50 rounded-xl border border-white/[0.05]">
                            {allTags.length === 0 && <span className="text-slate-500 text-xs mt-1 ml-1">Loading tags...</span>}
                            {allTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => toggleTag(tag)}
                                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border
                                        ${selectedTags.has(tag) 
                                            ? 'bg-accent/20 border-accent text-accent shadow-[0_0_10px_rgba(99,102,241,0.2)]' 
                                            : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'}`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={handleSearch}
                        disabled={searching || loadingData}
                        className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {searching ? (
                            <>
                                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="30 30" opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>
                                Analyzing history...
                            </>
                        ) : 'Recommend Problem'}
                    </button>

                    {errorMsg && (
                        <div className="mt-4 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-sm font-semibold flex items-center gap-2">
                            <span className="text-lg">✖</span> {errorMsg}
                        </div>
                    )}
                </div>

                {/* Result Card */}
                {result && (
                    <div className="card p-8 border border-accent/20 bg-gradient-to-br from-accent/10 to-accent-violet/5 animate-fade-in ring-1 ring-white/10 shadow-[0_0_30px_rgba(99,102,241,0.1)] relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl" />
                        
                        <div className="text-xs font-extrabold uppercase tracking-widest text-accent mb-2">Match Found</div>
                        <h2 className="text-3xl font-extrabold text-white mb-1"><span className="text-slate-400 font-medium mr-2">{result.contestId}{result.index}.</span>{result.name}</h2>
                        
                        <div className="flex flex-wrap gap-2 mt-4 mb-6">
                            <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold rounded-full font-mono">
                                ★ {result.rating}
                            </span>
                            {result.tags?.map(t => (
                                <span key={t} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full">
                                    {t}
                                </span>
                            ))}
                        </div>

                        <a 
                            href={`https://codeforces.com/contest/${result.contestId}/problem/${result.index}`}
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-bg-deep font-bold rounded-lg hover:bg-slate-200 transition-colors shadow-lg"
                        >
                            Solve on Codeforces
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                        </a>
                    </div>
                )}
            </main>
        </div>
    );
}
