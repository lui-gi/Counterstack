import { SUITS } from '../../data/gameData';
import type { ScoredCve } from '../../interfaces/ScoredCve.interface';

interface OptimalHandResult {
  targetRanks: Record<string, number>;
}

interface ThreatGapOverlayProps {
  activeCve: ScoredCve | null;
  geminiAttackVectors: string[];
  ranks: Record<string, number>;
  optimalHand: OptimalHandResult;
}

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  diamond: ['privilege', 'auth', 'access', 'credential', 'injection', 'bypass', 'escalation'],
  spade:   ['rce', 'remote', 'execute', 'execution', 'shell', 'command', 'code'],
  heart:   ['dos', 'denial', 'ransomware', 'availability', 'backup', 'wiper', 'recovery'],
  clover:  ['supply', 'dependency', 'package', 'inventory', 'asset', 'config', 'chain'],
};

function isDomainExposed(suitKey: string, vectors: string[]): boolean {
  if (vectors.length === 0) return false;
  const keywords = DOMAIN_KEYWORDS[suitKey] ?? [];
  return vectors.some(v =>
    keywords.some(kw => v.toLowerCase().includes(kw))
  );
}

export default function ThreatGapOverlay({
  activeCve,
  geminiAttackVectors,
  ranks,
  optimalHand,
}: ThreatGapOverlayProps) {
  const suitEntries = Object.entries(SUITS) as [string, typeof SUITS[keyof typeof SUITS]][];

  return (
    <div className="panel tgo-panel">
      <div className="ptitle">Threat-Gap Overlay</div>

      {!activeCve ? (
        <div className="tgo-empty">No active threat selected</div>
      ) : (
        <>
          {/* CVE header */}
          <div className="tgo-cve-row">
            <span className="tgo-cve-id">{activeCve.cveId}</span>
            {geminiAttackVectors.slice(0, 3).map(v => (
              <span key={v} className="tgo-vector-tag">{v}</span>
            ))}
          </div>

          {/* Domain rows */}
          <div className="tgo-domains">
            {suitEntries.map(([key, cfg]) => {
              const current = ranks[key] ?? 1;
              const target = optimalHand.targetRanks[key] ?? current;
              const delta = target - current;
              const hasGap = delta > 0;
              const exposed = hasGap && isDomainExposed(key, geminiAttackVectors);
              const covered = !hasGap;

              return (
                <div key={key} className="tgo-domain-row">
                  <span className="tgo-sym" style={{ color: cfg.color }}>{cfg.sym}</span>
                  <span className="tgo-name" style={{ color: cfg.color }}>{cfg.name}</span>
                  <span className="tgo-delta" style={{ color: hasGap ? '#fff' : 'var(--dim)' }}>
                    {hasGap ? `+${delta}` : '✓'}
                  </span>
                  {exposed ? (
                    <span className="tgo-badge tgo-badge-exposed">EXPOSED</span>
                  ) : covered ? (
                    <span className="tgo-badge tgo-badge-covered">COVERED</span>
                  ) : (
                    <span className="tgo-badge tgo-badge-gap">GAP</span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
