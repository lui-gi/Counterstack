import { useState } from 'react';
import { SOCDashboard } from './pages/SOCDashboard';
import { SimulationMode } from './app/SimulationMode';
import type { AccountData } from './interfaces/AccountData.interface';
import { INIT_RANKS } from './data/gameData';

type AppMode = 'soc' | 'simulation';

export default function App() {
  const [onboarded, setOnboarded] = useState(false);
  const [mode, setMode] = useState<AppMode>('soc');
  const [orgProfile, setOrgProfile] = useState<Record<string, unknown> | null>(null);
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [socRanks, setSocRanks] = useState<Record<string, number>>(INIT_RANKS);
  const [isTutorial, setIsTutorial] = useState(false);

  const handleOnboarded = (
    ranks: Record<string, number>,
    profile: Record<string, unknown> | null,
    account: AccountData | null
  ) => {
    setSocRanks(ranks);
    setOrgProfile(profile);
    setAccountData(account);
    setOnboarded(true);

    // Guest mode → go straight to simulation with tutorial
    if (!account) {
      setMode('simulation');
      setIsTutorial(true);
    } else {
      setMode('soc');
    }
  };

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
  };

  if (mode === 'simulation' && onboarded) {
    return (
      <SimulationMode
        initialRanks={socRanks}
        isTutorial={isTutorial}
        onModeChange={handleModeChange}
      />
    );
  }

  return (
    <SOCDashboard
      onboarded={onboarded}
      onOnboarded={handleOnboarded}
      orgProfile={orgProfile}
      accountData={accountData}
      initialRanks={socRanks}
      onModeChange={handleModeChange}
      isTutorial={isTutorial}
    />
  );
}
