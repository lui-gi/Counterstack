import { useState, useEffect } from 'react';
import { analyzeFiveYearPlan } from '../../services/geminiPosture';
import type { AccountData } from '../../interfaces';

interface FiveYearPlanProps {
  ranks: Record<string, number>;
  targetRanks: Record<string, number>;
  posture: { hand: string; score: number };
  targetHand: string;
  targetScore: number;
  accountData?: AccountData | null;
  onClose: () => void;
}

export default function FiveYearPlan({ ranks, targetRanks, posture, targetHand, targetScore, accountData, onClose }: FiveYearPlanProps) {
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    analyzeFiveYearPlan({
      ranks,
      targetRanks,
      currentHand: posture.hand,
      targetHand,
      currentScore: posture.score,
      targetScore,
      orgName: accountData?.orgName,
      industry: accountData?.industry,
    })
      .then((data) => {
        if (!mounted) return;
        setTimeline(data.timeline);
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

  return (
    <div className="modal-ov" onClick={onClose}>
      <div
        className="modal-box"
        style={{ width: 720, maxWidth: '95vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-h">
          <div className="modal-t">🗺 5-YEAR ROADMAP</div>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>

        {/* Summary row */}
        <div style={{
          display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
          marginBottom: 14, padding: '8px 10px',
          background: 'rgba(0,212,255,.04)', border: '1px solid rgba(0,212,255,.12)',
          borderRadius: 6, fontSize: 12, fontFamily: 'var(--fm)',
        }}>
          {accountData?.orgName && (
            <span style={{ color: 'var(--text)' }}><span style={{ color: 'var(--dim)' }}>ORG</span> {accountData.orgName}</span>
          )}
          <span style={{ color: 'var(--text)' }}>
            <span style={{ color: 'var(--dim)' }}>FROM</span>{' '}
            <span style={{ color: 'var(--cyan)' }}>{posture.hand}</span>{' '}
            <span style={{ color: 'var(--dim)' }}>({posture.score}/100)</span>
          </span>
          <span style={{ color: 'var(--dim)' }}>→</span>
          <span style={{ color: 'var(--text)' }}>
            <span style={{ color: 'var(--dim)' }}>TO</span>{' '}
            <span style={{ color: '#39d353' }}>{targetHand}</span>{' '}
            <span style={{ color: 'var(--dim)' }}>({targetScore}/100)</span>
          </span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="ai-scan">
            <div className="ai-ldot" />
            THE MAGICIAN IS DRAWING YOUR FUTURE...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ fontSize: 12, color: 'var(--dim)', fontStyle: 'italic' }}>
            Analysis unavailable: {error}
          </div>
        )}

        {/* Timeline */}
        {!loading && timeline && (
          <div style={{ overflowY: 'auto', maxHeight: '60vh' }}>
            <pre style={{
              fontFamily: 'var(--fm)',
              fontSize: 12,
              lineHeight: 1.7,
              whiteSpace: 'pre',
              overflowX: 'auto',
              color: 'var(--text)',
              background: 'rgba(0,212,255,.03)',
              border: '1px solid rgba(0,212,255,.12)',
              borderRadius: 6,
              padding: '12px 14px',
              margin: 0,
            }}>
              {timeline}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
