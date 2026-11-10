import { useState, type ChangeEvent } from 'react';

// Gère les valeurs d'un formulaire à champs texte, select et case à cocher.
export function useFormValues<T extends Record<string, string | boolean>>(
  initial: T,
) {
  const [values, setValues] = useState<T>(initial);

  function onChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, type, value, checked } = event.target as HTMLInputElement;
    setValues((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  return { values, onChange };
}
