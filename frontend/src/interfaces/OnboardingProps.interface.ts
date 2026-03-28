import type { AccountData } from './AccountData.interface';

export interface OnboardingProps {
  onDone: (ranks: Record<string, number>, orgProfile?: Record<string, unknown>, accountData?: AccountData, isTutorial?: boolean) => void;
  videoTransition?: boolean;
}
