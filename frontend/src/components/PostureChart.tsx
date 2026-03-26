import { SUITS, HISTORY } from '../data/gameData';
import type { SuitConfig } from '../interfaces/SuitConfig.interface';
import type { PostureChartProps } from '../interfaces/PostureChartProps.interface';

export default function PostureChart({ ranks, history, showPostureLine = true }: PostureChartProps) {
  const W = 500, H = 96, pad = 8;

  // Build series from dynamic history or static fallback
  const series = (Object.entries(SUITS) as [string, SuitConfig][]).map(([k, cfg]) => {
    let pts: number[];

    if (history && history.length > 0) {
      pts = history.map(entry => entry.ranks[k]);
      if (pts.length === 1) pts = [pts[0], pts[0]];
    } else {
      pts = [...HISTORY[k].slice(0, 11), ranks[k]];
    }

    return { color: cfg.color, pts };
  });

  // Build posture score line (normalized 0-100 to 1-13 scale)
  let posturePts: number[] = [];
  if (history && history.length > 0 && showPostureLine) {
    posturePts = history.map(entry => 1 + (entry.postureScore / 100) * 12);
    if (posturePts.length === 1) posturePts = [posturePts[0], posturePts[0]];
  }

  const toD = (pts: number[]) => pts.map((v, i) => {
    const x = pad + (i / (pts.length - 1)) * (W - 2 * pad);
    const y = pad + ((13 - v) / 12) * (H - 2 * pad);
    return `${i === 0 ? "M" : "L"}${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H - 10 }} preserveAspectRatio="none">
      {[0.25, 0.5, 0.75].map(p => (
        <line key={p} x1={pad} y1={p * H} x2={W - pad} y2={p * H}
          stroke="rgba(0,212,255,.05)" strokeWidth="1" />
      ))}
      {series.map(({ color, pts }) => (
        <path key={color} d={toD(pts)} fill="none" stroke={color} strokeWidth="1.5"
          strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
      ))}
      {showPostureLine && posturePts.length > 1 && (
        <path d={toD(posturePts)} fill="none" stroke="#ffd700" strokeWidth="2"
          strokeLinejoin="round" strokeDasharray="4,2"
          style={{ filter: 'drop-shadow(0 0 4px #ffd700)' }} />
      )}
    </svg>
  );
}
