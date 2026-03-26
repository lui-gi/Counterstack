import { useEffect } from 'react';
import { RANK_NAMES, SUIT_DATA } from '../data/gameData';
import { PostureChart } from './PostureChart';
import { XIcon } from './layout/Icons';
import type { SuitDashboardProps } from '../interfaces/SuitDashboardProps.interface';

const SEVERITY_COLORS: Record<string, string> = {
  high: '#f72585',
  medium: '#ff9f1c',
  low: '#39d353',
};

export function SuitDashboard({
  suitKey,
  cfg,
  rank,
  onClose,
  allRanks,
  aiAnalysis,
  onRequestAnalysis,
  hasOrgProfile,
}: SuitDashboardProps) {
  useEffect(() => {
    if (hasOrgProfile && !aiAnalysis) {
      onRequestAnalysis();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suitKey]);

  const data = SUIT_DATA[suitKey];
  const rankName = RANK_NAMES[rank];
  const pct = Math.round((rank / 13) * 100);

  return (
    <div className="panel fade-in" style={{ borderColor: `${cfg.color}33` }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24, color: cfg.color }}>{cfg.sym}</span>
          <div>
            <div
              style={{
                fontFamily: 'var(--fh)',
                fontSize: 13,
                color: cfg.color,
                letterSpacing: '0.1em',
              }}
            >
              {cfg.name}
            </div>
            <div style={{ fontSize: 10, color: 'var(--dim)' }}>{cfg.sub}</div>
          </div>
          <div
            style={{
              marginLeft: 8,
              background: `${cfg.color}22`,
              border: `1px solid ${cfg.color}55`,
              borderRadius: 4,
              padding: '2px 8px',
              fontFamily: 'var(--fh)',
              fontSize: 12,
              color: cfg.color,
            }}
          >
            {rankName} / 13
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dim)' }}
        >
          <XIcon size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: '#1a2332', borderRadius: 2, marginBottom: 12 }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: cfg.color,
            borderRadius: 2,
            transition: 'width 0.5s',
          }}
        />
      </div>

      {/* Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 6,
          marginBottom: 12,
        }}
      >
        {data?.metrics.map(m => (
          <div
            key={m.key}
            style={{
              background: '#0d1117',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 6,
              padding: '6px 8px',
            }}
          >
            <div style={{ fontSize: 9, color: 'var(--dim)', letterSpacing: '0.08em' }}>
              {m.key}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: cfg.color, marginTop: 2 }}>
              {m.value}
            </div>
            <div
              style={{
                fontSize: 9,
                color:
                  m.trend === 'up' ? '#39d353'
                  : m.trend === 'down' ? '#f72585'
                  : 'var(--dim)',
              }}
            >
              {m.trend === 'up' ? '▲' : m.trend === 'down' ? '▼' : '–'} {m.rawPct}%
            </div>
          </div>
        ))}
      </div>

      {/* AI Recommendations */}
      <div style={{ marginBottom: 12 }}>
        <div className="panel-header" style={{ color: '#a78bfa' }}>
          ✨ MAGICIAN ANALYSIS
        </div>
        {!hasOrgProfile ? (
          <div
            style={{
              fontSize: 11,
              color: 'var(--dim)',
              fontStyle: 'italic',
              padding: '8px',
              background: '#0d1117',
              borderRadius: 6,
            }}
          >
            Connect org profile to unlock Magician analysis
          </div>
        ) : aiAnalysis?.loading ? (
          <div style={{ fontSize: 11, color: '#a78bfa', padding: '8px' }}>
            ⟳ Analyzing domain...
          </div>
        ) : aiAnalysis?.recommendations ? (
          <div>
            <div style={{ fontSize: 10, color: 'var(--dim)', marginBottom: 6 }}>
              {aiAnalysis.reasoning}
            </div>
            {aiAnalysis.recommendations.map((rec, i) => (
              <div
                key={i}
                style={{
                  fontSize: 11,
                  padding: '4px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  display: 'flex',
                  gap: 6,
                }}
              >
                <span style={{ color: '#a78bfa' }}>▸</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 11, color: 'var(--dim)' }}>
            {data?.aiRecs.map((rec, i) => (
              <div key={i} style={{ padding: '3px 0', display: 'flex', gap: 6 }}>
                <span style={{ color: '#a78bfa' }}>▸</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Three columns: capabilities / risks / upgrade path */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 9,
              color: cfg.color,
              letterSpacing: '0.1em',
              marginBottom: 4,
            }}
          >
            CAPABILITIES
          </div>
          {data?.capabilities.map((c, i) => (
            <div key={i} style={{ fontSize: 10, color: 'var(--dim)', padding: '2px 0' }}>
              • {c}
            </div>
          ))}
        </div>
        <div>
          <div
            style={{
              fontSize: 9,
              color: '#f72585',
              letterSpacing: '0.1em',
              marginBottom: 4,
            }}
          >
            RISK EXPOSURE
          </div>
          {data?.risks.map((r, i) => (
            <div
              key={i}
              style={{
                fontSize: 10,
                padding: '2px 0',
                color: SEVERITY_COLORS[r.severity],
              }}
            >
              ● {r.label}
            </div>
          ))}
        </div>
        <div>
          <div
            style={{
              fontSize: 9,
              color: '#39d353',
              letterSpacing: '0.1em',
              marginBottom: 4,
            }}
          >
            UPGRADE PATH
          </div>
          {data?.upgradePath.map((u, i) => (
            <div key={i} style={{ fontSize: 10, color: 'var(--dim)', padding: '2px 0' }}>
              → {u}
            </div>
          ))}
        </div>
      </div>

      <PostureChart allRanks={allRanks} />
    </div>
  );
}
