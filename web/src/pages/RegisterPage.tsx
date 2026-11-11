import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { Button } from '../components/ui/Button';
import { CheckboxField } from '../components/ui/CheckboxField';
import { PasswordField } from '../components/ui/PasswordField';
import { SelectField } from '../components/ui/SelectField';
import { TextField } from '../components/ui/TextField';
import { useFormValues } from '../hooks/useFormValues';
import {
  initialRegistration,
  roleOptions,
  sectorOptions,
  validateRegistration,
  type RegistrationErrors,
} from '../lib/registration';

export function RegisterPage() {
  const { values, onChange, reset } = useFormValues(initialRegistration);
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [status, setStatus] = useState('');
  const [requestError, setRequestError] = useState('');
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending || created) return;
    const found = validateRegistration(values);
    setErrors(found);
    setStatus('');
    setRequestError('');
    if (Object.keys(found).length > 0) return;

    setPending(true);
    try {
      const { fullName, email, company, sector, role, password } = values;
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, company, sector, role, password }),
      });
      if (response.status === 409) {
        setErrors({ email: 'Cette adresse email est déjà utilisée.' });
      } else if (response.status === 400) {
        setRequestError("Les informations d'inscription sont invalides.");
      } else if (response.status === 201) {
        reset();
        setCreated(true);
        setStatus('Votre compte a été créé. Vous pouvez maintenant vous connecter.');
      } else {
        setRequestError("Impossible de créer le compte. Réessayez plus tard.");
      }
    } catch {
      setRequestError("Impossible de joindre l'API. Vérifiez votre connexion.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Bienvenue dans le futur de la création d'arômes et de parfums"
      bubble="Bonjour ! Je suis ravi de vous accompagner. Créez votre compte en quelques instants pour concevoir vos premiers échantillons et explorer nos tendances !"
    >
      <h2>Créer votre compte</h2>
      {!created && (
        <form onSubmit={onSubmit} noValidate>
          <TextField
            id="fullName"
            name="fullName"
            label="Prénom et Nom"
            autoComplete="name"
            value={values.fullName}
            onChange={onChange}
            error={errors.fullName}
          />
          <TextField
            id="email"
            name="email"
            type="email"
            label="Email professionnel"
            autoComplete="email"
            value={values.email}
            onChange={onChange}
            error={errors.email}
          />
          <TextField
            id="company"
            name="company"
            label="Nom de l'entreprise"
            autoComplete="organization"
            value={values.company}
            onChange={onChange}
            error={errors.company}
          />
          <SelectField
            id="sector"
            name="sector"
            label="Secteur d'activité"
            placeholder="Choisir un secteur"
            options={sectorOptions}
            value={values.sector}
            onChange={onChange}
            error={errors.sector}
          />
          <SelectField
            id="role"
            name="role"
            label="Votre rôle / Poste"
            placeholder="Choisir un rôle"
            options={roleOptions}
            value={values.role}
            onChange={onChange}
            error={errors.role}
          />
          <PasswordField
            id="password"
            name="password"
            label="Mot de passe"
            autoComplete="new-password"
            value={values.password}
            onChange={onChange}
            error={errors.password}
          />
          <CheckboxField
            id="acceptTerms"
            name="acceptTerms"
            label="Conditions d'utilisation à venir (case inactive)"
            disabled
            checked={values.acceptTerms}
          />
          <Button type="submit" disabled={pending || created}>
            {pending ? 'Création du compte…' : "Commencer l'aventure Givaudan"}
          </Button>
          {requestError && (
            <p className="ui-field__error" role="alert">
              {requestError}
            </p>
          )}
        </form>
      )}
      {status && (
        <p className="auth__status" role="status">
          {status}
        </p>
      )}
      <p>
        Déjà inscrit ? <Link to="/connexion">Connectez-vous</Link>
      </p>
    </AuthLayout>
  );
}
