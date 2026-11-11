import { Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { WelcomePage } from './pages/WelcomePage';
import { ProfilePage } from './pages/ProfilePage';
import { RequireSession } from './components/RequireSession';
import { SessionProvider } from './components/SessionProvider';

export function App() {
  return (
    <SessionProvider>
    <Routes>
      <Route path="/" element={<RequireSession><WelcomePage /></RequireSession>} />
      <Route path="/profil" element={<RequireSession><ProfilePage /></RequireSession>} />
      <Route path="/demo" element={<HomePage />} />
      <Route path="/inscription" element={<RegisterPage />} />
      <Route path="/connexion" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </SessionProvider>
  );
}
