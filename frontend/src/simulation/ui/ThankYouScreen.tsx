// ============================================================
// simulation/ui/ThankYouScreen.tsx
//
// Full-screen slide-show shown after all enemies are defeated.
// 4 slides, each synced to a background image. Auto-advances
// every SLIDE_DURATION_MS. Space / click → advance or restart.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Asset paths ───────────────────────────────────────────────
const BG_IMAGES = [
  '/assets/backgrounds/thankyoubackground1.jpg',
  '/assets/backgrounds/thankyoubackground2.jpg',
  '/assets/backgrounds/thankyoubackground3.png',
  '/assets/backgrounds/thankyoubackground4.png',
];

const SLIDE_DURATION_MS = 4000;   // how long each slide is shown
const SLIDE_ANIM_S      = 0.7;    // slide transition (seconds)
const TOTAL_SLIDES      = 4;

// ── Slide definitions ─────────────────────────────────────────
interface SlideData {
  eyebrow?: string;
  headline: string;
  sub?: string;
  accent?: string;           // colour for headline glow/text
  showButtons?: boolean;
}

const SLIDES: SlideData[] = [
  {
    eyebrow:  '— MISSION COMPLETE —',
    headline: 'THANK YOU\nFOR PLAYING',
    sub:      'OUR DEMO',
    accent:   '#ffd700',
  },
  {
    eyebrow:  '— THE FIGHT CONTINUES —',
    headline: 'LOOK FORWARD\nTO MORE',
    sub:      'CAMPAIGNS',
    accent:   '#5ef0ff',
  },
  {
    eyebrow:  '— YOUR LEGACY —',
    headline: 'YOUR STRATEGY\nMADE THE',
    sub:      'DIFFERENCE',
    accent:   '#ff6e6e',
  },
  {
    eyebrow:  '— STAY TUNED —',
    headline: 'MORE IS\nCOMING',
    sub:      undefined,
    accent:   '#b8ff6e',
    showButtons: true,
  },
];

// ── Utility: easing ───────────────────────────────────────────
const ease = [0.22, 1, 0.36, 1] as const;

// ── Background layer ──────────────────────────────────────────
function SlideBackground({ index }: { index: number }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={index}
          initial={{ x: '100%', scale: 1.04 }}
          animate={{ x: '0%',   scale: 1    }}
          exit={{    x: '-100%', scale: 1.04 }}
          transition={{ duration: SLIDE_ANIM_S, ease }}
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${BG_IMAGES[index]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      </AnimatePresence>

      {/* Cinematic vignette + scrim */}
      <div style={{
        position: 'absolute', inset: 0,
        background: [
          'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.65) 100%)',
          'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.55) 100%)',
        ].join(', '),
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────
function ProgressBar({
  current,
  total,
  elapsed,
  duration,
  accent,
}: {
  current: number;
  total: number;
  elapsed: number;
  duration: number;
  accent: string;
}) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 36,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: 8,
      alignItems: 'center',
    }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'relative',
            width: i === current ? 56 : 28,
            height: 3,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.18)',
            overflow: 'hidden',
            transition: 'width 0.4s ease, background 0.4s ease',
          }}
        >
          {/* filled portion */}
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              background: i < current
                ? 'rgba(255,255,255,0.7)'
                : i === current
                ? accent
                : 'transparent',
              transformOrigin: 'left center',
              scaleX: i < current ? 1 : i === current ? elapsed / duration : 0,
            }}
            animate={{ scaleX: i < current ? 1 : i === current ? elapsed / duration : 0 }}
            transition={{ duration: 0.05, ease: 'linear' }}
          />
        </div>
      ))}
    </div>
  );
}

// ── Slide content ─────────────────────────────────────────────
function SlideContent({
  slide,
  onRestart,
  onBack,
}: {
  slide: SlideData;
  onRestart?: () => void;
  onBack?: () => void;
}) {
  const lines = slide.headline.split('\n');
  const accent = slide.accent ?? '#ffd700';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={slide.headline}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{    opacity: 0, y: -18 }}
        transition={{ duration: 0.55, ease }}
        style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 0,
          textAlign: 'center',
          padding: '0 32px',
        }}
      >
        {/* Eyebrow */}
        {slide.eyebrow && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 0.55, y: 0 }}
            transition={{ delay: 0.12, duration: 0.5 }}
            style={{
              fontFamily: 'var(--px-font)',
              fontSize: 8,
              color: 'rgba(255,255,255,0.55)',
              letterSpacing: '0.4em',
              marginBottom: 20,
            }}
          >
            {slide.eyebrow}
          </motion.div>
        )}

        {/* Headline lines */}
        {lines.map((line, li) => (
          <motion.div
            key={li}
            initial={{ opacity: 0, y: li === 0 ? -12 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + li * 0.14, duration: 0.55, ease }}
            style={{
              fontFamily: 'var(--px-font)',
              fontSize: 'clamp(22px, 3.8vw, 38px)',
              color: accent,
              textShadow: `0 0 20px ${accent}bb, 0 0 60px ${accent}44, 3px 3px 0 #000`,
              letterSpacing: '0.22em',
              lineHeight: 1.15,
              marginTop: li === 0 ? 0 : 6,
            }}
          >
            {line}
          </motion.div>
        ))}

        {/* Sub-line */}
        {slide.sub && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48, duration: 0.55, ease }}
            style={{
              fontFamily: 'var(--px-font)',
              fontSize: 'clamp(22px, 3.8vw, 38px)',
              color: '#fff',
              textShadow: '0 0 24px rgba(255,255,255,0.7), 3px 3px 0 #000',
              letterSpacing: '0.55em',
              lineHeight: 1,
              marginTop: 10,
            }}
          >
            {slide.sub}
          </motion.div>
        )}

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5, ease }}
          style={{
            marginTop: 28,
            width: 220,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${accent}88, #ffffff44, ${accent}88, transparent)`,
          }}
        />

        {/* Buttons (last slide only) */}
        {slide.showButtons && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.5 }}
            style={{ display: 'flex', gap: 14, marginTop: 30 }}
          >
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.93 }}
              onClick={onRestart}
              style={{
                fontFamily: 'var(--px-font)', fontSize: 9, letterSpacing: 3,
                padding: '12px 34px', cursor: 'pointer',
                background: 'rgba(255,200,40,0.10)',
                border: '2px solid rgba(255,200,40,0.65)',
                color: '#ffd700',
                boxShadow: '4px 4px 0 #000, 0 0 16px rgba(255,200,40,0.18)',
                borderRadius: 2,
              }}
            >
              [ PLAY AGAIN ]
            </motion.button>

            {onBack && (
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.93 }}
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
        )}

        {/* Advance hint (non-button slides) */}
        {!slide.showButtons && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ delay: 1.4, duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              marginTop: 26,
              fontFamily: 'var(--px-font)',
              fontSize: 7,
              color: 'rgba(255,255,255,0.45)',
              letterSpacing: '0.35em',
            }}
          >
            PRESS SPACE OR CLICK TO CONTINUE
          </motion.div>
        )}

      </motion.div>
    </AnimatePresence>
  );
}

// ── Main export ────────────────────────────────────────────────
interface ThankYouScreenProps {
  onRestart?: () => void;
  onBack?: () => void;
}

export function ThankYouScreen({ onRestart, onBack }: ThankYouScreenProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [elapsed, setElapsed]       = useState(0);
  const startRef = useRef(Date.now());
  const rafRef   = useRef<number>(0);

  const advance = useCallback(() => {
    setSlideIndex(i => {
      const next = i + 1;
      // Stop at the last slide — only the buttons can exit from here
      if (next >= TOTAL_SLIDES) return i;
      return next;
    });
    startRef.current = Date.now();
    setElapsed(0);
  }, []);

  // rAF ticker for smooth progress bar
  useEffect(() => {
    const tick = () => {
      const dt = Date.now() - startRef.current;
      setElapsed(Math.min(dt, SLIDE_DURATION_MS));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Auto-advance — stops on the last slide so buttons are required to exit
  useEffect(() => {
    startRef.current = Date.now();
    setElapsed(0);
    if (slideIndex >= TOTAL_SLIDES - 1) return; // hold on last slide
    const t = setTimeout(advance, SLIDE_DURATION_MS);
    return () => clearTimeout(t);
  }, [slideIndex, advance]);

  // Keyboard — Space only advances through non-final slides
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (slideIndex < TOTAL_SLIDES - 1) advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, slideIndex]);

  const slide = SLIDES[slideIndex];
  const isLastSlide = slideIndex >= TOTAL_SLIDES - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.9 }}
      onClick={isLastSlide ? undefined : advance}
      style={{
        position: 'fixed', inset: 0, zIndex: 520,
        overflow: 'hidden',
        cursor: isLastSlide ? 'default' : 'pointer',
      }}
    >
      {/* Backgrounds */}
      <SlideBackground index={slideIndex} />

      {/* Centered content */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <SlideContent
          slide={slide}
          onRestart={onRestart}
          onBack={onBack}
        />
      </div>

      {/* Progress indicator */}
      <ProgressBar
        current={slideIndex}
        total={TOTAL_SLIDES}
        elapsed={elapsed}
        duration={SLIDE_DURATION_MS}
        accent={slide.accent ?? '#ffd700'}
      />

      {/* Slide counter */}
      <div style={{
        position: 'absolute',
        top: 24, right: 28,
        fontFamily: 'var(--px-font)',
        fontSize: 7,
        color: 'rgba(255,255,255,0.35)',
        letterSpacing: '0.3em',
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        {String(slideIndex + 1).padStart(2, '0')} / {String(TOTAL_SLIDES).padStart(2, '0')}
      </div>
    </motion.div>
  );
}

// ── Re-export for legacy imports ───────────────────────────────
export function BackgroundCarousel() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % BG_IMAGES.length), 2000);
    return () => clearInterval(t);
  }, []);
  return <SlideBackground index={index} />;
}
