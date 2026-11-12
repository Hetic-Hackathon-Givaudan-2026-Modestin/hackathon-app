import type { TextareaHTMLAttributes } from 'react';
import { FieldShell, fieldA11y, type FieldProps } from './FieldShell';

type TextareaFieldProps = FieldProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'>;

export function TextareaField({
  id,
  label,
  error,
  ...textareaProps
}: TextareaFieldProps) {
  return (
    <FieldShell id={id} label={label} error={error}>
      <div className="ui-input">
        <textarea {...textareaProps} {...fieldA11y(id, error)} />
      </div>
    </FieldShell>
  );
}
