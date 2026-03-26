import { useState } from 'react';
import SOCDashboard from './pages/SOCDashboard';
import SimulationMode from './app/SimulationMode';
import type { AccountData } from './interfaces';

export default function App() {
  const [onboarded, setOnboarded] = useState(false);
  const [mode, setMode] = useState<'soc' | 'simulation'>('soc');
  const [orgProfile, setOrgProfile] = useState<Record<string, unknown> | null>(null);
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [socRanks, setSocRanks] = useState<Record<string, number>>({});
  const [isTutorial, setIsTutorial] = useState(false);

  const handleOnboarded = (
    initialRanks: Record<string, number>,
    profile?: Record<string, unknown>,
    account?: AccountData,
    tutorial?: boolean
  ) => {
    setOnboarded(true);
    setSocRanks(initialRanks);
    if (profile) setOrgProfile(profile);
    if (tutorial) setIsTutorial(true);
    if (account) {
      setAccountData(account);
    } else {
      setMode('simulation');
    }
  };

  if (!onboarded || mode === 'soc') {
    return (
      <SOCDashboard
        onboarded={onboarded}
        onOnboarded={handleOnboarded}
        mode={mode}
        onModeChange={setMode}
        orgProfile={orgProfile}
        accountData={accountData}
      />
    );
  }

  return (
    <SimulationMode
      mode={mode}
      onModeChange={setMode}
      initialRanks={socRanks}
      isGuest={!accountData}
      isTutorial={isTutorial}
    />
  );
}
