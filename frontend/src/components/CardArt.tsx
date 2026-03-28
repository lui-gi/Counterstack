// ── CardArt.tsx ──────────────────────────────────────────────
// Vector SVG card faces for each suit.
// Crisp at any resolution — no external assets needed.
// ─────────────────────────────────────────────────────────────
import React from 'react';

function CloverArt({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 88 124" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="cl-bg" cx="50%" cy="44%" r="70%">
          <stop offset="0%"   stopColor="#0e2614"/>
          <stop offset="100%" stopColor="#010902"/>
        </radialGradient>
        <filter id="cl-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="cl-soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.2" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width="88" height="124" fill="url(#cl-bg)"/>

      {/* Matrix grid */}
      {[11,22,33,44,55,66,77].map(x =>
        <line key={x} x1={x} y1="0" x2={x} y2="124" stroke={c} strokeWidth="0.35" opacity="0.06"/>
      )}
      {[12,24,36,48,62,76,90,104,118].map(y =>
        <line key={y} x1="0" y1={y} x2="88" y2={y} stroke={c} strokeWidth="0.35" opacity="0.06"/>
      )}

      {/* Outer ambient ring */}
      <circle cx="44" cy="57" r="34" fill="none" stroke={c} strokeWidth="0.6" opacity="0.12"/>
      <circle cx="44" cy="57" r="26" fill={c} fillOpacity="0.05" stroke={c} strokeWidth="0.4" opacity="0.18"/>


      {/* Side scan lines */}
      <line x1="5" y1="51" x2="22" y2="51" stroke={c} strokeWidth="0.8" opacity="0.35"/>
      <line x1="5" y1="57" x2="18" y2="57" stroke={c} strokeWidth="0.8" opacity="0.55"/>
      <line x1="5" y1="63" x2="22" y2="63" stroke={c} strokeWidth="0.8" opacity="0.35"/>

      <line x1="83" y1="51" x2="66" y2="51" stroke={c} strokeWidth="0.8" opacity="0.35"/>
      <line x1="83" y1="57" x2="70" y2="57" stroke={c} strokeWidth="0.8" opacity="0.55"/>
      <line x1="83" y1="63" x2="66" y2="63" stroke={c} strokeWidth="0.8" opacity="0.35"/>

      {/* Node dots */}
      {[[18,30],[70,30],[18,84],[70,84]].map(([x,y],i) =>
        <circle key={i} cx={x} cy={y} r="1.4" fill={c} opacity="0.4" filter="url(#cl-soft)"/>
      )}

      {/* Diagonal circuit traces */}
      <polyline points="7,7 18,30 44,42" stroke={c} strokeWidth="0.4" fill="none" opacity="0.2"/>
      <polyline points="81,7 70,30 44,42" stroke={c} strokeWidth="0.4" fill="none" opacity="0.2"/>

      {/* Main suit symbol */}
      <text x="44" y="74" textAnchor="middle" fontSize="50"
        fill={c} fontFamily="'DM Mono', monospace" filter="url(#cl-glow)" opacity="0.97">♣</text>

      {/* Bottom bar */}
      <rect x="22" y="104" width="44" height="1" fill={c} opacity="0.2" rx="0.5"/>
    </svg>
  );
}

function SpadeArt({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 88 124" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sp-bg" cx="50%" cy="44%" r="68%">
          <stop offset="0%"   stopColor="#061620"/>
          <stop offset="100%" stopColor="#010408"/>
        </radialGradient>
        <filter id="sp-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <rect width="88" height="124" fill="url(#sp-bg)"/>

      {/* Radar rings */}
      {[14, 24, 34].map((r, i) =>
        <circle key={i} cx="44" cy="55" r={r} fill="none" stroke={c}
          strokeWidth="0.5" opacity={0.06 + i * 0.04} strokeDasharray="2 3"/>
      )}
      <circle cx="44" cy="55" r="10" fill={c} fillOpacity="0.06" stroke={c} strokeWidth="0.5" opacity="0.25"/>

      {/* Crosshair */}
      <line x1="44" y1="20" x2="44" y2="36" stroke={c} strokeWidth="0.6" opacity="0.3"/>
      <line x1="44" y1="74" x2="44" y2="90" stroke={c} strokeWidth="0.6" opacity="0.3"/>
      <line x1="9"  y1="55" x2="25" y2="55" stroke={c} strokeWidth="0.6" opacity="0.3"/>
      <line x1="63" y1="55" x2="79" y2="55" stroke={c} strokeWidth="0.6" opacity="0.3"/>


      {/* Ping dots on radar ring */}
      <circle cx="44" cy="31" r="2"  fill={c} opacity="0.8" filter="url(#sp-glow)"/>
      <circle cx="60" cy="45" r="1.2" fill={c} opacity="0.5"/>
      <circle cx="28" cy="62" r="1"   fill={c} opacity="0.4"/>

      {/* Main suit symbol */}
      <text x="44" y="73" textAnchor="middle" fontSize="50"
        fill={c} fontFamily="'DM Mono', monospace" filter="url(#sp-glow)" opacity="0.97">♠</text>

      {/* Bottom bar */}
      <rect x="22" y="104" width="44" height="1" fill={c} opacity="0.2" rx="0.5"/>
    </svg>
  );
}

function DiamondArt({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 88 124" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="dm-bg" cx="50%" cy="44%" r="70%">
          <stop offset="0%"   stopColor="#110820"/>
          <stop offset="100%" stopColor="#030108"/>
        </radialGradient>
        <filter id="dm-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <rect width="88" height="124" fill="url(#dm-bg)"/>

      {/* Hex-tile background — hand-placed rows */}
      {[
        [12,18],[34,18],[56,18],[78,18],
        [23,33],[45,33],[67,33],
        [12,48],[34,48],[56,48],[78,48],
        [23,63],[45,63],[67,63],
        [12,78],[34,78],[56,78],[78,78],
      ].map(([x,y],i) =>
        <polygon key={i}
          points={`${x},${y-7} ${x+6},${y-3.5} ${x+6},${y+3.5} ${x},${y+7} ${x-6},${y+3.5} ${x-6},${y-3.5}`}
          fill="none" stroke={c} strokeWidth="0.35" opacity="0.09"/>
      )}

      {/* Shield outline */}
      <path d="M44,22 L64,34 L64,58 Q44,74 44,74 Q44,74 24,58 L24,34 Z"
        fill={c} fillOpacity="0.05" stroke={c} strokeWidth="0.7" opacity="0.25"/>


      {/* Main suit symbol */}
      <text x="44" y="73" textAnchor="middle" fontSize="50"
        fill={c} fontFamily="'DM Mono', monospace" filter="url(#dm-glow)" opacity="0.97">♦</text>

      {/* Inner diamond facet lines */}
      <line x1="44" y1="37" x2="44" y2="71" stroke={c} strokeWidth="0.5" opacity="0.18"/>
      <line x1="26" y1="55" x2="62" y2="55" stroke={c} strokeWidth="0.5" opacity="0.18"/>
      <line x1="32" y1="40" x2="56" y2="70" stroke={c} strokeWidth="0.4" opacity="0.12"/>
      <line x1="56" y1="40" x2="32" y2="70" stroke={c} strokeWidth="0.4" opacity="0.12"/>

      {/* Bottom bar */}
      <rect x="22" y="104" width="44" height="1" fill={c} opacity="0.2" rx="0.5"/>
    </svg>
  );
}

function HeartArt({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 88 124" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ht-bg" cx="50%" cy="44%" r="70%">
          <stop offset="0%"   stopColor="#1c0415"/>
          <stop offset="100%" stopColor="#060103"/>
        </radialGradient>
        <filter id="ht-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <rect width="88" height="124" fill="url(#ht-bg)"/>

      {/* Curved wave lines — recovery theme */}
      {[0, 1, 2].map(i => (
        <path key={i}
          d={`M0,${38 + i*10} Q22,${28 + i*10} 44,${38 + i*10} Q66,${48 + i*10} 88,${38 + i*10}`}
          fill="none" stroke={c} strokeWidth="0.4" opacity={0.07 + i * 0.02}/>
      ))}
      {[0, 1, 2].map(i => (
        <path key={i+3}
          d={`M0,${70 + i*10} Q22,${60 + i*10} 44,${70 + i*10} Q66,${80 + i*10} 88,${70 + i*10}`}
          fill="none" stroke={c} strokeWidth="0.4" opacity={0.07 + i * 0.02}/>
      ))}

      {/* Recovery arcs */}
      <circle cx="44" cy="56" r="30" fill="none" stroke={c} strokeWidth="0.6" opacity="0.1" strokeDasharray="4 5"/>
      <circle cx="44" cy="56" r="20" fill={c} fillOpacity="0.05" stroke={c} strokeWidth="0.5" opacity="0.18"/>


      {/* ECG / pulse line */}
      <polyline
        points="6,56 18,56 22,44 26,68 30,44 34,56 82,56"
        fill="none" stroke={c} strokeWidth="1.1" opacity="0.5" strokeLinejoin="round"/>

      {/* Pulse nodes */}
      <circle cx="22" cy="44" r="1.5" fill={c} opacity="0.7"/>
      <circle cx="30" cy="44" r="1.5" fill={c} opacity="0.7"/>

      {/* Main suit symbol */}
      <text x="44" y="74" textAnchor="middle" fontSize="50"
        fill={c} fontFamily="'DM Mono', monospace" filter="url(#ht-glow)" opacity="0.97">♥</text>

      {/* Bottom bar */}
      <rect x="22" y="104" width="44" height="1" fill={c} opacity="0.2" rx="0.5"/>
    </svg>
  );
}

const ART_MAP: Record<string, (props: { c: string }) => React.JSX.Element> = {
  clover:  CloverArt,
  spade:   SpadeArt,
  diamond: DiamondArt,
  heart:   HeartArt,
};

const SUIT_SYM: Record<string, string> = { clover:'♣', spade:'♠', diamond:'♦', heart:'♥' };
const RANK_LABELS = ['','A','2','3','4','5','6','7','8','9','10','J','Q','K'];

interface CardArtProps {
  suitKey: string;
  color: string;
  rank?: number;
}

export default function CardArt({ suitKey, color, rank }: CardArtProps) {
  const Component = ART_MAP[suitKey];
  if (!Component) return null;
  const rnk = rank ? RANK_LABELS[rank] : '';
  const sym = SUIT_SYM[suitKey] ?? '';
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Component c={color} />
      {rnk && (
        <>
          {/* Top-left rank */}
          <div style={{
            position: 'absolute', top: 6, left: 6,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
            pointerEvents: 'none', lineHeight: 1,
          }}>
            <span style={{ fontFamily: 'var(--fm)', fontSize: 12, fontWeight: 700, color,
              textShadow: `0 0 8px ${color}aa` }}>{rnk}</span>
            <span style={{ fontSize: 9, color, opacity: 0.8 }}>{sym}</span>
          </div>
          {/* Bottom-right rank (mirrored) */}
          <div style={{
            position: 'absolute', bottom: 6, right: 6,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
            pointerEvents: 'none', lineHeight: 1,
            transform: 'rotate(180deg)',
          }}>
            <span style={{ fontFamily: 'var(--fm)', fontSize: 12, fontWeight: 700, color,
              textShadow: `0 0 8px ${color}aa` }}>{rnk}</span>
            <span style={{ fontSize: 9, color, opacity: 0.8 }}>{sym}</span>
          </div>
        </>
      )}
    </div>
  );
}
