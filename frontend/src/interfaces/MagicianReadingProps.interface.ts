import type { AccountData } from './AccountData.interface';

export interface MagicianReadingProps {
  orgProfile: Record<string, unknown>;
  ranks: Record<string, number>;
  accountData: AccountData | null;
  posture: { hand: string; tier: number; score: number; royal: boolean; desc: string };
  onClose: () => void;
}
