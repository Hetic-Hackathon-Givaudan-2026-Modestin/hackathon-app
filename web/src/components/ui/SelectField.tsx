import type { SelectHTMLAttributes } from 'react';
import { FieldShell, fieldA11y, type FieldProps } from './FieldShell';

export type Option = { value: string; label: string };

type SelectFieldProps = FieldProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & {
    options: Option[];
    placeholder: string;
  };

export function SelectField({
  id,
  label,
  error,
  options,
  placeholder,
  ...selectProps
}: SelectFieldProps) {
  return (
    <FieldShell id={id} label={label} error={error}>
      <div className="ui-input">
        <select {...selectProps} {...fieldA11y(id, error)}>
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </FieldShell>
  );
}
