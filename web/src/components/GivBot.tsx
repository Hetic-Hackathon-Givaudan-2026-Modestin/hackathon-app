import './GivBot.css';

export function GivBot() {
  return (
    <svg
      className="givbot"
      viewBox="0 0 200 240"
      role="img"
      aria-label="GivBot, l'assistant Givaudan, vous salue"
    >
      <line
        x1="100"
        y1="20"
        x2="100"
        y2="40"
        stroke="#8a1538"
        strokeWidth="4"
      />
      <circle cx="100" cy="16" r="8" fill="#e8a33d" />
      <rect
        x="50"
        y="40"
        width="100"
        height="80"
        rx="28"
        fill="#fff"
        stroke="#8a1538"
        strokeWidth="4"
      />
      <circle cx="80" cy="80" r="9" fill="#2b2226" />
      <circle cx="120" cy="80" r="9" fill="#2b2226" />
      <path
        d="M82 102 Q100 114 118 102"
        fill="none"
        stroke="#8a1538"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <rect x="62" y="128" width="76" height="80" rx="24" fill="#8a1538" />
      <rect
        x="40"
        y="136"
        width="18"
        height="52"
        rx="9"
        fill="#fff"
        stroke="#8a1538"
        strokeWidth="4"
      />
      <g className="givbot__arm">
        <rect
          x="142"
          y="136"
          width="18"
          height="52"
          rx="9"
          fill="#fff"
          stroke="#8a1538"
          strokeWidth="4"
        />
      </g>
    </svg>
  );
}
