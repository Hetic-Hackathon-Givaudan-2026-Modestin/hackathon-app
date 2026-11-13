import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  initialProject,
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
  productType: "parfum d'intérieur",
  budgetPerKg: '5',
  annualVolumeKg: '100',
  positioning: 'premium',
  workedWithGivaudan: 'no',
  projectStage: 'testing',
  launchTiming: '6-12-months',
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
      'role',
      'workedWithGivaudan',
    ],
  );
});

test('les valeurs hors liste et les emails invalides sont refusés', () => {
  const errors = validateGeneral({
    ...valid,
    role: 'inconnu',
    email: 'pas-un-email',
    workedWithGivaudan: 'peut-être',
  });
  assert.deepEqual(Object.keys(errors).sort(), [
    'email',
    'role',
    'workedWithGivaudan',
  ]);
});

test('valide une question à la fois et accepte budget ou volume inconnus', () => {
  assert.deepEqual(validateStep('product', valid), {});
  assert.deepEqual(validateStep('budget', { ...valid, budgetPerKg: '' }), {});
  assert.deepEqual(validateStep('volume', { ...valid, annualVolumeKg: '' }), {});
  assert.ok(validateStep('budget', { ...valid, budgetPerKg: '-5' }).budgetPerKg);
  assert.ok(validateStep('volume', { ...valid, annualVolumeKg: '0' }).annualVolumeKg);
  assert.ok(validateStep('stage', { ...valid, projectStage: '' }).projectStage);
  assert.ok(validateStep('positioning', { ...valid, positioning: '' }).positioning);
});

test('validateStep choisit la validation de l’étape', () => {
  assert.deepEqual(validateStep('general', valid), {});
  assert.ok(validateStep('product', initialProject).productType);
});

test('GivBot adapte son humeur et son message au parcours', () => {
  assert.equal(getBotSpeech('form', 'general', initialProject, false).mood, 'greeting');
  assert.equal(getBotSpeech('form', 'general', valid, false).mood, 'listening');
  assert.match(
    getBotSpeech('form', 'general', { ...valid, workedWithGivaudan: 'yes' }, false).message,
    /retrouver/,
  );
  assert.equal(getBotSpeech('submitting', 'positioning', valid, false).mood, 'thinking');
  const done = getBotSpeech('done', 'positioning', valid, false, 'accepted');
  assert.equal(done.mood, 'happy');
  assert.match(done.message, /Camille/);
  assert.match(done.message, /accepté/);
  assert.match(getBotSpeech('done', 'positioning', valid, false, 'rejected').message, /critères/);
  assert.match(getBotSpeech('done', 'positioning', valid, false, 'pending').message, /pas pu/);
});
