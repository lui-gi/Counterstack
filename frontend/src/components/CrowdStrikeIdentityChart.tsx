import { useState, useEffect, useRef } from 'react';

type DetectionPoint = { t: number; count: number };

const WINDOW = 24;
const W = 100;
const H = 48;
const PAD_X = 2;
const PAD_Y = 4;

function buildHistory(): DetectionPoint[] {
  return Array.from({ length: WINDOW }, (_, i) => ({
    t: i,
    count: Math.floor(Math.random() * 5),
  }));
}

export default function CrowdStrikeIdentityChart() {
  const [points, setPoints] = useState<DetectionPoint[]>(buildHistory);
  const counterRef = useRef(WINDOW);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      const delay = Math.random() * 15_000;
      timeoutId = setTimeout(() => {
        const count = Math.random() < 0.6 ? 0 : Math.floor(Math.random() * 3) + 1;
        counterRef.current += 1;
        setPoints((prev) => [
          ...prev.slice(-(WINDOW - 1)),
          { t: counterRef.current, count },
        ]);
        scheduleNext();
      }, delay);
    };

    scheduleNext();
    return () => clearTimeout(timeoutId);
  }, []);

  const maxCount = Math.max(...points.map((p) => p.count), 5);
  const toX = (i: number) => PAD_X + (i / (WINDOW - 1)) * (W - PAD_X * 2);
  const toY = (v: number) => H - PAD_Y - (v / maxCount) * (H - PAD_Y * 2);

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(2)},${toY(p.count).toFixed(2)}`)
    .join(' ');

  const areaPath =
    linePath +
    ` L${toX(points.length - 1).toFixed(2)},${H - PAD_Y} L${toX(0).toFixed(2)},${H - PAD_Y} Z`;

  const gridLines = [1, 2, 3].map((n) => toY((n / 3) * maxCount));

  const yMid = Math.round(maxCount / 2);

  return (
    <div className="cs-identity-chart">
      <div className="cs-identity-chart-header">
        <span className="live-dot" />
        IDENTITY PROTECTION — DETECTIONS
      </div>

      <div className="cs-chart-area">
        <div className="cs-y-axis">
          <span>{maxCount}</span>
          <span>{yMid}</span>
          <span>0</span>
        </div>
        <div className="cs-chart-inner">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="csAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b44fff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#b44fff" stopOpacity="0.02" />
          </linearGradient>
          <filter id="csGlow">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {gridLines.map((y, i) => (
          <line
            key={i}
            x1={PAD_X} y1={y.toFixed(2)}
            x2={W - PAD_X} y2={y.toFixed(2)}
            stroke="rgba(180,79,255,0.12)"
            strokeWidth="0.4"
          />
        ))}

        <path d={areaPath} fill="url(#csAreaGrad)" />

        <path
          d={linePath}
          fill="none"
          stroke="#b44fff"
          strokeWidth="1.2"
          strokeLinejoin="round"
          strokeLinecap="round"
          filter="url(#csGlow)"
        />

        {/* Dots on non-zero points + latest point */}
        {points.map((p, i) => {
          const isLast = i === points.length - 1;
          if (p.count === 0 && !isLast) return null;
          return (
            <circle
              key={p.t}
              cx={toX(i).toFixed(2)}
              cy={toY(p.count).toFixed(2)}
              r={isLast ? '1.6' : '1.2'}
              fill={isLast ? '#fff' : '#b44fff'}
              stroke="#b44fff"
              strokeWidth="0.6"
              filter="url(#csGlow)"
            />
          );
        })}
      </svg>
          <div className="cs-x-axis">
            <span>−{WINDOW}</span>
            <span>NOW</span>
          </div>
        </div>
      </div>
    </div>
  );
}
