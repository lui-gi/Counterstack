import { useState, useEffect } from 'react';
import { SUITS, RANK_NAMES } from '../../data/gameData';
import { analyzeMagicianReading } from '../../services/geminiPosture';
import type { MagicianReadingProps } from '../../interfaces/MagicianReadingProps.interface';

interface MagicianReadingResult {
  summary: string;
  topPriority: string;
  strengths: string[];
  weaknesses: { text: string; urgency: 'immediate' | 'short_term' | 'long_term' }[];
}

function rankQualLabel(rank: number): { label: string; color: string } {
  if (rank <= 3) return { label: 'CRITICAL', color: '#ef4444' };
  if (rank <= 6) return { label: 'AT RISK', color: '#f59e0b' };
  if (rank <= 9) return { label: 'FAIR', color: 'var(--dim)' };
  if (rank <= 11) return { label: 'GOOD', color: '#39d353' };
  return { label: 'EXCELLENT', color: 'var(--cyan)' };
}

export default function MagicianReading({ orgProfile, ranks, accountData, posture, onClose }: MagicianReadingProps) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<MagicianReadingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    analyzeMagicianReading(orgProfile, {
      clover: ranks.clover,
      spade: ranks.spade,
      diamond: ranks.diamond,
      heart: ranks.heart,
    })
      .then((data) => {
        if (!mounted) return;
        setResult(data);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Analysis failed');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  const totalSections = Object.keys(orgProfile).length;

  return (
    <div className="modal-ov" onClick={onClose}>
      <div
        className="modal-box"
        style={{ width: 860, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', paddingTop: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="modal-h" style={{
          position: 'sticky',
          top: 0,
          background: 'rgba(3,10,22,.99)',
          zIndex: 1,
          borderBottom: '1px solid var(--border)',
          margin: '0 -28px 20px',
          padding: '18px 28px 16px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="modal-t" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <img src="/magician-icon.png" style={{ height: 18, objectFit: 'contain', flexShrink: 0 }} />
              🔮 MAGICIAN'S FULL READING
            </div>
            <div style={{
              fontFamily: 'var(--fm)',
              fontSize: 12,
              letterSpacing: 1,
              color: posture.royal ? 'var(--gold)' : 'var(--cyan)',
              paddingLeft: 24,
            }}>
              {posture.hand} · {posture.score}/100
            </div>
          </div>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>

        {/* Organization */}
        <div className="modal-sect-t" style={{ borderLeft: '2px solid var(--cyan)', paddingLeft: 10 }}>Organization</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr auto 1fr', gap: '4px 20px', marginBottom: 14, alignItems: 'center' }}>
          {accountData?.orgName && (
            <>
              <span className="mc-l">Org</span>
              <span className="mc-v">{accountData.orgName}</span>
            </>
          )}
          {accountData?.industry && (
            <>
              <span className="mc-l">Industry</span>
              <span className="mc-v">{accountData.industry}</span>
            </>
          )}
          {accountData?.employeeCount && (
            <>
              <span className="mc-l">Size</span>
              <span className="mc-v">{accountData.employeeCount}</span>
            </>
          )}
          {accountData?.infraType && (
            <>
              <span className="mc-l">Infra</span>
              <span className="mc-v">{accountData.infraType}</span>
            </>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--dim)', marginBottom: 4, marginTop: 4 }}>
          {totalSections} profile sections loaded
        </div>

        {/* Domain Posture */}
        <div className="modal-sect-t" style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 14, borderLeft: '2px solid var(--cyan)', paddingLeft: 10 }}>Domain Posture</div>
        {Object.entries(SUITS).map(([key, cfg]) => {
          const rank = ranks[key] ?? 1;
          const rankName = RANK_NAMES[rank] ?? String(rank);
          const pct = Math.round((rank / 13) * 100);
          const qual = rankQualLabel(rank);
          return (
            <div key={key} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ color: cfg.color, fontSize: 15 }}>{cfg.sym}</span>
                <span style={{ fontFamily: 'var(--fm)', fontSize: 12, letterSpacing: 1, color: cfg.color }}>
                  {cfg.name}
                </span>
                <span style={{ fontSize: 11, color: 'var(--dim)', marginLeft: 2 }}>{cfg.sub}</span>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--dim)' }}>
                  {rankName} · {rank}/13
                </span>
                <span style={{
                  fontSize: 9,
                  fontFamily: 'var(--fm)',
                  letterSpacing: 0.8,
                  color: qual.color,
                  border: `1px solid ${qual.color}`,
                  borderRadius: 3,
                  padding: '1px 5px',
                  flexShrink: 0,
                }}>{qual.label}</span>
              </div>
              <div className="ptrack">
                <div
                  className="pfill"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}88)`,
                    boxShadow: `0 0 6px ${cfg.glow}`,
                  }}
                />
              </div>
            </div>
          );
        })}

        {/* Magician's Analysis */}
        <div className="modal-sect-t" style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 14, display: 'flex', alignItems: 'center', gap: 5, borderLeft: '2px solid var(--cyan)', paddingLeft: 10 }}>
          <img src="/magician-icon.png" style={{ height: 14, objectFit: 'contain', flexShrink: 0 }} />Magician's Analysis
        </div>

        {loading && (
          <div className="ai-scan">
            <div className="ai-ldot" />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <img src="/magician-icon.png" style={{ height: 12, objectFit: 'contain', flexShrink: 0 }} />
              THE MAGICIAN IS READING...
            </span>
          </div>
        )}

        {!loading && error && (
          <div style={{ fontSize: 12, color: 'var(--dim)', fontStyle: 'italic' }}>
            Analysis unavailable: {error}
          </div>
        )}

        {!loading && result && (
          <>
            {/* Summary */}
            <div style={{
              background: 'rgba(0,212,255,.04)',
              border: '1px solid rgba(0,212,255,.15)',
              borderRadius: 6,
              padding: '14px 16px',
              marginBottom: 14,
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>🔮</span>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
                {result.summary}
              </p>
            </div>

            {/* Critical Finding */}
            {result.topPriority && (
              <div style={{
                background: 'rgba(245,158,11,.06)',
                border: '1px solid rgba(245,158,11,.3)',
                borderRadius: 6,
                padding: '14px 16px',
                marginBottom: 14,
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>⚠</span>
                <div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--fm)', letterSpacing: 1, color: '#f59e0b', marginBottom: 4 }}>CRITICAL FINDING</div>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{result.topPriority}</p>
                </div>
              </div>
            )}

            {/* Strengths + Weaknesses side by side */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {/* Strengths */}
              <div style={{ flex: 1, minWidth: 260 }}>
                <div className="mr-subsect-label" style={{ color: '#39d353' }}>▲ STRENGTHS</div>
                {result.strengths.map((s, i) => (
                  <div key={i} className="mr-reading-item mr-strength">
                    <span className="mr-item-bullet" style={{ color: '#39d353' }}>✓</span>
                    {s}
                  </div>
                ))}
              </div>

              {/* Weaknesses */}
              <div style={{ flex: 1, minWidth: 260 }}>
                <div className="mr-subsect-label" style={{ color: 'var(--pink)' }}>▼ WEAKNESSES</div>
                {result.weaknesses.map((w, i) => {
                  const urgencyLabel = w.urgency === 'immediate' ? 'IMMEDIATE' : w.urgency === 'short_term' ? 'SHORT TERM' : 'LONG TERM';
                  const urgencyColor = w.urgency === 'immediate' ? '#ef4444' : w.urgency === 'short_term' ? '#f59e0b' : 'var(--dim)';
                  return (
                    <div key={i} className="mr-reading-item mr-weakness" style={{ flexWrap: 'wrap', gap: 6 }}>
                      <span className="mr-item-bullet" style={{ color: 'var(--pink)' }}>!</span>
                      <span style={{ flex: 1 }}>{w.text}</span>
                      <span style={{
                        fontSize: 10,
                        fontFamily: 'var(--fm)',
                        letterSpacing: 0.8,
                        color: urgencyColor,
                        border: `1px solid ${urgencyColor}`,
                        borderRadius: 3,
                        padding: '1px 5px',
                        flexShrink: 0,
                        alignSelf: 'center',
                      }}>{urgencyLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
