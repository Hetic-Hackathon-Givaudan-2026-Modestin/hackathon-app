import type { InputHTMLAttributes, ReactNode } from 'react';
import { FieldShell, fieldA11y, type FieldProps } from './FieldShell';

type TextFieldProps = FieldProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
    trailing?: ReactNode;
  };

export function TextField({
  id,
  label,
  error,
  trailing,
  ...inputProps
}: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} error={error}>
      <div className="ui-input">
        <input {...inputProps} {...fieldA11y(id, error)} />
        {trailing}
      </div>
    </FieldShell>
  );
}
