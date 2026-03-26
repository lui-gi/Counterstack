import { useEffect } from 'react';
import { useSimulation } from '../gameplay/useSimulation';
import { SUITS, RANK_NAMES } from '../../data/gameData';
import type { SimCard } from '../engine/types';

interface SimulationTableProps {
  initialRanks: Record<string, number>;
  onBack: () => void;
}

const POSTURE_COLORS: Record<string, string> = {
  secure:    '#39d353',
  stable:    '#00d4ff',
  strained:  '#ffd700',
  critical:  '#ff9f1c',
  breached:  '#f72585',
};

const SUIT_COLORS: Record<string, string> = {
  spade:   '#00d4ff',
  club:    '#39d353',
  diamond: '#a78bfa',
  heart:   '#f72585',
};

const SUIT_SYMS: Record<string, string> = {
  spade:   '♠',
  club:    '♣',
  diamond: '♦',
  heart:   '♥',
};

interface ResourceBarProps {
  label: string;
  value: number;
  color: string;
}

function ResourceBar({ label, value, color }: ResourceBarProps) {
  return (
    <div style={{ flex: 1 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 9,
          marginBottom: 3,
        }}
      >
        <span style={{ color: 'var(--dim)' }}>{label}</span>
        <span style={{ color, fontFamily: 'var(--fh)' }}>{Math.round(value)}</span>
      </div>
      <div style={{ height: 5, background: '#1a2332', borderRadius: 3 }}>
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, value)}%`,
            background: color,
            borderRadius: 3,
            transition: 'width 0.3s',
          }}
        />
      </div>
    </div>
  );
}

export function SimulationTable({ initialRanks, onBack }: SimulationTableProps) {
  const { state, startTurn, playCard, fold, useJackpot, nextPhase } =
    useSimulation(initialRanks);
  const {
    phase,
    turn,
    resources,
    activeThreat,
    hand,
    log,
    posture,
    jackpotAvailable,
    jackpotUsed,
    foldCount,
  } = state;

  // Auto-advance phases
  useEffect(() => {
    if (phase === 'threat-appears') {
      const t = setTimeout(startTurn, 600);
      return () => clearTimeout(t);
    }
    if (phase === 'enemy-respond' || phase === 'posture-update') {
      const t = setTimeout(nextPhase, 800);
      return () => clearTimeout(t);
    }
  }, [phase, startTurn, nextPhase]);

  const postureColor = POSTURE_COLORS[posture.level] ?? '#00d4ff';

  // ── Defeat / Compromised ──────────────────────────────────────────────────────

  if (phase === 'defeat' || phase === 'compromised') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--fh)',
            fontSize: 28,
            color: '#f72585',
            letterSpacing: '0.2em',
          }}
        >
          {phase === 'compromised' ? 'SYSTEM COMPROMISED' : 'BREACH DETECTED'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--dim)' }}>
          {phase === 'compromised'
            ? 'Non-Spade card played during system patch window'
            : `Survived ${turn} turns`}
        </div>
        <button
          onClick={onBack}
          style={{
            background: '#f7258522',
            border: '1px solid #f72585',
            color: '#f72585',
            fontFamily: 'var(--fh)',
            fontSize: 12,
            padding: '10px 24px',
            borderRadius: 6,
            cursor: 'pointer',
            letterSpacing: '0.1em',
          }}
        >
          ← RETURN TO ANALYZE MODE
        </button>
      </div>
    );
  }

  // ── Victory ───────────────────────────────────────────────────────────────────

  if (phase === 'victory') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--fh)',
            fontSize: 28,
            color: '#39d353',
            letterSpacing: '0.2em',
          }}
        >
          INFRASTRUCTURE SECURED
        </div>
        <div style={{ fontSize: 12, color: 'var(--dim)' }}>
          All threats neutralized in {turn} turns
        </div>
        <button
          onClick={onBack}
          style={{
            background: '#39d35322',
            border: '1px solid #39d353',
            color: '#39d353',
            fontFamily: 'var(--fh)',
            fontSize: 12,
            padding: '10px 24px',
            borderRadius: 6,
            cursor: 'pointer',
            letterSpacing: '0.1em',
          }}
        >
          ← RETURN TO ANALYZE MODE
        </button>
      </div>
    );
  }

  // ── Main simulation table ─────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        padding: 16,
        display: 'grid',
        gridTemplateColumns: '240px 1fr 280px',
        gridTemplateRows: '48px 1fr 160px',
        gap: 12,
        fontFamily: 'var(--fm)',
      }}
    >
      {/* ── Top bar ── */}
      <div
        style={{
          gridColumn: '1/-1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(13,17,23,0.9)',
          border: '1px solid rgba(0,212,255,0.15)',
          borderRadius: 8,
          padding: '0 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              fontFamily: 'var(--fh)',
              fontSize: 12,
              color: '#00d4ff',
              letterSpacing: '0.15em',
            }}
          >
            SIMULATION
          </span>
          <span style={{ fontSize: 11, color: 'var(--dim)' }}>TURN {turn}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: 'var(--fh)', fontSize: 11, color: postureColor }}>
            {posture.level.toUpperCase()}
          </span>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: '1px solid rgba(205,217,229,0.2)',
              color: 'var(--dim)',
              fontSize: 10,
              fontFamily: 'var(--fh)',
              padding: '4px 10px',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            ← ANALYZE
          </button>
        </div>
      </div>

      {/* ── Left: Posture dial + resources ── */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="panel-header">POSTURE DIAL</div>

        {/* Dial SVG */}
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <svg width="140" height="80" viewBox="0 0 140 80">
            {(
              [
                { level: 'breached', color: '#f72585', d: 'M10,70 A60,60 0 0,1 35,20'   },
                { level: 'critical', color: '#ff9f1c', d: 'M35,20 A60,60 0 0,1 70,10'  },
                { level: 'strained', color: '#ffd700', d: 'M70,10 A60,60 0 0,1 105,20' },
                { level: 'stable',   color: '#00d4ff', d: 'M105,20 A60,60 0 0,1 130,70'},
              ] as const
            ).map(seg => (
              <path
                key={seg.level}
                d={seg.d}
                fill="none"
                stroke={seg.level === posture.level ? seg.color : `${seg.color}33`}
                strokeWidth="8"
                strokeLinecap="round"
              />
            ))}
            <text
              x="70"
              y="70"
              textAnchor="middle"
              fill={postureColor}
              fontSize="11"
              fontFamily="'Space Mono'"
              fontWeight="700"
            >
              {posture.level.toUpperCase()}
            </text>
            <text
              x="70"
              y="82"
              textAnchor="middle"
              fill="rgba(205,217,229,0.5)"
              fontSize="8"
              fontFamily="'JetBrains Mono'"
            >
              {posture.score}/100
            </text>
          </svg>
        </div>

        {/* Resource bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ResourceBar label="HEALTH"   value={resources.health}   color="#f72585" />
          <ResourceBar label="MANA"     value={resources.mana}     color="#a78bfa" />
          <ResourceBar label="STRENGTH" value={resources.strength} color="#ffd700" />
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
          <button
            onClick={fold}
            disabled={foldCount >= 3 || phase !== 'choose'}
            style={{
              flex: 1,
              background: foldCount < 3 ? '#ffd70011' : '#1a2332',
              border: `1px solid ${foldCount < 3 ? '#ffd70044' : 'rgba(255,255,255,0.06)'}`,
              color: foldCount < 3 ? '#ffd700' : '#4b5563',
              fontFamily: 'var(--fh)',
              fontSize: 10,
              padding: '6px',
              borderRadius: 4,
              cursor: foldCount < 3 ? 'pointer' : 'not-allowed',
            }}
          >
            FOLD ({3 - foldCount})
          </button>
          {jackpotAvailable && !jackpotUsed && (
            <button
              onClick={useJackpot}
              disabled={phase !== 'choose'}
              style={{
                flex: 1,
                background: '#ffd70022',
                border: '1px solid #ffd700',
                color: '#ffd700',
                fontFamily: 'var(--fh)',
                fontSize: 9,
                padding: '6px',
                borderRadius: 4,
                cursor: 'pointer',
                animation: 'threatFlash 1s infinite',
              }}
            >
              🎰 JACKPOT
            </button>
          )}
        </div>
      </div>

      {/* ── Center: Active threat ── */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="panel-header" style={{ color: '#f72585' }}>⚠ ACTIVE THREAT</div>
        {activeThreat ? (
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 12,
              }}
            >
              <div>
                <div
                  style={{ fontFamily: 'var(--fh)', fontSize: 16, color: '#f72585' }}
                >
                  {activeThreat.name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 4 }}>
                  {activeThreat.description}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {activeThreat.cveTag && (
                  <div
                    style={{
                      background: '#f7258511',
                      border: '1px solid #f7258533',
                      borderRadius: 4,
                      padding: '2px 6px',
                      fontSize: 9,
                      color: '#f72585',
                    }}
                  >
                    {activeThreat.cveTag}
                  </div>
                )}
                {activeThreat.specialMechanic && (
                  <div
                    style={{
                      background: '#ffd70011',
                      border: '1px solid #ffd70033',
                      borderRadius: 4,
                      padding: '2px 6px',
                      fontSize: 9,
                      color: '#ffd700',
                      marginTop: 4,
                    }}
                  >
                    {activeThreat.specialMechanic.toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* HP bar */}
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 10,
                  marginBottom: 4,
                }}
              >
                <span style={{ color: 'var(--dim)' }}>THREAT HP</span>
                <span style={{ color: '#f72585', fontFamily: 'var(--fh)' }}>
                  {activeThreat.hp}/{activeThreat.maxHp}
                </span>
              </div>
              <div style={{ height: 8, background: '#1a2332', borderRadius: 4 }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(activeThreat.hp / activeThreat.maxHp) * 100}%`,
                    background: '#f72585',
                    borderRadius: 4,
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 12, fontSize: 10 }}>
              <div>
                <span style={{ color: 'var(--dim)' }}>ATK: </span>
                <span style={{ color: '#ff9f1c', fontFamily: 'var(--fh)' }}>
                  {activeThreat.attackPower}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--dim)' }}>EVA: </span>
                <span style={{ color: '#ffd700', fontFamily: 'var(--fh)' }}>
                  {Math.round(activeThreat.evasion * 100)}%
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--dim)' }}>BEHAVIOR: </span>
                <span style={{ color: '#00d4ff', fontFamily: 'var(--fh)' }}>
                  {activeThreat.behavior}
                </span>
              </div>
            </div>

            {/* Rootkit diamond counter */}
            {activeThreat.specialMechanic === 'rootkit-trojan' && (
              <div
                style={{
                  marginTop: 12,
                  padding: '8px',
                  background: '#ffd70011',
                  border: '1px solid #ffd70033',
                  borderRadius: 6,
                  fontSize: 10,
                  color: '#ffd700',
                }}
              >
                💎 Diamonds to expose: {activeThreat.diamondsPlayed ?? 0}/7
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--dim)',
              fontSize: 11,
            }}
          >
            {phase === 'threat-appears' ? 'Scanning for threats...' : 'No active threat'}
          </div>
        )}
      </div>

      {/* ── Right: Combat log ── */}
      <div
        className="panel"
        style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div className="panel-header">COMBAT LOG</div>
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column-reverse',
          }}
        >
          {[...log]
            .reverse()
            .slice(0, 20)
            .map(entry => (
              <div
                key={entry.id}
                style={{
                  fontSize: 10,
                  padding: '3px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  color:
                    entry.severity === 'danger'  ? '#f72585'
                    : entry.severity === 'success' ? '#39d353'
                    : entry.severity === 'warning' ? '#ff9f1c'
                    : '#00d4ff',
                }}
              >
                <span style={{ color: 'rgba(205,217,229,0.3)', marginRight: 4 }}>
                  [T{entry.turn}]
                </span>
                {entry.text}
              </div>
            ))}
        </div>
      </div>

      {/* ── Bottom: Player hand ── */}
      <div className="panel" style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column' }}>
        <div className="panel-header">
          YOUR HAND
          {phase === 'choose' && (
            <span style={{ color: '#39d353', marginLeft: 8 }}>
              — SELECT A CARD TO PLAY
            </span>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flex: 1,
            alignItems: 'center',
          }}
        >
          {hand.map((card: SimCard) => {
            const color = SUIT_COLORS[card.suit] ?? '#00d4ff';
            const suitLabel = SUITS[card.suit === 'club' ? 'clover' : card.suit]?.name ?? card.suit;
            const canPlay = phase === 'choose';
            return (
              <button
                key={card.id}
                onClick={() => canPlay && playCard(card)}
                style={{
                  width: 90,
                  height: 120,
                  background: canPlay ? `${color}11` : '#0d1117',
                  border: `1px solid ${canPlay ? `${color}66` : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 8,
                  cursor: canPlay ? 'pointer' : 'default',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  transition: 'transform 0.1s, box-shadow 0.1s',
                  boxShadow: canPlay ? `0 0 10px ${color}22` : undefined,
                }}
                onMouseEnter={e => {
                  if (canPlay) (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'none';
                }}
                title={suitLabel}
              >
                <div
                  style={{
                    fontSize: 20,
                    fontFamily: 'var(--fh)',
                    color,
                    fontWeight: 700,
                  }}
                >
                  {RANK_NAMES[card.rank]}
                </div>
                <div style={{ fontSize: 24, color }}>{SUIT_SYMS[card.suit]}</div>
                <div
                  style={{
                    fontSize: 8,
                    color: 'var(--dim)',
                    textAlign: 'center',
                    padding: '0 4px',
                    lineHeight: 1.2,
                  }}
                >
                  {card.actionName}
                </div>
                {card.manaCost > 0 && (
                  <div style={{ fontSize: 8, color: '#a78bfa' }}>{card.manaCost} mana</div>
                )}
              </button>
            );
          })}
          {hand.length === 0 && phase !== 'threat-appears' && (
            <div style={{ color: 'var(--dim)', fontSize: 11 }}>Drawing cards...</div>
          )}
        </div>
      </div>
    </div>
  );
}
