interface JokerCardSVGProps {
  threatPct: number | null;
  flipped: boolean;
  onClick: () => void;
}

export function JokerCardSVG({ threatPct, flipped, onClick }: JokerCardSVGProps) {
  const threat = threatPct ?? 50;
  const isHighThreat = threat > 80;
  const color =
    threat > 80 ? '#f72585'
    : threat > 60 ? '#ff9f1c'
    : threat > 40 ? '#ffd700'
    : '#a78bfa';

  return (
    <div
      onClick={onClick}
      style={{
        width: 80,
        height: 110,
        background: 'rgba(13,17,23,0.95)',
        border: `1px solid ${color}44`,
        borderRadius: 8,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `0 0 20px ${color}33`,
        animation: isHighThreat ? 'glitch 0.3s infinite' : undefined,
        transition: 'transform 0.2s, box-shadow 0.2s',
        transform: flipped ? 'scale(1.05)' : undefined,
      }}
    >
      <svg width="64" height="90" viewBox="0 0 64 90">
        {/* Joker face */}
        <circle cx="32" cy="30" r="16" fill="none" stroke={color} strokeWidth="1.5" opacity="0.8" />
        <text x="32" y="36" textAnchor="middle" fill={color} fontSize="20" fontFamily="serif">
          🃏
        </text>
        {/* Diamond pattern */}
        <polygon
          points="32,55 42,65 32,75 22,65"
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity="0.5"
        />
        {/* Stars */}
        {[0, 1, 2].map(i => (
          <text
            key={i}
            x={16 + i * 16}
            y="85"
            textAnchor="middle"
            fill={color}
            fontSize="8"
            opacity="0.6"
          >
            ✦
          </text>
        ))}
      </svg>
      {/* Threat level fill indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${threat}%`,
          background: `${color}15`,
          transition: 'height 0.5s',
        }}
      />
    </div>
  );
}
