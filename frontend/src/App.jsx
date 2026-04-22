import './index.css';
import HubPage from './pages/HubPage.jsx';
import VerifyPage from './pages/VerifyPage.jsx';
import CreateEditorialPage from './pages/CreateEditorialPage.jsx';
import EditorialsPage from './pages/EditorialsPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ContestsPage from './pages/ContestsPage.jsx';

function Router() {
  const path = window.location.pathname;
  if (path === '/auth')              return <AuthPage />;
  if (path === '/admin')             return <AdminPage />;
  if (path === '/verify')            return <VerifyPage />;
  if (path === '/create-editorial')  return <CreateEditorialPage />;
  if (path === '/editorials')        return <EditorialsPage />;
  if (path === '/contests')          return <ContestsPage />;
  if (path.startsWith('/profile/'))  return <ProfilePage />;
  return <HubPage />;
}

export default function App() {
  return <Router />;
}
