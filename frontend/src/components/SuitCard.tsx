import type { SuitCardProps } from '../interfaces/SuitCardProps.interface';
import CardArt from './CardArt';

export default function SuitCard({ suitKey, cfg, rank, active, dimmed, onClick, flipping }: SuitCardProps) {
  const color = cfg.color;

  return (
    <div
      className={`suit-card ${active?"active":""} ${dimmed?"dimmed":""} ${flipping?"flipping":""}`}
      style={{
        borderColor: `${color}${active?"bb":"44"}`,
        background: '#050a10',
        boxShadow: active
          ? `0 0 28px ${color}55, 0 0 56px ${color}22, inset 0 0 24px ${color}08`
          : `0 0 10px ${color}22`,
        color,
        position: 'relative',
        overflow: 'hidden',
      }}
      onClick={onClick}
    >
      {/* SVG card art — full bleed */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <CardArt suitKey={suitKey} color={color} rank={rank} />
      </div>
      {/* Holo shimmer on top */}
      <div className="card-holo" style={{zIndex: 1}}/>
    </div>
  );
}
