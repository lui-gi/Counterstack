import type { AccountData } from './AccountData.interface';

export interface AnalyzeIntroProps {
  onClose: () => void;
  accountData?: AccountData | null;
}
