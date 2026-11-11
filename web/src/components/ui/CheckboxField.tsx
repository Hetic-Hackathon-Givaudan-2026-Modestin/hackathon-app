import type { InputHTMLAttributes, ReactNode } from 'react';
import { fieldA11y } from './FieldShell';

type CheckboxFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id' | 'type'
> & {
  id: string;
  label: ReactNode;
  error?: string;
};

export function CheckboxField({
  id,
  label,
  error,
  ...inputProps
}: CheckboxFieldProps) {
  return (
    <div className="ui-field">
      <label className="ui-checkbox" htmlFor={id}>
        <input type="checkbox" {...inputProps} {...fieldA11y(id, error)} />
        <span>{label}</span>
      </label>
      {error && (
        <p id={`${id}-error`} className="ui-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
