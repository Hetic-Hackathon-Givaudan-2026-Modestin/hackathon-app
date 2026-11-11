import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export type User = {
  id: number;
  fullName: string;
  email: string;
  company: string;
  sector: string;
  role: string;
  createdAt: string;
};

type SessionState = {
  user: User | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const { pathname } = useLocation();
  const refresh = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/session', { cache: 'no-store' });
      if (currentRequest !== requestId.current) return;
      if (response.status === 401) {
        setUser(null);
      } else if (response.ok) {
        const profile = await response.json();
        if (currentRequest === requestId.current) setUser(profile);
      } else {
        throw new Error('Impossible de vérifier la session.');
      }
    } catch (reason) {
      if (currentRequest !== requestId.current) return;
      setUser(null);
      setError(reason instanceof Error ? reason.message : 'Impossible de joindre l’API.');
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, pathname]);

  return <SessionContext.Provider value={{ user, loading, error, refresh }}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const session = useContext(SessionContext);
  if (!session) throw new Error('SessionProvider manquant.');
  return session;
}
