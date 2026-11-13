import type { GivBotMood } from '../components/GivBot';
import type { ProjectStep, ProjectValues } from './project';
import type { ProjectStatus } from './projectApi';

export type FlowState = 'form' | 'submitting' | 'done' | 'loading' | 'restore-error';

export type BotSpeech = { mood: GivBotMood; message: string };

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? '';
}

export function getBotSpeech(
  state: FlowState,
  step: ProjectStep,
  values: ProjectValues,
  hasErrors: boolean,
  status?: ProjectStatus,
): BotSpeech {
  const name = firstName(values.fullName);

  if (state === 'submitting' || state === 'loading')
    return {
      mood: 'thinking',
      message:
        'Merci pour votre confiance. Je consulte votre projet avec attention…',
    };

  if (state === 'restore-error')
    return {
      mood: 'listening',
      message: 'Je ne parviens pas à retrouver votre projet pour le moment.',
    };

  if (state === 'done' && status === 'accepted')
    return {
      mood: 'happy',
      message: `Merci${name ? ` ${name}` : ''} ! Votre projet a été accepté pour cette démonstration.`,
    };

  if (state === 'done')
    return {
      mood: 'listening',
      message: status === 'rejected'
        ? 'Merci pour votre projet. Il ne répond pas aux critères de cette démonstration.'
        : 'Merci pour votre projet. Son évaluation n’a pas pu être terminée.',
    };

  if (hasErrors)
    return {
      mood: 'listening',
      message:
        'Pardonnez-moi, il manque quelques informations. Je vous les ai signalées, rien de grave.',
    };

  if (step !== 'general')
    return {
      mood: 'listening',
      message:
        'Je vais vous poser quelques questions, une par une, pour mieux comprendre votre projet.',
    };

  if (values.workedWithGivaudan === 'yes')
    return {
      mood: 'listening',
      message:
        'Quel plaisir de vous retrouver ! Merci de votre fidélité à Givaudan.',
    };

  if (values.workedWithGivaudan === 'no')
    return {
      mood: 'listening',
      message:
        'Bienvenue ! Ce sera un plaisir de faire connaissance avec votre projet.',
    };

  if (name)
    return {
      mood: 'listening',
      message: `Enchanté, ${name} ! Je vous écoute, prenez votre temps.`,
    };

  return {
    mood: 'greeting',
    message:
      'Bonjour et bienvenue chez Givaudan ! Je suis GivBot. Définissons ensemble votre projet, si vous le voulez bien.',
  };
}
