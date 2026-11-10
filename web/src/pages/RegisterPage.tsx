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
  const { values, onChange } = useFormValues(initialRegistration);
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [status, setStatus] = useState('');

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validateRegistration(values);
    setErrors(found);
    // La création de compte n'est pas encore branchée à l'API.
    setStatus(
      Object.keys(found).length === 0
        ? "Formulaire valide. La création de compte n'est pas encore connectée à l'API."
        : '',
    );
  }

  return (
    <AuthLayout
      title="Bienvenue dans le futur de la création d'arômes et de parfums"
      bubble="Bonjour ! Je suis ravi de vous accompagner. Créez votre compte en quelques instants pour concevoir vos premiers échantillons et explorer nos tendances !"
    >
      <h2>Créer votre compte</h2>
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
          label="J'accepte les conditions d'utilisation"
          checked={values.acceptTerms}
          onChange={onChange}
          error={errors.acceptTerms}
        />
        <Button type="submit">Commencer l'aventure Givaudan</Button>
        {status && (
          <p className="auth__status" role="status">
            {status}
          </p>
        )}
      </form>
      <p>
        Déjà inscrit ? <Link to="/connexion">Connectez-vous</Link>
      </p>
    </AuthLayout>
  );
}
