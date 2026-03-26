export interface SimulationModeProps {
  mode: 'soc' | 'simulation';
  onModeChange: (mode: 'soc' | 'simulation') => void;
  initialRanks?: Record<string, number>;
}
