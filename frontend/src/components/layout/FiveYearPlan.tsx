import { useState } from 'react';
import { XIcon } from './Icons';
import { analyzeFiveYearPlan } from '../../services/geminiPosture';

interface FiveYearPlanProps {
  ranks: Record<string, number>;
  targetRanks: Record<string, number>;
  currentHand: string;
  targetHand: string;
  currentScore: number;
  targetScore: number;
  orgName?: string;
  industry?: string;
  onClose: () => void;
}

export function FiveYearPlan({
  ranks,
  targetRanks,
  currentHand,
  targetHand,
  currentScore,
  targetScore,
  orgName,
  industry,
  onClose,
}: FiveYearPlanProps) {
  const [timeline, setTimeline] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const result = await analyzeFiveYearPlan({
        ranks,
        targetRanks,
        currentHand,
        targetHand,
        currentScore,
        targetScore,
        orgName,
        industry,
      });
      setTimeline(result.timeline);
    } catch {
      setTimeline('Failed to generate roadmap. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel fade-in" style={{ borderColor: '#ffd70033' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div className="panel-header" style={{ color: '#ffd700', marginBottom: 0 }}>
          📅 5-YEAR SECURITY ROADMAP
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dim)' }}
        >
          <XIcon size={12} />
        </button>
      </div>

      <div style={{ fontSize: 10, color: 'var(--dim)', marginBottom: 12 }}>
        <span style={{ color: '#ffd700' }}>{currentHand}</span>
        {' → '}
        <span style={{ color: '#39d353' }}>{targetHand}</span>
        {'  '}({currentScore} → {targetScore} pts)
      </div>

      {!timeline && !loading && (
        <button
          onClick={generate}
          style={{
            width: '100%',
            background: '#ffd70011',
            border: '1px solid #ffd70033',
            color: '#ffd700',
            fontFamily: 'var(--fh)',
            fontSize: 11,
            padding: '8px',
            borderRadius: 6,
            cursor: 'pointer',
            letterSpacing: '0.08em',
          }}
        >
          GENERATE ROADMAP
        </button>
      )}

      {loading && (
        <div
          style={{ fontSize: 11, color: '#ffd700', textAlign: 'center', padding: '12px 0' }}
        >
          ⟳ Generating roadmap...
        </div>
      )}

      {timeline && (
        <pre
          style={{
            fontSize: 10,
            color: '#cdd9e5',
            fontFamily: 'var(--fm)',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {timeline}
        </pre>
      )}
    </div>
  );
}
