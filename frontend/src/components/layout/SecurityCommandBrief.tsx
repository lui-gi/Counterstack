import { SUITS, RANK_NAMES } from '../../data/gameData';
import type { AccountData } from '../../interfaces/AccountData.interface';
import type { ScoredCve } from '../../interfaces/ScoredCve.interface';

interface PostureResult {
  hand: string;
  score: number;
  tier: number;
  royal: boolean;
  desc: string;
}

interface OptimalHandResult {
  targetRanks: Record<string, number>;
  targetHand: string;
  targetScore: number;
  isAlreadyOptimal: boolean;
}

interface Weakness {
  text: string;
  urgency: 'immediate' | 'short_term' | 'long_term';
}

interface SecurityCommandBriefProps {
  ranks: Record<string, number>;
  optimalHand: OptimalHandResult;
  posture: PostureResult;
  accountData?: AccountData | null;
  activeCve: ScoredCve | null;
  geminiThreatPct: number | null;
  geminiAttackVectors: string[];
  magicianSummary: string;
  magicianTopPriority: string;
  magicianWeaknesses: Weakness[];
  magicianLoading: boolean;
  onOpenReading: () => void;
  onOpenRoadmap: () => void;
  onOpenIncidentRoom: () => void;
}

const URGENCY_COLORS: Record<string, string> = {
  immediate: '#ef4444',
  short_term: '#f59e0b',
  long_term: 'var(--dim)',
};

const URGENCY_LABELS: Record<string, string> = {
  immediate: 'IMMEDIATE',
  short_term: 'SHORT TERM',
  long_term: 'LONG TERM',
};

export default function SecurityCommandBrief({
  ranks,
  optimalHand,
  posture,
  accountData,
  activeCve,
  geminiThreatPct,
  geminiAttackVectors,
  magicianSummary,
  magicianTopPriority,
  magicianWeaknesses,
  magicianLoading,
  onOpenReading,
  onOpenRoadmap,
  onOpenIncidentRoom,
}: SecurityCommandBriefProps) {
  const suitEntries = Object.entries(SUITS) as [string, typeof SUITS[keyof typeof SUITS]][];

  const threatPctColor =
    geminiThreatPct === null ? 'var(--dim)'
    : geminiThreatPct >= 70 ? '#ef4444'
    : geminiThreatPct >= 40 ? '#f59e0b'
    : '#39d353';

  const hasOrgData = !!(accountData?.orgName);
  const hasAiData = !magicianLoading && (magicianSummary || magicianTopPriority || magicianWeaknesses.length > 0);

  return (
    <div id="tour-command-brief" className="panel scb-panel">
      {/* Header */}
      <div className="scb-header">
        <div className="scb-header-left">
          <span className="scb-title">SECURITY COMMAND BRIEF</span>
          {hasOrgData && (
            <span className="scb-org-meta">
              {accountData!.orgName}
              {accountData!.industry ? ` · ${accountData!.industry}` : ''}
              {accountData!.employeeCount ? ` · ${accountData!.employeeCount}` : ''}
              {accountData!.infraType ? ` · ${accountData!.infraType}` : ''}
            </span>
          )}
        </div>
        <div className="scb-score-badge">
          <span className="scb-score-val">{posture.score}</span>
          <span className="scb-score-denom">/100</span>
          <span className="scb-hand-label">{posture.hand.replace(' ', '\u00A0')}</span>
        </div>
      </div>

      <div className="scb-body">
        {/* Domain Gap Matrix */}
        <div className="scb-section">
          <div className="scb-sect-label">DOMAIN GAP MATRIX</div>
          <div className="scb-matrix">
            {suitEntries.map(([key, cfg]) => {
              const current = ranks[key] ?? 1;
              const target = optimalHand.targetRanks[key] ?? current;
              const diff = target - current;
              const pct = Math.round((current / 13) * 100);
              const targetPct = Math.round((target / 13) * 100);
              return (
                <div key={key} className="scb-matrix-row">
                  <span className="scb-matrix-sym" style={{ color: cfg.color }}>{cfg.sym}</span>
                  <span className="scb-matrix-name" style={{ color: cfg.color }}>{cfg.name}</span>
                  <span className="scb-matrix-rank">{RANK_NAMES[current]}</span>
                  <span className="scb-matrix-arrow">→</span>
                  <span className="scb-matrix-rank">{RANK_NAMES[target]}</span>
                  <div className="scb-bar-wrap">
                    <div className="scb-bar-track">
                      <div
                        className="scb-bar-fill"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg,${cfg.color},${cfg.color}88)`,
                          boxShadow: `0 0 4px ${cfg.glow}`,
                        }}
                      />
                      {targetPct > pct && (
                        <div
                          className="scb-bar-target"
                          style={{
                            left: `${pct}%`,
                            width: `${targetPct - pct}%`,
                            background: `${cfg.color}22`,
                            borderRight: `1px solid ${cfg.color}66`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <span
                    className="scb-matrix-delta"
                    style={{ color: diff > 0 ? '#39d353' : 'var(--dim)' }}
                  >
                    {diff > 0 ? `+${diff}` : '✓'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Threat */}
        {activeCve && (
          <div className="scb-section">
            <div className="scb-sect-label">ACTIVE THREAT</div>
            <div className="scb-threat-row">
              <span className="scb-threat-id">{activeCve.cveId}</span>
              {geminiThreatPct !== null && (
                <span className="scb-threat-pct" style={{ color: threatPctColor }}>
                  {geminiThreatPct}%
                </span>
              )}
              {geminiAttackVectors.slice(0, 3).map((v) => (
                <span key={v} className="scb-threat-tag">{v}</span>
              ))}
            </div>
          </div>
        )}

        {/* AI Sections */}
        {magicianLoading ? (
          <div className="scb-section">
            <div className="scb-skeleton scb-skeleton-wide" />
            <div className="scb-skeleton scb-skeleton-med" style={{ marginTop: 5 }} />
            <div className="scb-skeleton scb-skeleton-narrow" style={{ marginTop: 5 }} />
          </div>
        ) : hasAiData ? (
          <>
            {/* Top Priority */}
            {magicianTopPriority && (
              <div className="scb-section">
                <div className="scb-sect-label">TOP PRIORITY</div>
                <div className="scb-priority-row">
                  <span className="scb-priority-icon">▲</span>
                  <span className="scb-priority-text">{magicianTopPriority}</span>
                </div>
              </div>
            )}

            {/* Situation */}
            {magicianSummary && (
              <div className="scb-section">
                <div className="scb-sect-label">SITUATION</div>
                <p className="scb-situation-text">{magicianSummary}</p>
              </div>
            )}

            {/* Weaknesses */}
            {magicianWeaknesses.length > 0 && (
              <div className="scb-section">
                <div className="scb-sect-label">WEAKNESSES</div>
                {magicianWeaknesses.slice(0, 3).map((w, i) => {
                  const color = URGENCY_COLORS[w.urgency] ?? 'var(--dim)';
                  const label = URGENCY_LABELS[w.urgency] ?? w.urgency;
                  return (
                    <div key={i} className="scb-weakness-row">
                      <span className="scb-weakness-icon" style={{ color: 'var(--pink)' }}>!</span>
                      <span className="scb-weakness-text">{w.text}</span>
                      <span
                        className="scb-urgency-badge"
                        style={{ color, borderColor: color }}
                      >{label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : null}

        {/* Action Buttons */}
        <div className="scb-actions">
          <button className="scb-btn scb-btn-purple" onClick={onOpenReading}>
            VIEW FULL READING
          </button>
          <button className="scb-btn scb-btn-cyan" onClick={onOpenRoadmap}>
            OPEN ROADMAP
          </button>
          <button className="scb-btn scb-btn-pink" onClick={onOpenIncidentRoom}>
            THREAT ANALYSIS
          </button>
        </div>
      </div>
    </div>
  );
}
