import { useState } from 'react';
import { SimulationIntro } from '../simulation/ui/SimulationIntro';
import { SimulationTable } from '../simulation/ui/SimulationTable';

interface SimulationModeProps {
  initialRanks: Record<string, number>;
  isTutorial: boolean;
  onModeChange: (mode: 'soc' | 'simulation') => void;
}

export function SimulationMode({ initialRanks, isTutorial, onModeChange }: SimulationModeProps) {
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <SimulationIntro
        initialRanks={initialRanks}
        isTutorial={isTutorial}
        onStart={() => setStarted(true)}
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
