import './index.css';
import { useState, useEffect } from 'react';
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
import ChatPanel from './components/ChatPanel.jsx';
import { API_BASE } from './apiConfig.js';

function Router() {
  const path = window.location.pathname;
  if (path === '/auth')              return <AuthPage />;
  if (path === '/admin')             return <AdminPage />;
  if (path === '/verify')            return <VerifyPage />;
  if (path === '/create-editorial')  return <CreateEditorialPage />;
  if (path === '/editorials')        return <EditorialsPage />;
  if (path === '/contests')          return <ContestsPage />;
  if (path === '/recommender')       return <RecommenderPage />;
  if (path.startsWith('/profile/'))  return <ProfilePage />;
  if (path.startsWith('/post/') || path.startsWith('/editorial/')) return <PostPage />;
  if (path === '/arena')             return <ArenaPage />;
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

  // Don't show chat panel on auth page or arena
  const showChat = currentUser && window.location.pathname !== '/auth' && window.location.pathname !== '/arena';

  return (
    <>
      <Router />
      {showChat && <ChatPanel currentUser={currentUser} />}
    </>
  );
}
