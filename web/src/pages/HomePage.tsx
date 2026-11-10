import { useEffect, useState, type FormEvent } from 'react';

type Question = {
  id: number;
  question: string;
  answer: string;
};

type Health = {
  status: string;
  db: string;
};

export function HomePage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [question, setQuestion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadQuestions() {
    const response = await fetch('/api/questions');
    if (!response.ok) {
      throw new Error('Impossible de charger les questions.');
    }

    setQuestions(await response.json());
  }

  useEffect(() => {
    async function loadApplication() {
      try {
        const response = await fetch('/api/health');
        if (!response.ok) {
          throw new Error('Impossible de joindre l’API.');
        }

        setHealth(await response.json());
        await loadQuestions();
      } catch (reason) {
        setError(
          reason instanceof Error ? reason.message : 'Une erreur est survenue.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadApplication();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmedQuestion }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? 'Impossible d’envoyer la question.');
      }

      setQuestion('');
      await loadQuestions();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Une erreur est survenue.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="demo">
      <header>
        <h1>Hackathon</h1>
        <p aria-live="polite">
          {health ? `API OK · ${health.db}` : 'Connexion à l’API…'}
        </p>
      </header>

      <section aria-labelledby="question-title">
        <h2 id="question-title">Poser une question</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="question">Votre question</label>
          <div className="question-form">
            <input
              id="question"
              name="question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Posez une question à l’IA"
              required
            />
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
        </form>
      </section>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <section aria-labelledby="history-title">
        <h2 id="history-title">Dernières questions</h2>
        {isLoading ? (
          <p>Chargement…</p>
        ) : questions.length === 0 ? (
          <p>Aucune question pour le moment.</p>
        ) : (
          <ul className="questions">
            {questions.map((item) => (
              <li key={item.id}>
                <strong>{item.question}</strong>
                <p>{item.answer}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
