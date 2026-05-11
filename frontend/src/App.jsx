import './index.css';
import { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LandingPage from './pages/LandingPage.jsx';
import HubPage from './pages/HubPage.jsx';
import VerifyPage from './pages/VerifyPage.jsx';
import CreateEditorialPage from './pages/CreateEditorialPage.jsx';
import EditorialsPage from './pages/EditorialsPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ContestsPage from './pages/ContestsPage.jsx';
import PostPage from './pages/PostPage.jsx';
import ArenaPage from './pages/ArenaPage.jsx';
import RecommenderPage from './pages/RecommenderPage.jsx';
import AiHintsPage from './pages/AiHintsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import ContributorsPage from './pages/ContributorsPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import FloatingMessageButton from './components/FloatingMessageButton.jsx';
import { API_BASE } from './apiConfig.js';

function Router({ currentUser }) {
  const path = window.location.pathname;
  if (path === '/')                  return <LandingPage currentUser={currentUser} />;
  if (path === '/hub')               return <HubPage />;
  if (path === '/auth')              return <AuthPage />;
  if (path === '/admin')             return <AdminPage />;
  if (path === '/verify')            return <VerifyPage />;
  if (path === '/create-editorial')  return <CreateEditorialPage />;
  if (path === '/editorials')        return <EditorialsPage />;
  if (path === '/contests')          return <ContestsPage />;
  if (path === '/recommender')       return <RecommenderPage />;
  if (path === '/ai-hints')          return <AiHintsPage />;
  if (path === '/settings')          return <SettingsPage />;
  if (path === '/contributors')      return <ContributorsPage />;
  if (path.startsWith('/profile/'))  return <ProfilePage />;
  if (path.startsWith('/post/') || path.startsWith('/editorial/')) return <PostPage />;
  if (path === '/arena')             return <ArenaPage />;
  if (path === '/messages')          return <MessagesPage />;
  
  // Fallback to hub page if not found (or could be 404)
  return <HubPage />;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Only fetch session once per app load
    fetch(`${API_BASE}/api/auth/verify`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.isAuthenticated) setCurrentUser(d.user); })
      .catch(() => {});
  }, []);

  // Don't show floating button on landing, auth page, arena, or messages page itself
  const path = window.location.pathname;
  const showChatBtn = currentUser && path !== '/' && path !== '/auth' && path !== '/arena' && path !== '/messages';

  const clientId = '9419506979-o8r2ggcfuebkrp6i6q0tnrksnahipv5o.apps.googleusercontent.com';

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Router currentUser={currentUser} />
      {showChatBtn && <FloatingMessageButton currentUser={currentUser} />}
    </GoogleOAuthProvider>
  );
}
