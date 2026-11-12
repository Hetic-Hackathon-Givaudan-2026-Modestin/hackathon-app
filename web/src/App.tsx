import { Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { ProjectPage } from './pages/ProjectPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<ProjectPage />} />
      <Route path="/demo" element={<HomePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
