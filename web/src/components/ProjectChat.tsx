import { useEffect, useRef, useState, type FormEvent } from 'react';
import { GivBot } from './GivBot';
import { Button } from './ui/Button';
import { TextareaField } from './ui/TextareaField';
import type { ProjectAccess } from '../lib/projectApi';
import { loadChat, sendChatMessage, type ChatData, type ChatMessage } from '../lib/chat';
import {
  launchTimingOptions,
  marketOptions,
  positioningOptions,
  projectStageOptions,
  salesZoneOptions,
} from '../lib/project';
import './ProjectChat.css';

type Props = { access: ProjectAccess; onBack: () => void };

function label(options: { value: string; label: string }[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function ProjectChat({ access, onBack }: Props) {
  const [data, setData] = useState<ChatData>();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [version, setVersion] = useState(0);
  const inFlight = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    loadChat(access, controller.signal).then(
      (result) => { setData(result); setLoading(false); },
      () => {
        if (!controller.signal.aborted) {
          setError('Impossible de charger la conversation. Vérifiez votre connexion.');
          setLoading(false);
        }
      },
    );
    return () => controller.abort();
  }, [access.id, access.accessToken, version]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const question = message.trim();
    if (!question || question.length > 4000 || inFlight.current) return;
    inFlight.current = true;
    setSending(true);
    setError('');
    try {
      const answer = await sendChatMessage(access, question);
      const turn: ChatMessage[] = [
        { role: 'user', content: question },
        { role: 'assistant', content: answer },
      ];
      setData((current) => current && { ...current, messages: [...current.messages, ...turn] });
      setMessage('');
    } catch {
      setError("La réponse n'a pas été reçue. Actualisez la conversation avant de renvoyer votre message, pour éviter un doublon.");
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }

  return (
    <main className="studio">
      <header className="studio__header">
        <div><p className="studio__brand">Givaudan · Flavour Studio</p><h1>Votre espace de création</h1></div>
        <Button type="button" variant="ghost" onClick={onBack} disabled={sending}>Retour au projet</Button>
      </header>
      <p className="studio__notice">Prototype de démonstration : les références et données documentaires sont fictives.</p>
      {loading && <p role="status">Chargement de votre projet…</p>}
      {error && <p role="alert" className="studio__error">{error}</p>}
      {!data && !loading && <Button onClick={() => setVersion((value) => value + 1)}>Réessayer</Button>}
      {data && (
        <div className="studio__grid">
          <section className="studio__panel studio__chat" aria-labelledby="chat-title">
            <h2 id="chat-title">01 · Brief avec GivBot</h2>
            <div className="studio__messages" aria-live="polite">
              <p className="studio__bubble">Bonjour ! Je suis GivBot. Parlons ensemble de votre projet.</p>
              {data.messages.map((item, index) => (
                <p key={index} className={`studio__bubble studio__bubble--${item.role}`}>{item.content}</p>
              ))}
              {sending && <p className="studio__bubble" role="status">GivBot réfléchit…</p>}
            </div>
            <form onSubmit={submit} className="studio__form">
              <TextareaField id="chat-message" label="Votre message" value={message} maxLength={4000}
                onChange={(event) => setMessage(event.target.value)} disabled={sending} rows={3} />
              <div className="studio__actions">
                <Button type="button" variant="ghost" onClick={() => setVersion((value) => value + 1)} disabled={sending}>Actualiser</Button>
                <Button type="submit" disabled={sending || !message.trim()}>Envoyer</Button>
              </div>
            </form>
          </section>
          <section className="studio__panel studio__canvas" aria-labelledby="canvas-title">
            <h2 id="canvas-title">02 · Univers sensoriel</h2>
            <div className="studio__visual"><div className="studio__orb" /></div>
            <p>Aperçu visuel uniquement. Les réglages sensoriels seront définis dans une prochaine version.</p>
            <GivBot mood={sending ? 'thinking' : 'listening'} />
          </section>
          <section className="studio__panel" aria-labelledby="brief-title">
            <h2 id="brief-title">03 · Votre brief</h2>
            <dl className="studio__brief">
              <div><dt>Produit</dt><dd>{data.project.productType}</dd></div>
              <div><dt>Secteur</dt><dd>{label(marketOptions, data.project.market)}</dd></div>
              <div><dt>Budget / kg d’arôme</dt><dd>{data.project.budgetPerKg === null ? 'Non défini' : `${data.project.budgetPerKg} €/kg`}</dd></div>
              <div><dt>Volume annuel d’arôme</dt><dd>{data.project.annualVolumeKg === null ? 'Non défini' : `${data.project.annualVolumeKg} kg/an`}</dd></div>
              <div><dt>Zone de vente</dt><dd>{label(salesZoneOptions, data.project.salesZone)}</dd></div>
              <div><dt>Avancement</dt><dd>{label(projectStageOptions, data.project.projectStage)}</dd></div>
              <div><dt>Lancement souhaité</dt><dd>{label(launchTimingOptions, data.project.launchTiming)}</dd></div>
              <div><dt>Positionnement</dt><dd>{label(positioningOptions, data.project.positioning)}</dd></div>
            </dl>
            <h3>Votre projet</h3>
            <p className="studio__description">{data.project.description}</p>
            <p>Les recommandations, la fiche technique et la commande ne sont pas encore disponibles.</p>
          </section>
        </div>
      )}
    </main>
  );
}
