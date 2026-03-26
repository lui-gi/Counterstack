import React from 'react';
import jokerClipart from '../assets/sprites/cards/JokerClipArt.png';

export default function JokerCardSVG({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden', borderRadius: 'inherit',
      background: 'linear-gradient(145deg,#0c0008,#1a0014,#0c0008)',
      ...style,
    }}>
      {/* Radial glow behind image */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 52%, rgba(247,37,133,0.18) 0%, transparent 70%)',
        zIndex: 1,
      }}/>

      {/* Joker clipart — invert so white bg drops out on dark card, tint pink */}
      <img
        src={jokerClipart}
        alt=""
        style={{
          position: 'absolute',
          left: '50%', top: '50%',
          transform: 'translate(-50%, -48%)',
          width: '88%', height: 'auto',
          zIndex: 2,
          filter: 'invert(1) sepia(1) saturate(5) hue-rotate(290deg) brightness(0.9)',
          mixBlendMode: 'screen',
          opacity: 0.90,
        }}
      />

      {/* Holo shimmer */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
        background: 'linear-gradient(135deg,transparent 20%,rgba(255,255,255,0.04) 45%,transparent 70%)',
      }}/>

      {/* SVG overlay — frame, corners, pips */}
      <svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 4 }}>
        <defs>
          <filter id="jp-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Corner J — top left */}
        <text x="9" y="23" fontFamily="Georgia,serif" fontSize="16" fontWeight="bold"
          fill="#f72585" opacity="0.85">J</text>
        <text x="12" y="36" fontFamily="system-ui" fontSize="9" fill="#f72585" opacity="0.55">★</text>

        {/* Corner J — bottom right */}
        <g transform="rotate(180,100,140)">
          <text x="9" y="23" fontFamily="Georgia,serif" fontSize="16" fontWeight="bold"
            fill="#f72585" opacity="0.85">J</text>
          <text x="12" y="36" fontFamily="system-ui" fontSize="9" fill="#f72585" opacity="0.55">★</text>
        </g>

        {/* Rule lines */}
        <line x1="8" y1="44" x2="192" y2="44" stroke="#f72585" strokeWidth="0.5" opacity="0.20"/>
        <line x1="8" y1="236" x2="192" y2="236" stroke="#f72585" strokeWidth="0.5" opacity="0.20"/>

        {/* Top-right logo */}
        <text x="182" y="22" textAnchor="middle" fontFamily="system-ui" fontSize="18"
          fill="#f72585" opacity="0.80" filter="url(#jp-glow)">⚜</text>

        {/* Bottom-left logo */}
        <text x="18" y="266" textAnchor="middle" fontFamily="system-ui" fontSize="18"
          fill="#f72585" opacity="0.80" filter="url(#jp-glow)">⚜</text>
      </svg>
    </div>
  );
}
