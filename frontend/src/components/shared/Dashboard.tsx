import { getPostureZone, getZoneLabel, getZoneColor } from '../../engine/posture';
import type { GameState } from '../../interfaces/GameState.interface';
import type { Suit } from '../../interfaces/Suit.interface';
import type { HandProps } from '../../interfaces/HandProps.interface';
import type { DashboardProps } from '../../interfaces/DashboardProps.interface';
import { SuitIcon, LogoMark } from '../layout/Icons';

// ── Tailwind class maps keyed by suit ──────────────────────────────────────

const SUIT_TEXT: Record<Suit, string> = {
  clubs:    'text-clubs',
  diamonds: 'text-diamonds',
  hearts:   'text-hearts',
  spades:   'text-spades',
};

const SUIT_BORDER: Record<Suit, string> = {
  clubs:    'border-clubs',
  diamonds: 'border-diamonds',
  hearts:   'border-hearts',
  spades:   'border-spades',
};

const SUIT_SHADOW: Record<Suit, string> = {
  clubs:    'shadow-glow-clubs',
  diamonds: 'shadow-glow-diamonds',
  hearts:   'shadow-glow-hearts',
  spades:   'shadow-glow-spades',
};

const SUIT_BG: Record<Suit, string> = {
  clubs:    'bg-clubs',
  diamonds: 'bg-diamonds',
  hearts:   'bg-hearts',
  spades:   'bg-spades',
};

// ── PostureGauge ───────────────────────────────────────────────────────────

function PostureGauge({ posture, isRedAlert }: { posture: number; isRedAlert: boolean }) {
  const zone     = getPostureZone(posture);
  const hexColor = getZoneColor(zone);
  const C        = 2 * Math.PI * 54;
  const offset   = C * (1 - posture / 100);

  const textCls =
    zone === 'secure' ? 'text-clubs' : zone === 'stable' ? 'text-yellow-400' : 'text-spades';
  const shadowCls =
    zone === 'secure'
      ? 'shadow-glow-clubs'
      : zone === 'stable'
        ? 'shadow-[0_0_20px_rgba(234,179,8,0.5)]'
        : 'shadow-glow-spades';
  const borderCls =
    zone === 'secure'
      ? 'border-clubs'
      : zone === 'stable'
        ? 'border-yellow-400'
        : 'border-spades';

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-mono text-slate-400 tracking-widest uppercase">
        Posture Score
      </span>

      <div
        className={`relative w-36 h-36 rounded-full transition-shadow duration-700 ${shadowCls} ${isRedAlert ? 'red-alert-flicker' : ''}`}
      >
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle cx="60" cy="60" r="54" fill="none" stroke="#1E293B" strokeWidth="10" />
          {/* Progress arc */}
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke={hexColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-mono font-bold ${textCls}`}>{posture}</span>
          <span className="text-xs text-slate-400 font-mono">/ 100</span>
        </div>
      </div>

      <span
        className={`text-xs font-mono font-semibold tracking-widest uppercase px-2 py-0.5 rounded border ${textCls} ${borderCls} border-opacity-40`}
      >
        {getZoneLabel(zone)}
      </span>
    </div>
  );
}

// ── SuitBreakdown ──────────────────────────────────────────────────────────

function SuitBar({ suit, label, value }: { suit: Suit; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <SuitIcon suit={suit} size={14} />
      <span className="w-20 text-xs font-mono text-slate-400 truncate">{label}</span>
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: '#1E293B' }}
      >
        <div
          className={`h-full rounded-full ${SUIT_BG[suit]} transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={`w-8 text-right text-xs font-mono ${SUIT_TEXT[suit]}`}>{value}</span>
    </div>
  );
}

function SuitBreakdown({ org }: { org: GameState['org'] }) {
  const healthVal = Math.round((org.health.visibilityScore + org.health.hygienePercent) / 2);

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-mono text-slate-400 tracking-widest uppercase mb-1">
        Domain Breakdown
      </span>
      <SuitBar suit="clubs"    label="Health"    value={healthVal} />
      <SuitBar suit="diamonds" label="Hardening" value={org.hardening.hardeningScore} />
      <SuitBar suit="hearts"   label="Recovery"  value={org.recovery.resilienceFactor} />
      <SuitBar suit="spades"   label="Pressure"  value={org.attack.pressureLevel} />
    </div>
  );
}

// ── IncidentBanner ─────────────────────────────────────────────────────────

function IncidentBanner({ log }: { log: GameState['incidentLog'] }) {
  const latest = log[0];
  if (!latest) return null;

  const cls = {
    critical: 'border-spades text-spades bg-spades/10',
    warning:  'border-yellow-400 text-yellow-400 bg-yellow-400/10',
    info:     'border-diamonds text-diamonds bg-diamonds/10',
  }[latest.severity];

  const label = { critical: '! ALERT', warning: '⚠ WARN', info: 'i INFO' }[latest.severity];

  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded border font-mono text-xs transition-all duration-500 ${cls}`}>
      <span className="font-bold shrink-0">{label}</span>
      {latest.cveId && (
        <span
          className="shrink-0 px-1.5 py-0.5 rounded border border-current opacity-70 text-[10px]"
          style={{ background: '#1E293B' }}
        >
          {latest.cveId}
        </span>
      )}
      <span className="truncate opacity-90">{latest.message}</span>
      <span className="ml-auto shrink-0 opacity-40">
        {new Date(latest.timestamp).toLocaleTimeString()}
      </span>
    </div>
  );
}

// ── Arena ──────────────────────────────────────────────────────────────────

function Arena({ dealerCard }: { dealerCard: GameState['dealerCard'] }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 relative z-10">
      <span className="text-xs font-mono text-slate-500 tracking-widest uppercase">
        Dealer Arena
      </span>

      {dealerCard ? (
        <div
          className={`w-32 h-48 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-500
            ${SUIT_TEXT[dealerCard.suit]} ${SUIT_BORDER[dealerCard.suit]} ${SUIT_SHADOW[dealerCard.suit]}`}
          style={{ background: '#1E293B' }}
        >
          <span className="text-4xl font-mono font-bold">{dealerCard.rank}</span>
          <SuitIcon suit={dealerCard.suit} size={32} />
          <span className="text-xs font-mono text-slate-300 text-center px-2 leading-tight">
            {dealerCard.name}
          </span>
          {dealerCard.cveId && (
            <span className="text-[10px] font-mono opacity-60 text-center px-1">
              {dealerCard.cveId}
            </span>
          )}
        </div>
      ) : (
        <div
          className="w-32 h-48 rounded-xl border-2 border-dashed border-slate-700 flex items-center justify-center"
          style={{ background: 'rgba(30,41,59,0.4)' }}
        >
          <span className="text-slate-600 font-mono text-xs">Waiting...</span>
        </div>
      )}
    </div>
  );
}

// ── Hand ───────────────────────────────────────────────────────────────────

function Hand({ hand, onPlayCard, phase }: HandProps) {
  const canPlay = phase === 'action';

  if (hand.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-slate-600 font-mono text-xs tracking-widest">No cards in hand</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 h-full">
      {hand.map((card) => (
        <button
          key={card.id}
          disabled={!canPlay}
          onClick={() => onPlayCard(card.id)}
          className={`
            w-24 h-36 rounded-xl border-2 flex flex-col items-center justify-center gap-1
            transition-all duration-200
            disabled:opacity-40 disabled:cursor-not-allowed
            ${SUIT_TEXT[card.suit]} ${SUIT_BORDER[card.suit]}
            ${canPlay
              ? `hover:-translate-y-2 hover:scale-105 active:scale-95 cursor-pointer ${SUIT_SHADOW[card.suit]}`
              : ''
            }
          `}
          style={{ background: '#1E293B' }}
        >
          <span className="text-xl font-mono font-bold">{card.rank}</span>
          <SuitIcon suit={card.suit} size={22} />
          <span className="text-[10px] font-mono text-slate-400 text-center px-1 leading-tight">
            {card.name}
          </span>
          <span className={`text-[9px] font-mono ${SUIT_TEXT[card.suit]} opacity-70`}>
            {card.effect > 0 ? `+${card.effect}` : card.effect}
          </span>
        </button>
      ))}
    </div>
  );
}

// ── IncidentLog ────────────────────────────────────────────────────────────

function IncidentLog({ log }: { log: GameState['incidentLog'] }) {
  const severityCls = {
    critical: 'border-spades text-slate-300 bg-spades/5',
    warning:  'border-yellow-400 text-slate-300 bg-yellow-400/5',
    info:     'border-diamonds text-slate-400 bg-diamonds/5',
  };

  return (
    <aside
      className="w-72 shrink-0 border-l border-slate-800 flex flex-col"
      style={{ background: '#0F172A' }}
    >
      <div className="px-4 py-3 border-b border-slate-800">
        <span className="text-xs font-mono text-slate-400 tracking-widest uppercase">
          Incident Log
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {log.length === 0 ? (
          <span className="text-slate-600 text-xs font-mono text-center mt-8">
            No events recorded.
          </span>
        ) : (
          log.map((entry) => (
            <div
              key={entry.id}
              className={`text-xs font-mono rounded p-2 border-l-2 ${severityCls[entry.severity]}`}
            >
              {entry.cveId && (
                <span className="text-spades font-bold mr-1">[{entry.cveId}]</span>
              )}
              {entry.message}
              <div className="text-slate-600 text-[10px] mt-0.5">
                T{entry.turnNumber} · {new Date(entry.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

// ── Dashboard (root export) ────────────────────────────────────────────────

export default function Dashboard({ gameState, onPlayCard }: DashboardProps) {
  const {
    org, isRedAlert, isEmergencyMode,
    dealerCard, playerHand, incidentLog, phase, turnNumber,
  } = gameState;

  const phaseCls = {
    deal:       'text-diamonds',
    action:     'text-clubs',
    resolve:    'text-hearts',
    'game-over':'text-spades',
  }[phase];

  return (
    <div
      className={`h-screen flex flex-col font-mono overflow-hidden transition-colors duration-700 ${isRedAlert ? 'red-alert-flicker' : ''}`}
      style={{ background: isRedAlert ? '#0A0608' : '#0F172A', color: '#CBD5E1' }}
    >
      {/* CRT scanline overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          opacity: 0.03,
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.8) 2px, rgba(0,0,0,0.8) 4px)',
        }}
      />

      {/* Red alert vignette */}
      {isRedAlert && (
        <div
          className="pointer-events-none fixed inset-0 z-40 animate-pulse"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 40%, rgba(239,68,68,0.2) 100%)',
          }}
        />
      )}

      {/* ── Header ── */}
      <header
        className="flex items-center justify-between px-6 py-3 border-b border-slate-800 shrink-0"
        style={{ boxShadow: '0 1px 0 rgba(59,130,246,0.25), 0 4px 24px rgba(16,185,129,0.04)' }}
      >
        <div className="flex items-center gap-3">
          <LogoMark size={28} />
          <span className="text-xl font-bold" style={{ letterSpacing: '0.06em' }}>
            <span className="text-clubs glow-clubs">Counter</span>
            <span className="text-diamonds glow-diamonds">Stack</span>
          </span>
          <span className="text-slate-600 text-xs hidden sm:block">// cyber-posture simulation</span>
        </div>

        <div className="flex items-center gap-5 text-xs text-slate-500">
          <span>TURN <span className="text-slate-300">{turnNumber}</span></span>
          <span>PHASE <span className={phaseCls}>{phase.toUpperCase()}</span></span>
          {isEmergencyMode && (
            <span className="text-spades animate-pulse font-bold tracking-widest glow-spades">
              !! EMERGENCY
            </span>
          )}
        </div>
      </header>

      {/* ── Incident Banner ── */}
      <div className="px-6 py-2 shrink-0">
        <IncidentBanner log={incidentLog} />
      </div>

      {/* ── Main Three-Column Grid ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left Sidebar */}
        <aside
          className="w-64 shrink-0 border-r border-slate-800 flex flex-col gap-6 p-5 overflow-y-auto"
          style={{
            background: '#0F172A',
            boxShadow: '1px 0 0 rgba(16,185,129,0.12)',
          }}
        >
          <PostureGauge posture={org.overallPosture} isRedAlert={isRedAlert} />

          <div className="border-t border-slate-800 pt-5">
            <SuitBreakdown org={org} />
          </div>

          <div className="border-t border-slate-800 pt-4">
            <span className="text-xs font-mono text-slate-400 tracking-widest uppercase block mb-2">
              Active Policies
            </span>
            <ul className="flex flex-col gap-1.5">
              {org.hardening.activePolicies.map((p) => (
                <li key={p} className="flex items-center gap-2 text-xs text-slate-300">
                  <DiamondDot />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-slate-800 pt-4 mt-auto">
            <span className="text-xs font-mono text-slate-500 tracking-widest uppercase block mb-1">
              Last Backup
            </span>
            <span className="text-xs text-slate-400">
              {new Date(org.recovery.lastBackupTimestamp).toLocaleString()}
            </span>
          </div>
        </aside>

        {/* Center: Arena + Hand */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Arena */}
          <div className="flex-1 relative" style={{ background: '#0C1628' }}>
            {/* Blue grid background */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(59,130,246,0.07) 1px, transparent 1px),' +
                  'linear-gradient(90deg, rgba(59,130,246,0.07) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
            <Arena dealerCard={dealerCard} />
          </div>

          {/* Player Hand */}
          <div
            className="h-48 shrink-0 border-t border-slate-800 px-6 py-3 flex flex-col"
            style={{ background: 'rgba(30,41,59,0.3)' }}
          >
            <span className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-2">
              Your Hand
            </span>
            <Hand hand={playerHand} onPlayCard={onPlayCard} phase={phase} />
          </div>
        </main>

        {/* Right: Incident Log */}
        <IncidentLog log={incidentLog} />
      </div>
    </div>
  );
}

// Tiny inline SVG bullet used in policies list — avoids any file reference
function DiamondDot() {
  return (
    <svg width="6" height="6" viewBox="0 0 6 6" fill="#3B82F6" className="shrink-0" aria-hidden="true">
      <polygon points="3,0 6,3 3,6 0,3" />
    </svg>
  );
}
