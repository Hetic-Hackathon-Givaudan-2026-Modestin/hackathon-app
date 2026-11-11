import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initialRegistration, validateRegistration } from '../src/lib/registration.ts';

const valid = {
  ...initialRegistration,
  fullName: 'Camille Exemple',
  email: ' camille@example.fr ',
  company: 'Exemple',
  sector: 'flavors',
  role: 'rd',
  password: 'mot-de-passe',
};

test('validation du formulaire sans conditions disponibles', () => {
  assert.deepEqual(validateRegistration(valid), {});
});

test('validation des champs et des valeurs proposées', () => {
  const errors = validateRegistration({
    ...valid,
    email: 'invalide',
    sector: 'inconnu',
    role: 'inconnu',
    password: 'court',
  });
  assert.ok(errors.email);
  assert.ok(errors.sector);
  assert.ok(errors.role);
  assert.ok(errors.password);
});
