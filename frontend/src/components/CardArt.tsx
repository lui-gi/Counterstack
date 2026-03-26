interface CardArtProps {
  suit: string;
  rank: number;
  color: string;
}

export function CardArt({ suit, rank, color }: CardArtProps) {
  const opacity = 0.15 + (rank / 13) * 0.25;

  if (suit === 'clover') {
    return (
      <svg width="80" height="100" viewBox="0 0 80 100" style={{ position: 'absolute', opacity }}>
        <circle cx="40" cy="35" r={8 + rank} fill={color} />
        <circle cx="20" cy="55" r={6 + rank * 0.7} fill={color} />
        <circle cx="60" cy="55" r={6 + rank * 0.7} fill={color} />
        <rect x="35" y="55" width="10" height="25" fill={color} />
        {rank >= 10 && <circle cx="40" cy="20" r="4" fill={color} opacity="0.5" />}
      </svg>
    );
  }

  if (suit === 'spade') {
    return (
      <svg width="80" height="100" viewBox="0 0 80 100" style={{ position: 'absolute', opacity }}>
        <path d={`M40 15 L${15 + rank * 0.5} 55 Q40 45 ${65 - rank * 0.5} 55 Z`} fill={color} />
        <ellipse cx="40" cy="55" rx={8 + rank * 0.3} ry={5 + rank * 0.2} fill={color} />
        <rect x="35" y="60" width="10" height="20" fill={color} />
        {rank >= 11 && <line x1="20" y1="80" x2="60" y2="80" stroke={color} strokeWidth="2" />}
      </svg>
    );
  }

  if (suit === 'diamond') {
    const size = 20 + rank * 2;
    return (
      <svg width="80" height="100" viewBox="0 0 80 100" style={{ position: 'absolute', opacity }}>
        <polygon
          points={`40,${50 - size} ${40 + size * 0.6},50 40,${50 + size} ${40 - size * 0.6},50`}
          fill={color}
        />
        {rank >= 8 && (
          <polygon
            points={`40,${50 - size * 0.5} ${40 + size * 0.3},50 40,${50 + size * 0.5} ${40 - size * 0.3},50`}
            fill="rgba(0,0,0,0.3)"
          />
        )}
      </svg>
    );
  }

  // heart
  const s = 15 + rank;
  return (
    <svg width="80" height="100" viewBox="0 0 80 100" style={{ position: 'absolute', opacity }}>
      <path
        d={`M40 70 C20 55 ${40 - s} 35 40 ${55 - s} C40 ${55 - s} ${40 + s} 35 60 55 Z`}
        fill={color}
      />
      {rank >= 9 && (
        <path
          d={`M40 65 C25 55 ${40 - s * 0.6} 45 40 ${55 - s * 0.6}`}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
      )}
    </svg>
  );
}
