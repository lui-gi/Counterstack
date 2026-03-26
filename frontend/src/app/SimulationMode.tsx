import { useEffect, useState } from 'react';
import SimulationTable from '../simulation/ui/SimulationTable';
import SimulationIntro from '../simulation/ui/SimulationIntro';
import Dashboard from '../components/shared/Dashboard';
import { useGameLoop } from '../hooks/useGameLoop';
import { MusicManager } from '../simulation/audio/MusicManager';

interface SimulationModeProps {
  mode: 'soc' | 'simulation';
  onModeChange: (mode: 'soc' | 'simulation') => void;
  initialRanks?: Record<string, number>;
  isGuest?: boolean;
  isTutorial?: boolean;
}

// Isolated so useGameLoop only mounts when Posture mode is active
function PostureGame({ onBack }: { onBack: () => void }) {
  const { gameState, onPlayCard, resetGame } = useGameLoop();

  if (gameState.phase === 'game-over') {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-6 font-mono" style={{ background: '#0F172A' }}>
        <span className="text-4xl font-bold text-red-500" style={{ textShadow: '0 0 24px rgba(239,68,68,0.7)' }}>
          GAME OVER
        </span>
        <span className="text-slate-400 text-sm tracking-widest">POSTURE COMPROMISED</span>
        <div className="flex gap-4 mt-4">
          <button
            onClick={resetGame}
            className="px-6 py-2 border border-green-500 text-green-400 text-sm rounded hover:bg-green-500/10 transition-colors"
          >
            RESTART
          </button>
          <button
            onClick={onBack}
            className="px-6 py-2 border border-slate-600 text-slate-400 text-sm rounded hover:bg-slate-700/30 transition-colors"
          >
            EXIT
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen">
      <button
        onClick={onBack}
        className="absolute top-4 right-4 z-50 text-xs font-mono text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500 px-3 py-1 rounded transition-colors"
        style={{ background: 'rgba(15,23,42,0.8)' }}
      >
        ← EXIT
      </button>
      <Dashboard gameState={gameState} onPlayCard={onPlayCard} />
    </div>
  );
}

type Stage = 'intro' | 'pick' | 'campaign' | 'posture';

export default function SimulationMode({ onModeChange, initialRanks, isGuest, isTutorial }: SimulationModeProps) {
  const [stage, setStage] = useState<Stage>('intro');

  useEffect(() => {
    return () => { MusicManager.stop(); };
  }, []);

  if (stage === 'intro') {
    return (
      <SimulationIntro
        onStart={() => setStage('pick')}
        initialRanks={initialRanks}
      />
    );
  }

  if (stage === 'pick') {
    return (
      <div
        className="flex flex-col items-center justify-center h-screen gap-10 font-mono"
        style={{ background: '#0F172A', color: '#CBD5E1' }}
      >
        {/* CRT scanline overlay */}
        <div
          className="pointer-events-none fixed inset-0 z-50"
          style={{
            opacity: 0.03,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.8) 2px, rgba(0,0,0,0.8) 4px)',
          }}
        />

        <div className="flex flex-col items-center gap-2">
          <span className="text-xs tracking-[0.3em] text-slate-500 uppercase">Select Mode</span>
          <span className="text-3xl font-bold tracking-widest" style={{ color: '#10B981', textShadow: '0 0 20px rgba(16,185,129,0.5)' }}>
            SIMULATION
          </span>
        </div>

        <div className="flex gap-6">
          {/* Campaign */}
          <button
            onClick={() => setStage('campaign')}
            className="group flex flex-col items-center gap-3 w-56 px-6 py-8 rounded-xl border border-slate-700 hover:border-blue-500/60 transition-all duration-200 hover:shadow-[0_0_24px_rgba(59,130,246,0.2)]"
            style={{ background: 'rgba(30,41,59,0.5)' }}
          >
            <span className="text-3xl">⚔️</span>
            <span className="text-sm font-bold tracking-widest text-blue-400 group-hover:text-blue-300">CAMPAIGN</span>
            <span className="text-xs text-slate-500 text-center leading-relaxed">
              3-boss battle arena.<br />Fight real-world threats.
            </span>
          </button>

          {/* Posture Simulation */}
          <button
            onClick={() => setStage('posture')}
            className="group flex flex-col items-center gap-3 w-56 px-6 py-8 rounded-xl border border-slate-700 hover:border-green-500/60 transition-all duration-200 hover:shadow-[0_0_24px_rgba(16,185,129,0.2)]"
            style={{ background: 'rgba(30,41,59,0.5)' }}
          >
            <span className="text-3xl">🛡️</span>
            <span className="text-sm font-bold tracking-widest text-green-400 group-hover:text-green-300">POSTURE SIM</span>
            <span className="text-xs text-slate-500 text-center leading-relaxed">
              Card-based posture engine.<br />Defend against live threats.
            </span>
          </button>
        </div>

        <button
          onClick={() => onModeChange('soc')}
          className="text-xs text-slate-600 hover:text-slate-400 tracking-widest transition-colors mt-2"
        >
          ← BACK TO SOC
        </button>
      </div>
    );
  }

  if (stage === 'campaign') {
    return (
      <SimulationTable
        initialRanks={initialRanks}
        onBack={() => onModeChange('soc')}
      />
    );
  }

  return <PostureGame onBack={() => onModeChange('soc')} />;
}
