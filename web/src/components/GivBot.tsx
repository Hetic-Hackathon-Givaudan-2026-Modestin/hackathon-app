import './GivBot.css';

export type GivBotMood = 'greeting' | 'listening' | 'thinking' | 'happy';

const labels: Record<GivBotMood, string> = {
  greeting: "GivBot, l'assistant Givaudan, vous salue",
  listening: 'GivBot vous écoute attentivement',
  thinking: 'GivBot analyse votre projet',
  happy: 'GivBot vous remercie',
};

type GivBotProps = {
  mood?: GivBotMood;
};

const stroke = { stroke: '#8a1538', strokeWidth: 4 } as const;

export function GivBot({ mood = 'greeting' }: GivBotProps) {
  const happy = mood === 'happy';
  return (
    <svg
      className={`givbot givbot--${mood}`}
      viewBox="0 0 200 240"
      role="img"
      aria-label={labels[mood]}
    >
      <ellipse className="givbot__shadow" cx="100" cy="226" rx="46" ry="7" />
      <g className="givbot__body">
        <g className="givbot__head">
          <line x1="100" y1="20" x2="100" y2="40" {...stroke} />
          <circle className="givbot__antenna" cx="100" cy="16" r="8" />
          <rect
            x="50"
            y="40"
            width="100"
            height="80"
            rx="28"
            fill="#fff"
            {...stroke}
          />
          <g className="givbot__eyes">
            {happy ? (
              <>
                <path
                  d="M70 84 Q80 70 90 84"
                  fill="none"
                  strokeLinecap="round"
                  {...stroke}
                />
                <path
                  d="M110 84 Q120 70 130 84"
                  fill="none"
                  strokeLinecap="round"
                  {...stroke}
                />
              </>
            ) : (
              <>
                <circle className="givbot__eye" cx="80" cy="80" r="9" />
                <circle className="givbot__eye" cx="120" cy="80" r="9" />
              </>
            )}
          </g>
          <circle className="givbot__cheek" cx="66" cy="98" r="6" />
          <circle className="givbot__cheek" cx="134" cy="98" r="6" />
          {mood === 'thinking' ? (
            <line
              x1="90"
              y1="106"
              x2="110"
              y2="106"
              strokeLinecap="round"
              {...stroke}
            />
          ) : (
            <path
              d={
                happy
                  ? 'M78 98 Q100 126 122 98 Z'
                  : 'M82 102 Q100 114 118 102'
              }
              fill={happy ? '#8a1538' : 'none'}
              strokeLinecap="round"
              strokeLinejoin="round"
              {...stroke}
            />
          )}
        </g>
        <rect x="62" y="128" width="76" height="80" rx="24" fill="#8a1538" />
        <path
          className="givbot__bowtie"
          d="M100 138 L80 128 L80 148 Z M100 138 L120 128 L120 148 Z"
        />
        <circle cx="100" cy="138" r="5" fill="#e8a33d" />
        <g className="givbot__arm givbot__arm--left">
          <rect
            x="40"
            y="136"
            width="18"
            height="52"
            rx="9"
            fill="#fff"
            {...stroke}
          />
        </g>
        <g className="givbot__arm givbot__arm--right">
          <rect
            x="142"
            y="136"
            width="18"
            height="52"
            rx="9"
            fill="#fff"
            {...stroke}
          />
        </g>
      </g>
      {mood === 'thinking' && (
        <g className="givbot__dots" fill="#8a1538">
          <circle cx="160" cy="46" r="4" />
          <circle cx="174" cy="36" r="4" />
          <circle cx="188" cy="26" r="4" />
        </g>
      )}
    </svg>
  );
}
