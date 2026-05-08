import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const key = localStorage.getItem('geminiApiKey');
    if (key) setApiKey(key);
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('geminiApiKey', apiKey.trim());
    } else {
      localStorage.removeItem('geminiApiKey');
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-bg-deep py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-100 bg-gradient-to-r from-white to-accent-violet bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-slate-400 mt-2">Manage your app preferences and API integrations.</p>
        </div>

        {/* Settings Card */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
            <span className="text-2xl">🔑</span> Gemini API Key
          </h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            RankUp's AI features (like Codeforces AI Hints) require a Google Gemini API key to operate. 
            Because AI generation costs money, we allow you to use your own free tier API key to access this feature!
            Your key is <strong>stored locally in your browser</strong> and is never saved on our database.
          </p>

          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Your API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="input-field py-3 font-mono text-sm"
              />
              <p className="text-[11px] text-slate-500 mt-2">
                Don't have one? Get a free API key from{' '}
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Google AI Studio
                </a>.
              </p>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <button 
                type="submit" 
                className="btn-primary py-2.5 px-6 font-bold shadow-btn"
              >
                Save Settings
              </button>
              {saved && (
                <span className="text-emerald-400 text-sm font-semibold flex items-center gap-1.5 animate-fade-in">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  Saved!
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
