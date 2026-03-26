import { SUITS, RANK_NAMES } from '../../data/gameData';

interface SimulationIntroProps {
  initialRanks: Record<string, number>;
  isTutorial: boolean;
  onStart: () => void;
}

export function SimulationIntro({ initialRanks, isTutorial, onStart }: SimulationIntroProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--fm)',
      }}
    >
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div
          style={{
            fontFamily: 'var(--fh)',
            fontSize: 24,
            color: '#00d4ff',
            letterSpacing: '0.2em',
          }}
        >
          SIMULATION MODE
        </div>
        <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 8 }}>
          Your security posture becomes your hand. Defend against cyber threats.
        </div>
      </div>

      {/* Imported rank cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        {Object.entries(SUITS).map(([key, cfg]) => (
          <div
            key={key}
            style={{
              width: 90,
              height: 120,
              background: '#0d1117',
              border: `1px solid ${cfg.color}44`,
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              boxShadow: `0 0 15px ${cfg.glow ?? cfg.color}33`,
            }}
          >
            <div
              style={{
                fontSize: 22,
                color: cfg.color,
                fontFamily: 'var(--fh)',
              }}
            >
              {RANK_NAMES[initialRanks[key] ?? 7]}
            </div>
            <div style={{ fontSize: 28, color: cfg.color }}>{cfg.sym}</div>
            <div style={{ fontSize: 9, color: 'var(--dim)', letterSpacing: '0.08em' }}>
              {cfg.name}
            </div>
          </div>
        ))}
      </div>

      {/* Tutorial text */}
      {isTutorial && (
        <div
          style={{
            background: '#0d1117',
            border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: 8,
            padding: 20,
            maxWidth: 480,
            marginBottom: 24,
            fontSize: 11,
            color: 'var(--dim)',
            lineHeight: 1.7,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--fh)',
              fontSize: 10,
              color: '#00d4ff',
              marginBottom: 8,
            }}
          >
            HOW TO PLAY
          </div>
          <p>
            ♠ <strong style={{ color: '#00d4ff' }}>Spades</strong> — Attack threats directly.
            Damage = power × (1 − evasion)
          </p>
          <p>
            ♣ <strong style={{ color: '#39d353' }}>Clubs</strong> — Restore mana. Mana gained
            = power × 0.8
          </p>
          <p>
            ♥ <strong style={{ color: '#f72585' }}>Hearts</strong> — Restore health + mana.
            Health = power × 1.5
          </p>
          <p>
            ♦ <strong style={{ color: '#a78bfa' }}>Diamonds</strong> — Build strength (blocks
            incoming damage). 10% block, 20% extra turn
          </p>
          <p>
            Use <strong style={{ color: '#ffd700' }}>FOLD</strong> to discard and redraw (3
            uses). Unlock{' '}
            <strong style={{ color: '#ffd700' }}>BLACK HAT JACKPOT</strong> at turn 13.
          </p>
        </div>
      )}

      <button
        onClick={onStart}
        style={{
          background: '#00d4ff22',
          border: '1px solid #00d4ff',
          color: '#00d4ff',
          fontFamily: 'var(--fh)',
          fontSize: 14,
          padding: '12px 40px',
          borderRadius: 8,
          cursor: 'pointer',
          letterSpacing: '0.15em',
        }}
      >
        [ SIMULATE ]
      </button>
    </div>
  );
}
