import { XIcon } from './Icons';

interface MagicianReadingProps {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  loading: boolean;
  onClose: () => void;
  onRequest: () => void;
  hasOrgProfile: boolean;
}

export function MagicianReading({
  summary,
  strengths,
  weaknesses,
  loading,
  onClose,
  onRequest,
  hasOrgProfile,
}: MagicianReadingProps) {
  return (
    <div className="panel fade-in" style={{ borderColor: '#a78bfa33' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div className="panel-header" style={{ color: '#a78bfa', marginBottom: 0 }}>
          ✨ MAGICIAN'S READING
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dim)' }}
        >
          <XIcon size={12} />
        </button>
      </div>

      {loading ? (
        <div
          style={{
            fontSize: 11,
            color: '#a78bfa',
            padding: '12px 0',
            textAlign: 'center',
          }}
        >
          ⟳ The Magician reads your posture...
        </div>
      ) : !summary && hasOrgProfile ? (
        <button
          onClick={onRequest}
          style={{
            width: '100%',
            background: '#a78bfa11',
            border: '1px solid #a78bfa44',
            color: '#a78bfa',
            fontFamily: 'var(--fh)',
            fontSize: 11,
            padding: '8px',
            borderRadius: 6,
            cursor: 'pointer',
            letterSpacing: '0.08em',
          }}
        >
          OPEN MAGICIAN'S READING
        </button>
      ) : !hasOrgProfile ? (
        <div style={{ fontSize: 11, color: 'var(--dim)', fontStyle: 'italic' }}>
          Connect org profile to unlock Magician's Reading
        </div>
      ) : (
        <div>
          <p style={{ fontSize: 11, color: '#cdd9e5', marginBottom: 12, lineHeight: 1.6 }}>
            {summary}
          </p>
          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                fontSize: 9,
                color: '#39d353',
                letterSpacing: '0.1em',
                marginBottom: 4,
              }}
            >
              STRENGTHS
            </div>
            {strengths.map((s, i) => (
              <div key={i} style={{ fontSize: 10, padding: '3px 0', display: 'flex', gap: 6 }}>
                <span style={{ color: '#39d353' }}>▸</span>
                <span style={{ color: 'var(--dim)' }}>{s}</span>
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
              WEAKNESSES
            </div>
            {weaknesses.map((w, i) => (
              <div key={i} style={{ fontSize: 10, padding: '3px 0', display: 'flex', gap: 6 }}>
                <span style={{ color: '#f72585' }}>▸</span>
                <span style={{ color: 'var(--dim)' }}>{w}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
