import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { useSession } from '../components/SessionProvider';
import { Button } from '../components/ui/Button';
import { PasswordField } from '../components/ui/PasswordField';
import { TextField } from '../components/ui/TextField';
import { useFormValues } from '../hooks/useFormValues';

export function LoginPage() {
  const { values, onChange, reset } = useFormValues({ email: '', password: '' });
  const [status, setStatus] = useState('');
  const [pending, setPending] = useState(false);
  const { refresh } = useSession();
  const navigate = useNavigate();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    if (!values.email.trim() || !values.password) {
      setStatus('Renseignez votre email et votre mot de passe.');
      return;
    }
    setPending(true);
    setStatus('');
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (response.status === 401) {
        setStatus('Email ou mot de passe incorrect.');
      } else if (response.status === 429) {
        setStatus('Trop de tentatives. Réessayez plus tard.');
      } else if (response.status === 400) {
        setStatus('Renseignez un email et un mot de passe valides.');
      } else if (response.status !== 204) {
        setStatus('Impossible de vous connecter. Réessayez plus tard.');
      } else {
        reset();
        await refresh();
        navigate('/', { replace: true });
      }
    } catch {
      setStatus("Impossible de joindre l'API. Vérifiez votre connexion.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Heureux de vous revoir"
      bubble="Bonjour ! Connectez-vous pour retrouver vos échantillons et vos commandes."
    >
      <h2>Connexion</h2>
      <form onSubmit={onSubmit} noValidate>
        <TextField
          id="email"
          name="email"
          type="email"
          label="Email professionnel"
          autoComplete="email"
          value={values.email}
          onChange={onChange}
        />
        <PasswordField
          id="password"
          name="password"
          label="Mot de passe"
          autoComplete="current-password"
          value={values.password}
          onChange={onChange}
        />
        <Button type="submit" disabled={pending}>
          {pending ? 'Connexion…' : 'Se connecter'}
        </Button>
        {status && (
          <p className="auth__status" role="alert">
            {status}
          </p>
        )}
      </form>
      <p>
        Pas encore de compte ? <Link to="/inscription">Inscrivez-vous</Link>
      </p>
    </AuthLayout>
  );
}
