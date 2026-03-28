// ============================================================
// simulation/ui/ThankYouScreen.tsx
//
// Full-screen thank-you scene shown after all enemies are defeated.
//
// BackgroundCarousel:
//   - Cycles through 4 backgrounds, 2 seconds each
//   - Horizontal slide transition (ease-in-out)
//   - Loops infinitely: 1 → 2 → 3 → 4 → 1 → ...
//
// ThankYouScreen:
//   - Renders on top of the carousel
//   - Shows highlighted "THANK YOU FOR PLAYING / OUR DEMO" text
//   - Spacebar or click → onRestart
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Asset paths ───────────────────────────────────────────────
const BG_IMAGES = [
  '/assets/backgrounds/thankyoubackground1.jpg',
  '/assets/backgrounds/thankyoubackground2.jpg',
  '/assets/backgrounds/thankyoubackground3.png',
  '/assets/backgrounds/thankyoubackground4.png',
];

const SLIDE_DURATION_MS = 2000;  // how long each background is shown
const SLIDE_ANIM_S      = 0.65;  // slide transition duration (seconds)

// ── Background Carousel ───────────────────────────────────────
// Renders 4 backgrounds cycling left with a smooth horizontal slide.
export function BackgroundCarousel() {
  const [index, setIndex] = useState(0);

  // Advance the slide every SLIDE_DURATION_MS ms
  useEffect(() => {
    const t = setInterval(() => {
      setIndex(i => (i + 1) % BG_IMAGES.length);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/*
        AnimatePresence mode="sync" keeps the exiting slide visible while
        the entering slide slides in — no gap / flicker between frames.
      */}
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={index}
          initial={{ x: '100%' }}
          animate={{ x: '0%' }}
          exit={{ x: '-100%' }}
          transition={{ duration: SLIDE_ANIM_S, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${BG_IMAGES[index]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      </AnimatePresence>
    </div>
  );
}

// ── Thank You Screen ──────────────────────────────────────────
interface ThankYouScreenProps {
  onRestart?: () => void;
  onBack?: () => void;
}

export function ThankYouScreen({ onRestart, onBack }: ThankYouScreenProps) {
  // Spacebar or click on the backdrop → restart
  const handleAction = useCallback(() => {
    onRestart?.();
  }, [onRestart]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); handleAction(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleAction]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      style={{ position: 'fixed', inset: 0, zIndex: 520, overflow: 'hidden' }}
    >
      {/* Sliding background carousel */}
      <BackgroundCarousel />

      {/* Dark scrim so text stays readable over any background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.52)',
      }} />

      {/* ── Content layer ── */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 0,
        padding: '0 32px',
        textAlign: 'center',
      }}>

        {/* THANK YOU FOR PLAYING */}
        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.65 }}
          style={{
            fontFamily: 'var(--px-font)',
            fontSize: 26,
            color: '#ffd700',
            // Layered glow: tight gold + wide soft halo + hard drop-shadow
            textShadow: '0 0 18px #ffd700, 0 0 60px #ffd70066, 0 0 100px #ffd70033, 4px 4px 0 #000',
            letterSpacing: 6,
            lineHeight: 1,
          }}
        >
          THANK YOU FOR PLAYING
        </motion.div>

        {/* OUR DEMO — slightly indented to match the visual split requested */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.65 }}
          style={{
            fontFamily: 'var(--px-font)',
            fontSize: 26,
            color: '#ffffff',
            textShadow: '0 0 24px #ffffffbb, 0 0 60px #ffffff44, 4px 4px 0 #000',
            letterSpacing: 16,
            lineHeight: 1,
            marginTop: 14,
            paddingLeft: 16, // visual indent to center "OUR DEMO" under "PLAYING"
          }}
        >
          OUR DEMO
        </motion.div>

        {/* Horizontal rule */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          style={{
            marginTop: 32,
            width: 300,
            height: 1,
            background: 'linear-gradient(90deg, transparent, #ffd70099, #ffffff55, #ffd70099, transparent)',
          }}
        />

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
          style={{ display: 'flex', gap: 14, marginTop: 28 }}
        >
          {/* PLAY AGAIN */}
          <motion.button
            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
            onClick={onRestart}
            style={{
              fontFamily: 'var(--px-font)', fontSize: 9, letterSpacing: 3,
              padding: '12px 36px', cursor: 'pointer',
              background: 'rgba(255,200,40,0.10)',
              border: '2px solid rgba(255,200,40,0.65)',
              color: '#ffd700',
              boxShadow: '4px 4px 0 #000, 0 0 16px rgba(255,200,40,0.2)',
              borderRadius: 2,
            }}
          >
            [ PLAY AGAIN ]
          </motion.button>

          {/* ANALYST MODE — only shown if onBack is provided */}
          {onBack && (
            <motion.button
              whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
              onClick={onBack}
              style={{
                fontFamily: 'var(--px-font)', fontSize: 9, letterSpacing: 2,
                padding: '12px 28px', cursor: 'pointer',
                background: 'rgba(204,136,255,0.08)',
                border: '2px solid rgba(204,136,255,0.5)',
                color: '#cc88ff',
                boxShadow: '4px 4px 0 #000',
                borderRadius: 2,
              }}
            >
              [ ANALYST MODE ]
            </motion.button>
          )}
        </motion.div>

        {/* Pulsing "press space" hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.55, 0] }}
          transition={{ delay: 1.6, duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            marginTop: 20,
            fontFamily: 'var(--px-font)',
            fontSize: 7,
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: 3,
          }}
        >
          PRESS SPACE OR CLICK TO PLAY AGAIN
        </motion.div>

      </div>
    </motion.div>
  );
}
