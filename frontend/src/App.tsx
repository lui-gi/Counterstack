import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import SOCDashboard from './pages/SOCDashboard';
import SimulationMode from './app/SimulationMode';
import type { AccountData } from './interfaces';

// Stop the video after this many seconds (adjust to taste)
const VIDEO_DURATION_S = 1.4;

function VideoSplash({ onDone }: { onDone: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fading, setFading] = useState(false);
  const [visible, setVisible] = useState(false);
  const didEnd = useRef(false);

  const finish = useCallback(() => {
    if (didEnd.current) return;
    didEnd.current = true;
    setFading(true);
    setTimeout(onDone, 800);
  }, [onDone]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(finish);

    const onPlay = () => setVisible(true);
    video.addEventListener('play', onPlay);

    const onTimeUpdate = () => {
      if (video.currentTime >= VIDEO_DURATION_S) finish();
    };
    video.addEventListener('timeupdate', onTimeUpdate);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [finish]);

  return createPortal(
    <motion.div
      animate={{ opacity: fading ? 0 : 1 }}
      transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
      style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#000' }}
    >
      <motion.div
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
        style={{ width: '100%', height: '100%' }}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          onEnded={finish}
          onError={finish}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        >
          <source src="/assets/video/IntroFloatingCards.mp4" type="video/mp4" onError={finish} />
        </video>
      </motion.div>
      {/* Cover the Veo watermark */}
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 140, height: 70, background: '#000' }} />
    </motion.div>,
    document.body
  );
}

// App flow:
//  1. VideoSplash  — plays once on load
//  2. SimulationIntro — cards shuffle + COUNTERSTACK title + Joker
//  3. Normal app  — SOCDashboard (onboarding) or SimulationMode (game)

export default function App() {
  const [videoDone, setVideoDone]   = useState(false);
  const [onboarded, setOnboarded]   = useState(false);
  const [mode, setMode]             = useState<'soc' | 'simulation'>('soc');
  const [orgProfile, setOrgProfile] = useState<Record<string, unknown> | null>(null);
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [socRanks, setSocRanks]     = useState<Record<string, number>>({});
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

  // Step 1: video splash (portal — renders on top of everything)
  return (
    <>
      {/* Video plays first via portal, then unmounts */}
      {!videoDone && <VideoSplash onDone={() => setVideoDone(true)} />}

      {/* Only mount the app after the video is fully done so the
          Onboarding card-shuffle animation starts at the right time */}
      {videoDone && (
        (!onboarded || mode === 'soc') ? (
          <SOCDashboard
            onboarded={onboarded}
            onOnboarded={handleOnboarded}
            mode={mode}
            onModeChange={setMode}
            orgProfile={orgProfile}
            accountData={accountData}
          />
        ) : (
          <SimulationMode
            mode={mode}
            onModeChange={setMode}
            initialRanks={socRanks}
            isGuest={!accountData}
            isTutorial={isTutorial}
          />
        )
      )}
    </>
  );
}
