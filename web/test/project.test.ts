import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  initialProject,
  validateDescription,
  validateGeneral,
  validateStep,
} from '../src/lib/project.ts';
import { getBotSpeech } from '../src/lib/givbotSpeech.ts';

const valid = {
  ...initialProject,
  fullName: 'Camille Exemple',
  company: 'Exemple SA',
  role: 'marketing',
  email: ' camille@exemple.fr ',
  salesZone: 'europe',
  market: 'perfume',
  quantity: 'small',
  positioning: 'premium',
  workedWithGivaudan: 'no',
  description: 'Un parfum d’intérieur inspiré des jardins méditerranéens.',
};

test('les informations générales valides passent', () => {
  assert.deepEqual(validateGeneral(valid), {});
});

test('un formulaire vide signale chaque champ obligatoire', () => {
  assert.deepEqual(
    Object.keys(validateGeneral(initialProject)).sort(),
    [
      'company',
      'email',
      'fullName',
      'market',
      'positioning',
      'quantity',
      'role',
      'salesZone',
      'workedWithGivaudan',
    ],
  );
});

test('les valeurs hors liste et les emails invalides sont refusés', () => {
  const errors = validateGeneral({
    ...valid,
    market: 'inconnu',
    email: 'pas-un-email',
    workedWithGivaudan: 'peut-être',
  });
  assert.deepEqual(Object.keys(errors).sort(), [
    'email',
    'market',
    'workedWithGivaudan',
  ]);
});

test('la description a une longueur minimale et maximale', () => {
  assert.deepEqual(validateDescription(valid), {});
  assert.ok(validateDescription({ ...valid, description: '  court ' }).description);
  assert.ok(
    validateDescription({ ...valid, description: 'a'.repeat(4001) })
      .description,
  );
});

test('validateStep choisit la validation de l’étape', () => {
  assert.deepEqual(validateStep('general', valid), {});
  assert.ok(validateStep('description', initialProject).description);
});

test('GivBot adapte son humeur et son message au parcours', () => {
  assert.equal(getBotSpeech('form', 'general', initialProject, false).mood, 'greeting');
  assert.equal(getBotSpeech('form', 'general', valid, false).mood, 'listening');
  assert.match(
    getBotSpeech('form', 'general', { ...valid, workedWithGivaudan: 'yes' }, false).message,
    /retrouver/,
  );
  assert.equal(getBotSpeech('submitting', 'description', valid, false).mood, 'thinking');
  const done = getBotSpeech('done', 'description', valid, false, 'accepted');
  assert.equal(done.mood, 'happy');
  assert.match(done.message, /Camille/);
  assert.match(done.message, /accepté/);
  assert.match(getBotSpeech('done', 'description', valid, false, 'rejected').message, /critères/);
  assert.match(getBotSpeech('done', 'description', valid, false, 'pending').message, /pas pu/);
});
