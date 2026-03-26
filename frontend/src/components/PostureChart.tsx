import { HISTORY, SUITS } from '../data/gameData';

interface PostureChartProps {
  allRanks: Record<string, number>;
}

export function PostureChart({ allRanks }: PostureChartProps) {
  const width = 260;
  const height = 60;
  const padding = 8;

  function rankToY(rank: number): number {
    return height - padding - ((rank - 1) / 12) * (height - padding * 2);
  }

  function buildPath(history: number[], currentRank: number): string {
    const points = [...history, currentRank];
    const step = (width - padding * 2) / (points.length - 1);
    return points
      .map((r, i) => `${i === 0 ? 'M' : 'L'}${padding + i * step},${rankToY(r)}`)
      .join(' ');
  }

  return (
    <div>
      <div
        style={{
          fontSize: 9,
          color: 'rgba(205,217,229,0.5)',
          letterSpacing: '0.1em',
          marginBottom: 4,
        }}
      >
        POSTURE HISTORY
      </div>
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        {Object.entries(SUITS).map(([key, cfg]) => (
          <path
            key={key}
            d={buildPath(HISTORY[key] ?? [], allRanks[key] ?? 7)}
            fill="none"
            stroke={cfg.color}
            strokeWidth="1.5"
            opacity="0.7"
          />
        ))}
        {/* Legend */}
        {Object.entries(SUITS).map(([key, cfg], i) => (
          <g key={key} transform={`translate(${i * 65}, ${height - 2})`}>
            <line x1="0" y1="0" x2="12" y2="0" stroke={cfg.color} strokeWidth="2" />
            <text
              x="15"
              y="4"
              fill={cfg.color}
              fontSize="7"
              fontFamily="'JetBrains Mono'"
            >
              {cfg.sym}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
