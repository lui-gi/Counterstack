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
        style={{ width: 680, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-h">
          <div className="modal-t" style={{display:'flex',alignItems:'center',gap:6}}><img src="/magician-icon.png" style={{height:18,objectFit:'contain',flexShrink:0}} />🔮 MAGICIAN'S FULL READING</div>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>

        {/* Organization */}
        <div className="modal-sect-t">Organization</div>
        <div className="modal-grid">
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
          <>
            <span className="mc-l">Posture Hand</span>
            <span className="mc-v" style={{ color: posture.royal ? 'var(--gold)' : 'var(--cyan)' }}>{posture.hand}</span>
          </>
          <>
            <span className="mc-l">Score</span>
            <span className="mc-v">{posture.score}/100</span>
          </>
        </div>
        <div style={{ fontSize: 12, color: 'var(--dim)', marginBottom: 4, marginTop: 4 }}>
          {totalSections} profile sections loaded
        </div>

        {/* Domain Posture */}
        <div className="modal-sect-t" style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>Domain Posture</div>
        {Object.entries(SUITS).map(([key, cfg]) => {
          const rank = ranks[key] ?? 1;
          const rankName = RANK_NAMES[rank] ?? String(rank);
          const pct = Math.round((rank / 13) * 100);
          return (
            <div key={key} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ color: cfg.color, fontSize: 15 }}>{cfg.sym}</span>
                <span style={{ fontFamily: 'var(--fm)', fontSize: 12, letterSpacing: 1, color: cfg.color }}>
                  {cfg.name}
                </span>
                <span style={{ fontSize: 11, color: 'var(--dim)', marginLeft: 2 }}>{cfg.sub}</span>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--fm)', fontSize: 12, color: cfg.color }}>
                  {rankName} · {rank}/13
                </span>
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
        <div className="modal-sect-t" style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12, display:'flex',alignItems:'center',gap:5}}><img src="/magician-icon.png" style={{height:14,objectFit:'contain',flexShrink:0}} />Magician's Analysis</div>

        {loading && (
          <div className="ai-scan">
            <div className="ai-ldot" />
            <span style={{display:'inline-flex',alignItems:'center',gap:4}}><img src="/magician-icon.png" style={{height:12,objectFit:'contain',flexShrink:0}} />THE MAGICIAN IS READING...</span>
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
              padding: '10px 12px',
              marginBottom: 14,
              display: 'flex',
              gap: 8,
              alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>🔮</span>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
                {result.summary}
              </p>
            </div>

            {/* Critical Finding */}
            {result.topPriority && (
              <div style={{
                background: 'rgba(245,158,11,.06)',
                border: '1px solid rgba(245,158,11,.3)',
                borderRadius: 6,
                padding: '10px 12px',
                marginBottom: 14,
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>⚠</span>
                <div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--fm)', letterSpacing: 1, color: '#f59e0b', marginBottom: 3 }}>CRITICAL FINDING</div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{result.topPriority}</p>
                </div>
              </div>
            )}

            {/* Strengths + Weaknesses side by side */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {/* Strengths */}
              <div style={{ flex: 1, minWidth: 240 }}>
                <div className="mr-subsect-label" style={{ color: '#39d353' }}>▲ STRENGTHS</div>
                {result.strengths.map((s, i) => (
                  <div key={i} className="mr-reading-item mr-strength">
                    <span className="mr-item-bullet" style={{ color: '#39d353' }}>✓</span>
                    {s}
                  </div>
                ))}
              </div>

              {/* Weaknesses */}
              <div style={{ flex: 1, minWidth: 240 }}>
                <div className="mr-subsect-label" style={{ color: 'var(--pink)' }}>▼ WEAKNESSES</div>
                {result.weaknesses.map((w, i) => {
                  const urgencyLabel = w.urgency === 'immediate' ? 'IMMEDIATE' : w.urgency === 'short_term' ? 'SHORT TERM' : 'LONG TERM';
                  const urgencyColor = w.urgency === 'immediate' ? '#ef4444' : w.urgency === 'short_term' ? '#f59e0b' : 'var(--dim)';
                  return (
                    <div key={i} className="mr-reading-item mr-weakness" style={{ flexWrap: 'wrap', gap: 6 }}>
                      <span className="mr-item-bullet" style={{ color: 'var(--pink)' }}>!</span>
                      <span style={{ flex: 1 }}>{w.text}</span>
                      <span style={{
                        fontSize: 8,
                        fontFamily: 'var(--fm)',
                        letterSpacing: 0.8,
                        color: urgencyColor,
                        border: `1px solid ${urgencyColor}`,
                        borderRadius: 3,
                        padding: '1px 4px',
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
