import { SUITS, RANK_NAMES } from '../../data/gameData';
import type { PostureExplainerProps } from '../../interfaces/PostureExplainerProps.interface';

const HAND_MULTIPLIERS: Record<string, { multiplier: number; desc: string }> = {
  "ROYAL FLUSH": { multiplier: 1.00, desc: "All ranks >= 11 (J, Q, K)" },
  "FOUR OF A KIND": { multiplier: 1.00, desc: "4 matching ranks" },
  "STRAIGHT": { multiplier: 0.95, desc: "4 sequential ranks" },
  "THREE OF A KIND": { multiplier: 0.90, desc: "3 matching + 1 different" },
  "TWO PAIR": { multiplier: 0.85, desc: "2 pairs of matching ranks" },
  "ONE PAIR": { multiplier: 0.80, desc: "1 pair + 2 different" },
  "HIGH CARD": { multiplier: 0.75, desc: "No matches or sequences" },
};

export default function PostureExplainer({ ranks, posture, onClose }: PostureExplainerProps) {
  const sum = Object.values(ranks).reduce((a, b) => a + b, 0);
  const baseScore = (sum / 52) * 100;
  const handInfo = HAND_MULTIPLIERS[posture.hand] || { multiplier: 0.75, desc: "Unknown" };

  return (
    <div className="posture-explainer-overlay" onClick={onClose}>
      <div className="posture-explainer-modal" onClick={(e) => e.stopPropagation()}>
        <button className="pe-close" onClick={onClose}>x</button>

        <div className="pe-header">
          <span className={`pe-hand ${posture.royal ? 'royal' : ''}`}>{posture.hand}</span>
          <span className="pe-score">{posture.score}</span>
        </div>

        <div className="pe-desc">{posture.desc}</div>

        <div className="pe-section">
          <div className="pe-section-title">SUIT RANKS</div>
          <div className="pe-suits">
            {Object.entries(SUITS).map(([key, cfg]) => (
              <div key={key} className="pe-suit-row">
                <span className="pe-suit-icon" style={{ color: cfg.color }}>{cfg.sym}</span>
                <span className="pe-suit-name">{cfg.name}</span>
                <span className="pe-suit-rank" style={{ color: cfg.color }}>
                  {RANK_NAMES[ranks[key]]}
                </span>
                <span className="pe-suit-val">({ranks[key]})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pe-section">
          <div className="pe-section-title">FORMULA</div>
          <div className="pe-formula">
            <div className="pe-formula-row">
              <span className="pe-formula-lbl">Sum of Ranks</span>
              <span className="pe-formula-val">{sum}</span>
            </div>
            <div className="pe-formula-row">
              <span className="pe-formula-lbl">Max Possible</span>
              <span className="pe-formula-val">52</span>
            </div>
            <div className="pe-formula-row">
              <span className="pe-formula-lbl">Base Score</span>
              <span className="pe-formula-val">{baseScore.toFixed(1)}</span>
            </div>
            <div className="pe-formula-divider" />
            <div className="pe-formula-row">
              <span className="pe-formula-lbl">Hand Type</span>
              <span className="pe-formula-val">{posture.hand}</span>
            </div>
            <div className="pe-formula-row">
              <span className="pe-formula-lbl">Multiplier</span>
              <span className="pe-formula-val">x{handInfo.multiplier.toFixed(2)}</span>
            </div>
            <div className="pe-formula-row highlight">
              <span className="pe-formula-lbl">Final Score</span>
              <span className="pe-formula-val">{posture.score}</span>
            </div>
          </div>
        </div>

        <div className="pe-section">
          <div className="pe-section-title">WHY THIS HAND?</div>
          <div className="pe-why">{handInfo.desc}</div>
        </div>

        <div className="pe-insight">
          Card values represent <strong>actual security maturity</strong>. The poker hand multiplier
          represents <strong>balance across domains</strong>. A balanced hand extracts full value
          from your security investments.
        </div>
      </div>
    </div>
  );
}
