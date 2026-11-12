import type { ChangeEvent } from 'react';
import type { Option } from './SelectField';
import './ui.css';

type RadioGroupFieldProps = {
  name: string;
  label: string;
  options: Option[];
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
};

export function RadioGroupField({
  name,
  label,
  options,
  value,
  onChange,
  error,
}: RadioGroupFieldProps) {
  const errorId = `${name}-error`;
  return (
    <fieldset
      className="ui-radio-group"
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
    >
      <legend>{label}</legend>
      <div className="ui-radio-group__options">
        {options.map((option) => (
          <label key={option.value} className="ui-radio">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={onChange}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className="ui-field__error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
