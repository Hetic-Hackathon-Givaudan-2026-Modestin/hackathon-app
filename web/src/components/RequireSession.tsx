import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from './SessionProvider';
import { Button } from './ui/Button';

export function RequireSession({ children }: { children: ReactNode }) {
  const { user, loading, error, refresh } = useSession();
  if (loading) return <main className="demo">Vérification de la session…</main>;
  if (error) return <main className="demo"><p role="alert">{error}</p><Button onClick={() => void refresh()}>Réessayer</Button></main>;
  if (!user) return <Navigate to="/connexion" replace />;
  return children;
}
