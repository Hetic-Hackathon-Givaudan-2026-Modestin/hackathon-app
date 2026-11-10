import type { ReactNode } from 'react';
import './ui.css';

export type FieldProps = {
  id: string;
  label: string;
  error?: string;
};

type FieldShellProps = FieldProps & { children: ReactNode };

// Enveloppe commune : libellé, contrôle et message d'erreur reliés par l'id.
export function FieldShell({ id, label, error, children }: FieldShellProps) {
  return (
    <div className="ui-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <p id={`${id}-error`} className="ui-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function fieldA11y(id: string, error?: string) {
  return {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : undefined,
  } as const;
}
