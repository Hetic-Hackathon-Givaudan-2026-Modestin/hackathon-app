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
  createProject,
  getProjectStatus,
  ProjectApiError,
  readProjectAccess,
  saveProjectAccess,
  type ProjectAccess,
  type ProjectStatus,
} from '../lib/projectApi';
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

export function ProjectPage() {
  const { values, onChange, reset } = useFormValues(initialProject);
  const [stepIndex, setStepIndex] = useState(0);
  const [flow, setFlow] = useState<FlowState>('loading');
  const [attempted, setAttempted] = useState(false);
  const [access, setAccess] = useState<ProjectAccess | null>(null);
  const [status, setStatus] = useState<ProjectStatus>();
  const [message, setMessage] = useState('');
  const [storageWarning, setStorageWarning] = useState('');
  const [restoreVersion, setRestoreVersion] = useState(0);
  const submitting = useRef(false);
  const step = steps[stepIndex];

  useEffect(() => {
    let saved: ProjectAccess | null;
    try {
      saved = readProjectAccess(window.localStorage);
    } catch {
      setStorageWarning('Impossible de lire l’accès enregistré dans ce navigateur.');
      setFlow('restore-error');
      return;
    }
    if (!saved) {
      setFlow('form');
      return;
    }
    setAccess(saved);
    setFlow('loading');
    const controller = new AbortController();
    getProjectStatus(saved, controller.signal).then(
      (result) => {
        setStatus(result);
        setFlow('done');
      },
      () => {
        if (!controller.signal.aborted) setFlow('restore-error');
      },
    );
    return () => controller.abort();
  }, [restoreVersion]);

  useEffect(() => {
    if (flow !== 'submitting') return;
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [flow]);

  const errors = attempted ? validateStep(step, values) : {};
  const hasErrors = Object.keys(errors).length > 0;
  const speech = getBotSpeech(flow, step, values, hasErrors, status);

  function goTo(index: number) {
    setStepIndex(index);
    setAttempted(false);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    if (Object.keys(validateStep(step, values)).length > 0) {
      setAttempted(true);
      return;
    }
    if (stepIndex < steps.length - 1) {
      goTo(stepIndex + 1);
      return;
    }
    if (Object.keys(validateStep('general', values)).length > 0) {
      setStepIndex(0);
      setAttempted(true);
      return;
    }
    submitting.current = true;
    setMessage('');
    setFlow('submitting');
    try {
      const created = await createProject(values);
      setAccess({ id: created.id, accessToken: created.accessToken });
      setStatus(created.status);
      try {
        saveProjectAccess(window.localStorage, created);
        setStorageWarning('');
      } catch {
        setStorageWarning(
          'L’accès au projet n’a pas pu être enregistré dans ce navigateur. Vous risquez de le perdre en quittant cette page.',
        );
      }
      setFlow('done');
    } catch (error) {
      setMessage(error instanceof ProjectApiError ? error.message : 'Une erreur inattendue est survenue.');
      setFlow('form');
    } finally {
      submitting.current = false;
    }
  }

  function restart() {
    reset();
    goTo(0);
    setMessage('');
    setFlow('form');
  }

  async function refreshStatus() {
    if (!access) {
      setRestoreVersion((value) => value + 1);
      return;
    }
    setFlow('loading');
    try {
      setStatus(await getProjectStatus(access));
      setFlow('done');
    } catch {
      setFlow('restore-error');
    }
  }

  function retrySavingAccess() {
    if (!access) return;
    try {
      saveProjectAccess(window.localStorage, access);
      setStorageWarning('');
    } catch {
      setStorageWarning('Impossible d’enregistrer l’accès. Vous risquez de le perdre en quittant cette page.');
    }
  }

  const title =
    flow === 'done' ? 'Merci pour votre projet' : 'Définissons votre projet';

  return (
    <ProjectLayout title={title} bubble={speech.message} mood={speech.mood}>
      {flow === 'form' && (
        <>
          <Stepper steps={stepLabels} current={stepIndex} />
          {message && <p className="ui-field__error" role="alert">{message}</p>}
          {storageWarning && <p className="ui-field__error" role="alert">{storageWarning}</p>}
          {access && <p className="project__muted">Un nouvel envoi remplacera l’accès au projet précédent dans ce navigateur.</p>}
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
      {(flow === 'submitting' || flow === 'loading') && (
        <p className="project__muted" role="status">
          {flow === 'submitting'
            ? 'Envoi et évaluation en cours. Cela peut prendre jusqu’à deux minutes ; veuillez garder cette page ouverte.'
            : 'Récupération de votre projet…'}
        </p>
      )}
      {flow === 'restore-error' && (
        <>
          <h2>Statut indisponible</h2>
          <p role="alert">
            {storageWarning || 'Impossible de retrouver votre projet. Vérifiez votre connexion puis réessayez.'}
          </p>
          <div className="project__actions">
            <Button type="button" onClick={refreshStatus}>
              Réessayer
            </Button>
            <Button type="button" variant="ghost" onClick={restart}>
              Nouveau projet
            </Button>
          </div>
        </>
      )}
      {flow === 'done' && (
        <>
          <h2>{status === 'accepted' ? 'Projet accepté' : status === 'rejected' ? 'Projet non retenu' : 'Projet en attente'}</h2>
          <p className="project__muted">
            {status === 'accepted'
              ? 'Votre projet a été accepté selon les critères provisoires de la démonstration. Le chat n’est pas encore disponible.'
              : status === 'rejected'
                ? 'Votre projet n’a pas été retenu selon les critères provisoires de la démonstration. La suite de ce parcours reste à définir.'
                : 'Votre projet a été enregistré, mais son évaluation n’a pas pu être terminée. Aucun réessai automatique n’est encore prévu.'}
          </p>
          {storageWarning && <p className="ui-field__error" role="alert">{storageWarning}</p>}
          <div className="project__actions">
            {storageWarning && <Button type="button" onClick={retrySavingAccess}>Enregistrer l’accès</Button>}
            <Button type="button" variant="ghost" onClick={refreshStatus}>Actualiser le statut</Button>
            <Button type="button" variant="ghost" onClick={restart}>
              Déposer un autre projet
            </Button>
          </div>
        </>
      )}
    </ProjectLayout>
  );
}
