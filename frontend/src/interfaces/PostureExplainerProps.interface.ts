export interface PostureExplainerProps {
  ranks: Record<string, number>;
  posture: {
    hand: string;
    tier: number;
    score: number;
    royal: boolean;
    desc: string;
  };
  onClose: () => void;
}
