import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

type Stage = 'intro' | 'cutscene' | 'campaign';

// ── Boss intro cutscene ────────────────────────────────────────────
function CampaignCutscene({ onDone }: { onDone: () => void }) {
  const [showSub, setShowSub] = useState(false);
  const [showThreat, setShowThreat] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowThreat(true), 300);
    const t2 = setTimeout(() => setShowSub(true), 800);
    const t3 = setTimeout(onDone, 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 800,
        background: '#000',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,0,0,0.04) 3px, rgba(255,0,0,0.04) 4px)',
      }} />

      {/* Red radial pulse */}
      <motion.div
        animate={{ opacity: [0, 0.18, 0, 0.12, 0] }}
        transition={{ duration: 2.2, times: [0, 0.2, 0.5, 0.7, 1] }}
        style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(220,30,30,0.6) 0%, transparent 70%)',
        }}
      />

      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
        {/* THREAT ENCOUNTERED — glitches in */}
        <AnimatePresence>
          {showThreat && (
            <motion.div
              initial={{ opacity: 0, scaleX: 1.08, filter: 'blur(6px)' }}
              animate={{ opacity: 1, scaleX: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                animate={{ x: [0, -3, 3, -2, 1, 0], opacity: [1, 0.85, 1, 0.9, 1] }}
                transition={{ duration: 0.6, delay: 0.1, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }}
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 28,
                  letterSpacing: 6,
                  color: '#ff2233',
                  textShadow: '0 0 24px rgba(255,34,51,0.9), 0 0 60px rgba(255,34,51,0.4), 3px 0 0 rgba(0,255,255,0.25), -3px 0 0 rgba(255,0,100,0.25)',
                  textTransform: 'uppercase',
                  lineHeight: 1.2,
                }}
              >
                THREAT ENCOUNTERED
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CAMPAIGN MODE — fades in below */}
        <AnimatePresence>
          {showSub && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 11,
                letterSpacing: 5,
                textTransform: 'uppercase',
                marginTop: 18,
              }}
            >
              <span style={{ color: 'rgba(255,80,80,0.7)', textShadow: '0 0 12px rgba(255,34,51,0.5)' }}>
                CAMPAIGN MODE:{' '}
              </span>
              <span style={{ color: '#ff2233', textShadow: '0 0 18px rgba(255,34,51,0.95), 0 0 40px rgba(255,34,51,0.5)' }}>
                ZERO-DAY ECLIPSE
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Threat level bar — flashes red */}
        <AnimatePresence>
          {showSub && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: [0, 1, 0.6, 1], scaleX: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
              style={{
                margin: '28px auto 0',
                height: 3,
                width: 280,
                background: 'linear-gradient(90deg, transparent, #ff2233, #ff6644, #ff2233, transparent)',
                boxShadow: '0 0 12px rgba(255,34,51,0.8)',
                transformOrigin: 'center',
              }}
            />
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────
export default function SimulationMode({ onModeChange, initialRanks, isGuest, isTutorial }: SimulationModeProps) {
  const [stage, setStage] = useState<Stage>('intro');

  useEffect(() => {
    return () => { MusicManager.stop(); };
  }, []);

  if (stage === 'intro') {
    return (
      <SimulationIntro
        onStart={() => setStage('cutscene')}
        initialRanks={initialRanks}
      />
    );
  }

  if (stage === 'cutscene') {
    return (
      <AnimatePresence>
        <CampaignCutscene onDone={() => setStage('campaign')} />
      </AnimatePresence>
    );
  }

  return (
    <SimulationTable
      initialRanks={initialRanks}
      onBack={() => onModeChange('soc')}
    />
  );
}
