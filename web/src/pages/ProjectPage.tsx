import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ProjectLayout } from '../components/ProjectLayout';
import { Button } from '../components/ui/Button';
import { RadioGroupField } from '../components/ui/RadioGroupField';
import { SelectField } from '../components/ui/SelectField';
import { Stepper } from '../components/ui/Stepper';
import { TextField } from '../components/ui/TextField';
import { TextareaField } from '../components/ui/TextareaField';
import { useFormValues } from '../hooks/useFormValues';
import { getBotSpeech, type FlowState } from '../lib/givbotSpeech';
import {
  MAX_DESCRIPTION_LENGTH,
  initialProject,
  marketOptions,
  positioningOptions,
  quantityOptions,
  roleOptions,
  salesZoneOptions,
  validateStep,
  workedWithOptions,
  type ProjectStep,
} from '../lib/project';

const steps: ProjectStep[] = ['general', 'description'];
const stepLabels = ['Votre projet', 'Description'];

// Durée cosmétique de l'animation « GivBot réfléchit », avant l'évaluation réelle par l'API.
const THINKING_MS = 1800;

export function ProjectPage() {
  const { values, onChange, reset } = useFormValues(initialProject);
  const [stepIndex, setStepIndex] = useState(0);
  const [flow, setFlow] = useState<FlowState>('form');
  const [attempted, setAttempted] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const step = steps[stepIndex];

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const errors = attempted ? validateStep(step, values) : {};
  const hasErrors = Object.keys(errors).length > 0;
  const speech = getBotSpeech(flow, step, values, hasErrors);

  function goTo(index: number) {
    setStepIndex(index);
    setAttempted(false);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (Object.keys(validateStep(step, values)).length > 0) {
      setAttempted(true);
      return;
    }
    if (stepIndex < steps.length - 1) {
      goTo(stepIndex + 1);
      return;
    }
    setFlow('submitting');
    timer.current = window.setTimeout(() => setFlow('done'), THINKING_MS);
  }

  function restart() {
    reset();
    goTo(0);
    setFlow('form');
  }

  const title =
    flow === 'done' ? 'Merci pour votre projet' : 'Définissons votre projet';

  return (
    <ProjectLayout title={title} bubble={speech.message} mood={speech.mood}>
      {flow === 'form' && (
        <>
          <Stepper steps={stepLabels} current={stepIndex} />
          <form onSubmit={onSubmit} noValidate>
            {step === 'general' ? (
              <>
                <h2>Parlez-nous de vous et de votre projet</h2>
                <div className="project__grid">
                  <TextField
                    id="fullName"
                    name="fullName"
                    label="Prénom et nom"
                    autoComplete="name"
                    value={values.fullName}
                    onChange={onChange}
                    error={errors.fullName}
                  />
                  <TextField
                    id="company"
                    name="company"
                    label="Entreprise"
                    autoComplete="organization"
                    value={values.company}
                    onChange={onChange}
                    error={errors.company}
                  />
                  <SelectField
                    id="role"
                    name="role"
                    label="Rôle"
                    placeholder="Choisissez"
                    options={roleOptions}
                    value={values.role}
                    onChange={onChange}
                    error={errors.role}
                  />
                  <TextField
                    id="email"
                    name="email"
                    type="email"
                    label="Email professionnel"
                    autoComplete="email"
                    value={values.email}
                    onChange={onChange}
                    error={errors.email}
                  />
                  <SelectField
                    id="salesZone"
                    name="salesZone"
                    label="Où souhaitez-vous vendre ?"
                    placeholder="Choisissez"
                    options={salesZoneOptions}
                    value={values.salesZone}
                    onChange={onChange}
                    error={errors.salesZone}
                  />
                  <SelectField
                    id="market"
                    name="market"
                    label="Marché visé"
                    placeholder="Choisissez"
                    options={marketOptions}
                    value={values.market}
                    onChange={onChange}
                    error={errors.market}
                  />
                  <SelectField
                    id="quantity"
                    name="quantity"
                    label="Quantité envisagée"
                    placeholder="Choisissez"
                    options={quantityOptions}
                    value={values.quantity}
                    onChange={onChange}
                    error={errors.quantity}
                  />
                  <SelectField
                    id="positioning"
                    name="positioning"
                    label="Positionnement"
                    placeholder="Choisissez"
                    options={positioningOptions}
                    value={values.positioning}
                    onChange={onChange}
                    error={errors.positioning}
                  />
                </div>
                <RadioGroupField
                  name="workedWithGivaudan"
                  label="Avez-vous déjà travaillé avec Givaudan ?"
                  options={workedWithOptions}
                  value={values.workedWithGivaudan}
                  onChange={onChange}
                  error={errors.workedWithGivaudan}
                />
                <div className="project__actions">
                  <Button type="submit">Continuer</Button>
                </div>
              </>
            ) : (
              <>
                <h2>Décrivez votre projet</h2>
                <TextareaField
                  id="description"
                  name="description"
                  label="Description du projet"
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  value={values.description}
                  onChange={onChange}
                  error={errors.description}
                />
                <p className="project__counter">
                  {values.description.length} / {MAX_DESCRIPTION_LENGTH}
                </p>
                <div className="project__actions">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => goTo(stepIndex - 1)}
                  >
                    Retour
                  </Button>
                  <Button type="submit">Envoyer mon projet</Button>
                </div>
              </>
            )}
          </form>
        </>
      )}
      {flow === 'submitting' && (
        <p className="project__muted" role="status">
          Analyse de votre projet en cours…
        </p>
      )}
      {flow === 'done' && (
        <>
          <h2>Projet en cours d’évaluation</h2>
          <p className="project__muted">
            Merci. Votre projet est en cours d’évaluation par Givaudan.
          </p>
          <div className="project__actions">
            <Button variant="ghost" onClick={restart}>
              Déposer un autre projet
            </Button>
          </div>
        </>
      )}
    </ProjectLayout>
  );
}
