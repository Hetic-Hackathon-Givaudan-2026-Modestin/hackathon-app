import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { Button } from '../components/ui/Button';
import { PasswordField } from '../components/ui/PasswordField';
import { TextField } from '../components/ui/TextField';
import { useFormValues } from '../hooks/useFormValues';

export function LoginPage() {
  const { values, onChange } = useFormValues({ email: '', password: '' });
  const [status, setStatus] = useState('');

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    // La connexion n'est pas encore branchée à l'API.
    setStatus(
      values.email && values.password
        ? "La connexion n'est pas encore connectée à l'API."
        : 'Renseignez votre email et votre mot de passe.',
    );
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
        <Button type="submit">Se connecter</Button>
        {status && (
          <p className="auth__status" role="status">
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
