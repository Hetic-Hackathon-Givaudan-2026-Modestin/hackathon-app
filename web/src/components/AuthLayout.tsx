import type { ReactNode } from 'react';
import { GivBot } from './GivBot';
import './AuthLayout.css';

type AuthLayoutProps = {
  title: string;
  bubble: string;
  children: ReactNode;
};

// Deux colonnes : GivBot et son message à gauche, formulaire à droite.
export function AuthLayout({ title, bubble, children }: AuthLayoutProps) {
  return (
    <div className="auth">
      <aside className="auth__hero">
        <p className="auth__brand">Givaudan</p>
        <h1>{title}</h1>
        <p className="auth__bubble">{bubble}</p>
        <GivBot />
        <p className="auth__footer">
          Accès rapide · Estimation de potentiel par IA · Échantillonnage
          sur-mesure
        </p>
      </aside>
      <main className="auth__card">{children}</main>
    </div>
  );
}
