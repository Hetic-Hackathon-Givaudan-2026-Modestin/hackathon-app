import type { GivBotMood } from '../components/GivBot';
import type { ProjectStep, ProjectValues } from './project';

export type FlowState = 'form' | 'submitting' | 'done';

export type BotSpeech = { mood: GivBotMood; message: string };

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? '';
}

export function getBotSpeech(
  state: FlowState,
  step: ProjectStep,
  values: ProjectValues,
  hasErrors: boolean,
): BotSpeech {
  const name = firstName(values.fullName);

  if (state === 'submitting')
    return {
      mood: 'thinking',
      message:
        'Merci pour votre confiance. J’étudie votre projet avec attention…',
    };

  if (state === 'done')
    return {
      mood: 'happy',
      message: `Merci${name ? ` ${name}` : ''} ! Votre projet est en cours d’évaluation. Ce fut un plaisir.`,
    };

  if (hasErrors)
    return {
      mood: 'listening',
      message:
        'Pardonnez-moi, il manque quelques informations. Je vous les ai signalées, rien de grave.',
    };

  if (step === 'description')
    return {
      mood: 'listening',
      message:
        'Dernière étape : racontez-moi votre projet avec vos mots, l’idée, le public visé, l’univers recherché.',
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
