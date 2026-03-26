interface AnalyzeIntroProps {
  orgName?: string;
  hand: string;
  score: number;
  onClose: () => void;
}

export function AnalyzeIntro({ orgName, hand, score, onClose }: AnalyzeIntroProps) {
  return (
    <div className="panel fade-in" style={{ borderColor: '#00d4ff22' }}>
      <div className="panel-header">⬡ COUNTERSTACK OVERVIEW</div>
      <div style={{ fontSize: 12, color: '#cdd9e5', marginBottom: 12, lineHeight: 1.6 }}>
        {orgName ? `Welcome, ${orgName}.` : 'Welcome to CounterStack.'} Your cybersecurity
        posture has been evaluated across four security domains and translated into a poker hand.
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div
          style={{
            background: '#ffd70011',
            border: '1px solid #ffd70033',
            borderRadius: 6,
            padding: '8px 12px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: 'var(--fh)', fontSize: 14, color: '#ffd700' }}>{hand}</div>
          <div style={{ fontSize: 9, color: 'var(--dim)', marginTop: 2 }}>POSTURE HAND</div>
        </div>
        <div
          style={{
            background: '#00d4ff11',
            border: '1px solid #00d4ff33',
            borderRadius: 6,
            padding: '8px 12px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: 'var(--fh)', fontSize: 14, color: '#00d4ff' }}>
            {score}/100
          </div>
          <div style={{ fontSize: 9, color: 'var(--dim)', marginTop: 2 }}>POSTURE SCORE</div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--dim)', lineHeight: 1.6 }}>
        <p>
          Click any <strong style={{ color: '#00d4ff' }}>suit card</strong> to explore that
          security domain in detail.
        </p>
        <p>
          Click the <strong style={{ color: '#a78bfa' }}>Joker card</strong> to browse CVEs
          from the CISA Known Exploited Vulnerabilities catalog.
        </p>
        <p>
          Use the <strong style={{ color: '#ffd700' }}>MAGICIAN'S READING</strong> for a
          holistic AI assessment of your posture.
        </p>
      </div>

      <button
        onClick={onClose}
        style={{
          marginTop: 12,
          background: 'none',
          border: '1px solid rgba(0,212,255,0.2)',
          color: '#00d4ff',
          fontSize: 10,
          fontFamily: 'var(--fh)',
          padding: '4px 10px',
          borderRadius: 4,
          cursor: 'pointer',
          letterSpacing: '0.08em',
        }}
      >
        DISMISS
      </button>
    </div>
  );
}
