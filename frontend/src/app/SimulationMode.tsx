import { useEffect, useState } from 'react';
import SimulationTable from '../simulation/ui/SimulationTable';
import SimulationIntro from '../simulation/ui/SimulationIntro';
import { MusicManager } from '../simulation/audio/MusicManager';

interface SimulationModeProps {
  mode: 'soc' | 'simulation';
  onModeChange: (mode: 'soc' | 'simulation') => void;
  initialRanks?: Record<string, number>;
  isGuest?: boolean;
  isTutorial?: boolean;
}

type Stage = 'intro' | 'campaign';

export default function SimulationMode({ onModeChange, initialRanks, isGuest, isTutorial }: SimulationModeProps) {
  const [stage, setStage] = useState<Stage>('intro');

  useEffect(() => {
    return () => { MusicManager.stop(); };
  }, []);

  if (stage === 'intro') {
    return (
      <SimulationIntro
        onStart={() => setStage('campaign')}
        initialRanks={initialRanks}
      />
    );
  }

  return (
    <SimulationTable
      initialRanks={initialRanks}
      onBack={() => onModeChange('soc')}
    />
  );
}
