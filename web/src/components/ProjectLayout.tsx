import type { ReactNode } from 'react';
import { GivBot, type GivBotMood } from './GivBot';
import './ProjectLayout.css';

type ProjectLayoutProps = {
  title: string;
  bubble: string;
  mood: GivBotMood;
  children: ReactNode;
};

// Deux colonnes : GivBot et son message à gauche, contenu de l'étape à droite.
export function ProjectLayout({
  title,
  bubble,
  mood,
  children,
}: ProjectLayoutProps) {
  return (
    <div className="project">
      <aside className="project__hero">
        <p className="project__brand">Givaudan</p>
        <h1>{title}</h1>
        <p className="project__bubble" role="status" aria-live="polite">
          {bubble}
        </p>
        <GivBot mood={mood} />
        <p className="project__footer">
          Évaluation de projet · Création sur mesure · Parfumerie et arômes
        </p>
      </aside>
      <main className="project__card">{children}</main>
    </div>
  );
}
