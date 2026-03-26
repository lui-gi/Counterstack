import { XIcon } from './Icons';

interface HandEntry {
  name: string;
  mult: string;
  color: string;
  desc: string;
}

const HANDS: HandEntry[] = [
  { name: 'ROYAL FLUSH',     mult: '×1.00', color: '#ffd700', desc: 'All 4 suits rank 11+'        },
  { name: 'FOUR OF A KIND',  mult: '×1.00', color: '#a78bfa', desc: 'All 4 suits same rank'       },
  { name: 'STRAIGHT',        mult: '×0.95', color: '#00d4ff', desc: '4 consecutive ranks'         },
  { name: 'THREE OF A KIND', mult: '×0.90', color: '#39d353', desc: '3 suits same rank'           },
  { name: 'TWO PAIR',        mult: '×0.85', color: '#ff9f1c', desc: '2 pairs of matching ranks'   },
  { name: 'ONE PAIR',        mult: '×0.80', color: '#f72585', desc: '2 suits same rank'           },
  { name: 'HIGH CARD',       mult: '×0.75', color: '#6b7280', desc: 'No matching ranks'           },
];

interface PostureExplainerProps {
  onClose: () => void;
}

export function PostureExplainer({ onClose }: PostureExplainerProps) {
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
          🃏 POSTURE SCORING
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dim)' }}
        >
          <XIcon size={12} />
        </button>
      </div>

      <div style={{ fontSize: 10, color: 'var(--dim)', marginBottom: 12 }}>
        Score = (Sum of ranks / 52) × 100 × multiplier
      </div>

      {HANDS.map(h => (
        <div
          key={h.name}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '5px 0',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--fh)',
              fontSize: 10,
              color: h.color,
              width: 120,
            }}
          >
            {h.name}
          </div>
          <div
            style={{
              fontFamily: 'var(--fh)',
              fontSize: 11,
              color: '#ffd700',
              width: 44,
            }}
          >
            {h.mult}
          </div>
          <div style={{ fontSize: 10, color: 'var(--dim)' }}>{h.desc}</div>
        </div>
      ))}

      <div
        style={{
          marginTop: 12,
          fontSize: 10,
          color: 'var(--dim)',
          padding: '8px',
          background: '#0d1117',
          borderRadius: 6,
        }}
      >
        <strong style={{ color: '#ffd700' }}>Note:</strong> Full House is not implemented —
        3+1 matching ranks counts as Three of a Kind.
      </div>
    </div>
  );
}
