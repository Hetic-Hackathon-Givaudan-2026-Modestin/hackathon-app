import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../components/SessionProvider';
import { Button } from '../components/ui/Button';
import { roleOptions, sectorOptions } from '../lib/registration';

export function ProfilePage() {
  const { user, refresh } = useSession();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/session', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!response.ok) throw new Error('Impossible de vous déconnecter.');
      await refresh();
      navigate('/connexion', { replace: true });
    } catch {
      setError('Impossible de vous déconnecter. Réessayez.');
    } finally {
      setPending(false);
    }
  }

  if (!user) return null;
  return (
    <main className="demo">
      <Link to="/">Retour à l’accueil</Link>
      <h1>Mon profil</h1>
      <p><strong>Nom :</strong> {user.fullName}</p>
      <p><strong>Email :</strong> {user.email}</p>
      <p><strong>Entreprise :</strong> {user.company}</p>
      <p><strong>Secteur :</strong> {sectorOptions.find((option) => option.value === user.sector)?.label ?? user.sector}</p>
      <p><strong>Rôle :</strong> {roleOptions.find((option) => option.value === user.role)?.label ?? user.role}</p>
      <Button onClick={() => void logout()} disabled={pending}>{pending ? 'Déconnexion…' : 'Se déconnecter'}</Button>
      {error && <p role="alert">{error}</p>}
    </main>
  );
}
