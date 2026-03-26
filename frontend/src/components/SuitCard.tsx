import { CardArt } from './CardArt';
import type { SuitConfig } from '../interfaces/SuitConfig.interface';

const RANK_NAMES = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

interface SuitCardProps {
  suitKey: string;
  cfg: SuitConfig;
  rank: number;
  active: boolean;
  dimmed: boolean;
  flipping: boolean;
  onClick: () => void;
}

export function SuitCard({ suitKey, cfg, rank, active, dimmed, flipping, onClick }: SuitCardProps) {
  return (
    <div
      className={`suit-card${active ? ' active' : ''}${dimmed ? ' dimmed' : ''}`}
      style={{
        borderColor: active ? cfg.color : `${cfg.color}33`,
        boxShadow: active ? `0 0 20px ${cfg.glow ?? cfg.color}66` : undefined,
        transition: flipping ? 'transform 0.3s' : undefined,
        transform: flipping ? 'rotateY(90deg)' : undefined,
      }}
      onClick={onClick}
    >
      <CardArt suit={suitKey} rank={rank} color={cfg.color} />
      {/* Hologram shimmer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 8,
          background: `linear-gradient(135deg, ${cfg.color}08 0%, transparent 50%, ${cfg.color}05 100%)`,
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <div className="rank" style={{ color: cfg.color }}>
          {RANK_NAMES[rank]}
        </div>
        <div className="sym" style={{ color: cfg.color }}>
          {cfg.sym}
        </div>
      </div>
    </div>
  );
}
