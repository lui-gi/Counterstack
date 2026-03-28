import type { AccountData } from './AccountData.interface';

export interface SOCDashboardProps {
  onboarded: boolean;
  onOnboarded: (initialRanks: Record<string, number>, orgProfile?: Record<string, unknown>, accountData?: AccountData) => void;
  mode: 'soc' | 'simulation';
  onModeChange: (mode: 'soc' | 'simulation') => void;
  orgProfile: Record<string, unknown> | null;
  accountData: AccountData | null;
  videoTransition?: boolean;
}
