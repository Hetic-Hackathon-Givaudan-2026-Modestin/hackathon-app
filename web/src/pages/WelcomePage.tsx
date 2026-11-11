import { Link } from 'react-router-dom';
import { GivBot } from '../components/GivBot';
import { useSession } from '../components/SessionProvider';
import './WelcomePage.css';

export function WelcomePage() {
  const { user } = useSession();
  return (
    <main className="welcome">
      <header className="welcome__header">
        <strong>Givaudan</strong>
        <Link to="/profil">Mon profil</Link>
      </header>
      <section className="welcome__hero">
        <div>
          <p>Bienvenue, {user?.fullName}</p>
          <h1>Créons ensemble vos prochains arômes et parfums</h1>
          <p>GivBot vous accompagnera dans la création de votre commande et de vos échantillons.</p>
          <button type="button" className="welcome__disabled" disabled>Commander · bientôt disponible</button>
          <p>La commande sera disponible lorsque l’intégration avec l’équipe data sera prête.</p>
        </div>
        <GivBot />
      </section>
    </main>
  );
}
