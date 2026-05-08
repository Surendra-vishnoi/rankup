import { useState, useEffect } from 'react';

const DURATION_RATING = [
  { day: 0, min: 2000, max: 2000, label: 'Sunday Expert' }, // Sunday is 0 in JS
  { day: 1, min: 800, max: 900, label: 'Monday Warmup' },
  { day: 2, min: 1000, max: 1100, label: 'Tuesday Basics' },
  { day: 3, min: 1200, max: 1300, label: 'Wednesday Grinder' },
  { day: 4, min: 1400, max: 1500, label: 'Thursday Hustle' },
  { day: 5, min: 1600, max: 1700, label: 'Friday Challenge' },
  { day: 6, min: 1800, max: 1900, label: 'Saturday Advanced' },
];

function getDailyHash(date) {
  const str = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export default function ProblemOfTheDayWidget({ user }) {
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dayInfo, setDayInfo] = useState(null);
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const config = DURATION_RATING.find(d => d.day === dayOfWeek);
    setDayInfo(config);
    
    fetch("https://codeforces.com/api/problemset.problems")
      .then(res => res.json())
      .then(data => {
        if (data.status === 'OK') {
          // problems are usually sorted by contestId descending
          let problems = data.result.problems;
          
          // filter by rating
          const filtered = problems.filter(p => 
            p.rating && p.rating >= config.min && p.rating <= config.max
          );

          if (filtered.length > 0) {
            // Pick a deterministic problem for today
            const hash = getDailyHash(today);
            const selectedProblem = filtered[hash % filtered.length];
            setProblem(selectedProblem);
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
      })
      .catch((err) => {
        console.error("POTD fetch error:", err);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);
  
  useEffect(() => {
    if (!user?.cfHandle || !problem) return;

    fetch(`https://codeforces.com/api/user.status?handle=${user.cfHandle}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'OK') {
          const isSolved = data.result.some(sub => 
            sub.verdict === 'OK' && 
            sub.problem.contestId === problem.contestId && 
            sub.problem.index === problem.index
          );
          setSolved(isSolved);
        }
      })
      .catch(err => console.error("Error checking POTD status:", err));
  }, [user, problem]);

  if (error || (!loading && !problem)) {
    return null; // hide widget on error
  }

  return (
    <div className="card p-4 border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 relative overflow-hidden">
      <div className="absolute -right-6 -top-6 w-20 h-20 bg-indigo-500/20 rounded-full blur-2xl" />
      
      <div className="flex items-center gap-2 mb-3 relative z-10">
        <div className="flex items-center justify-center w-7 h-7 rounded bg-indigo-500/20 text-indigo-400">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 leading-none">
            Problem of the Day
          </h2>
          {dayInfo && (
            <p className="text-[10px] text-slate-400 mt-0.5">{dayInfo.label} • {dayInfo.min}-{dayInfo.max}</p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse flex flex-col gap-2 relative z-10">
          <div className="h-4 w-3/4 bg-white/10 rounded" />
          <div className="h-3 w-1/4 bg-white/5 rounded" />
          <div className="h-8 w-full bg-indigo-500/20 rounded mt-2" />
        </div>
      ) : (
        <div className="relative z-10 animate-fade-in">
          <h3 className="text-sm font-bold text-white mb-1 line-clamp-2 leading-tight" title={problem.name}>
            <span className="text-slate-400 mr-1.5 font-medium">{problem.contestId}{problem.index}</span>
            {problem.name}
          </h3>
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-[10px] font-bold rounded">
               Rating {problem.rating}
            </span>
          </div>
          
          {solved ? (
            <div className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-500/20 text-emerald-400 font-bold text-xs rounded-lg border border-emerald-500/30">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Solved
            </div>
          ) : (
            <a
              href={`https://codeforces.com/contest/${problem.contestId}/problem/${problem.index}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs rounded-lg transition-colors shadow-lg"
            >
              Solve Problem
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
