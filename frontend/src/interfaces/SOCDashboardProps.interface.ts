import type { AccountData } from './AccountData.interface';

export interface SOCDashboardProps {
  onboarded: boolean;
  onOnboarded: (ranks: Record<string, number>, profile: Record<string, unknown> | null, account: AccountData | null) => void;
  orgProfile: Record<string, unknown> | null;
  accountData: AccountData | null;
  initialRanks: Record<string, number>;
  onModeChange: (mode: 'soc' | 'simulation') => void;
  isTutorial: boolean;
}
