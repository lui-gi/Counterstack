// ============================================================
// simulation/ui/SimulationTable.tsx
// Open 8-bit casino battle arena — no panels, no boxes.
// Characters stand tall in the background.
// Real playing cards at the bottom with number-picker tabs.
// Phase prompt lives TOP LEFT only after battle starts.
// Audio: main-ui → system-patch → wesker7mins+weskertheme → ai-adapter
// ============================================================

import React, {
  createContext, useContext, useCallback,
  useEffect, useRef, useState,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { computePosture } from '../../engine/computePosture';
import {
  useCampaign,
  suitSym, suitColor, rankDisplay, rankValue, manaCost,
  FIXED_HAND_RANKS,
  type CampaignState, type CampaignLogEntry, type Suit,
} from '../gameplay/useCampaign';
import MagicianSprite  from './MagicianSprite';
import CardArt         from '../../components/CardArt';
import { MusicManager } from '../audio/MusicManager';
import { SfxPlayer, SFX, CARD_SFX } from '../audio/SfxPlayer';
import { ThankYouScreen } from './ThankYouScreen';
import './pixel.css';

// ── Tutorial ──────────────────────────────────────────────
type TutorialHighlight = 'cards' | 'intel' | 'boss' | 'full' | null;

const TUTORIAL_STEPS: Array<{
  icon: string;
  title: string;
  highlight: TutorialHighlight;
  body?: string;
  lines?: Array<{ sym: string; color: string; label: string; desc: string }>;
  tips?: string[];
}> = [
  {
    icon: '🃏',
    title: 'WELCOME TO SIMULATION MODE',
    highlight: 'full',
    body: `CounterStack Simulation Mode is a tabletop cybersecurity exercise modeled after real SOC incident response. You face an active threat built around a real-world attack vector. Deploy security countermeasures as cards each turn to neutralize it before it compromises your systems.\n\nYour posture score from onboarding determines the strength of your starting hand. Higher-ranked suits mean stronger cards in that security domain. This is not just a game — it's a drill.`,
  },
  {
    icon: '♠♣♦♥',
    title: 'THE FOUR SUITS',
    highlight: 'cards',
    lines: [
      { sym: '♠', color: '#4da6ff',  label: 'OFFENSIVE',  desc: 'Deploy attacks to damage the active threat. High-rank cards hit harder but cost mana.' },
      { sym: '♣', color: '#33dd77',  label: 'RESOURCE',   desc: 'Restore your mana pool. Always free to play. Keep resources flowing.' },
      { sym: '♦', color: '#cc88ff',  label: 'HARDEN',     desc: 'Build armor stacks that absorb incoming damage. Costs mana but pays off under pressure.' },
      { sym: '♥', color: '#ff4455',  label: 'RESILIENCE', desc: "Recover HP. Higher ranks restore more health. Don't wait until critical." },
    ],
  },
  {
    icon: '♠',
    title: 'SELECTING A CARD',
    highlight: null,
    body: 'Click the OFFENSIVE card to open its selection menu. Each suit has multiple rank options — higher rank means a stronger effect but usually a higher mana cost. Click a row to play that card immediately and trigger the action.',
  },
  {
    icon: '⚡',
    title: 'READING CARD VALUES — OFFENSIVE',
    highlight: null,
    lines: [
      { sym: '⚡', color: '#4da6ff', label: 'DAMAGE VALUE',   desc: 'The number next to ⚡ is how much damage you deal to the threat this turn. Higher rank = more damage.' },
      { sym: '💧', color: '#4da6ff', label: 'MANA COST',      desc: 'The number next to 💧 is how much mana this card costs to play. If you can\'t afford it, the card is locked.' },
      { sym: '#',  color: '#ffd700', label: 'CARD RANK',       desc: 'The left number is the card\'s rank — cards are ordered by increasing severity and power. Higher rank cards represent more advanced, impactful security actions.' },
      { sym: '📋', color: '#cc88ff', label: 'CARD DESCRIPTION', desc: 'Each description maps to a real cybersecurity function — from threat hunting to vulnerability patching. Read it to understand what control you\'re applying.' },
    ],
  },
  {
    icon: '📡',
    title: 'INTEL PANEL',
    highlight: 'intel',
    lines: [
      { sym: '★', color: '#cc88ff', label: 'MISSION BRIEF', desc: 'Boss objectives, special mechanics, and win conditions.' },
      { sym: '◈', color: '#ffa844', label: 'THREAT INTEL',  desc: 'Live boss stats, battle log, and CVE reference data.' },
      { sym: '⟳', color: '#33dd77', label: 'AI ANALYSIS',   desc: 'Real-time tactical recommendations based on your current HP, mana, and boss state.' },
    ],
  },
  {
    icon: '⚡',
    title: 'TIPS FOR SURVIVAL',
    highlight: 'full',
    tips: [
      'RESOURCE cards are always free — never let mana run dry.',
      'High-rank OFFENSIVE cards hit hard but drain mana fast.',
      'Stack armor (HARDEN) before a tough boss turn.',
      'Use AI ANALYSIS when unsure which suit to play next.',
      'A good poker hand across your suits triggers JACKPOT bonus damage.',
    ],
  },
];

// ── Asset paths ───────────────────────────────────────────
const WESKER_IMG               = '/assets/sprites/wesker.png';
const WESKER_FALLBACK          = '/assets/sprites/0C9FD310-B1BA-44F0-A4CD-750793CA35C6.png';
const AI_ADAPTER_IMG           = '/assets/sprites/aiadapter.png';
const AI_ADAPTER_FALLBACK      = '/assets/sprites/C0C94271-FAB8-44EA-985C-CB472E57708D.png';
const AI_ADAPTER_TRANSFORM_IMG = '/assets/sprites/aiadaptertransformimage.png';
const SYSTEM_PATCH_IMG         = '/assets/sprites/systempatch-new.png';
const BG_IN_GAME               = '/assets/sprites/backgroundingame.png';
const SIM_BG                   = '/assets/sprites/SimulationBackground.jpg';
const WESKER_BG                = '/assets/backgrounds/ResidentEvilBackground2.jpg';
const JACKPOT_VIDEO            = '/assets/video/jackpot.mp4';
const JACKPOT_ICON             = '/assets/sprites/jackpoticon.png';

// ── Campaign Context ──────────────────────────────────────
interface CampaignCtxValue {
  state:           CampaignState;
  continueIntro:   () => void;
  drawCard:        () => void;
  drawSuit:        (suit: Suit) => void;
  selectCard:      (id: string) => void;
  advance:         () => void;
  triggerJackpot:  () => void;
  restart:         () => void;
  weskerTimeLeft:  number;   // seconds remaining (0 when not a Wesker fight)
  onBack?:         () => void;
}

const CampaignCtx = createContext<CampaignCtxValue | null>(null);

// ── Tutorial Context ───────────────────────────────────────
interface TutorialCtxValue { step: number; open: boolean; advance: () => void; }
const TutorialCtx = createContext<TutorialCtxValue>({ step: -1, open: false, advance: () => {} });

export function useCampaignContext(): CampaignCtxValue {
  const ctx = useContext(CampaignCtx);
  if (!ctx) throw new Error('useCampaignContext: must be inside SimulationTable');
  return ctx;
}

export function useSimContext(): never {
  throw new Error('useSimContext: old context no longer active');
}

// ── Typewriter ───────────────────────────────────────────
function Typewriter({ text, speed = 34 }: { text: string; speed?: number }) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    setShown('');
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return <>{shown}<motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>█</motion.span></>;
}

// ── Playing Card component ────────────────────────────────
interface PlayingCardProps {
  suit: Suit;
  rank: number;
  size?: number;
  onClick?: () => void;
  glow?: boolean;
  disabled?: boolean;
  selected?: boolean;
  constrainHover?: boolean;
  flash?: boolean;
}

// Map simulation suit keys → CardArt SOC suit keys
const SIM_TO_SOC: Record<string, string> = {
  clubs: 'clover', spades: 'spade', diamonds: 'diamond', hearts: 'heart',
};

function PlayingCard({ suit, rank, size = 1, onClick, glow, disabled, selected, constrainHover, flash }: PlayingCardProps) {
  const color  = suitColor(suit);
  const socKey = SIM_TO_SOC[suit] ?? suit;
  const w = 80 * size;
  const h = 112 * size;

  return (
    <motion.button
      whileHover={disabled ? undefined : flash ? { y: -5 } : constrainHover ? { y: -4, scale: 1.04 } : { y: -14 * size, scale: 1.08 }}
      whileTap={disabled   ? undefined : { scale: 0.93 }}
      animate={
        flash
          ? { scale: [1, 1.025, 1], y: 0 }
          : selected
            ? { y: -18 * size, scale: 1.1 }
            : { y: 0, scale: 1 }
      }
      transition={flash ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : undefined}
      onClick={disabled ? undefined : onClick}
      style={{
        position: 'relative',
        width: w, height: h,
        background: '#050a10',
        border: flash
            ? `2px solid #4da6ff`
            : selected
              ? `3px solid ${color}`
              : glow
                ? `2px solid ${color}`
                : disabled
                  ? '2px solid rgba(255,255,255,0.08)'
                  : `1px solid ${color}44`,
        borderRadius: 8 * size,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: flash
          ? `0 0 18px #4da6ffbb, 0 0 44px #4da6ff55, 4px 4px 0 #000`
          : selected
            ? `0 0 0 2px ${color}55, 6px 6px 0 #000, 0 0 28px ${color}99, 0 0 56px ${color}44`
            : glow
              ? `4px 4px 0 #000, 0 0 18px ${color}88, 0 0 36px ${color}44`
              : '4px 4px 0 #000',
        opacity: disabled ? 0.35 : 1,
        overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.2s, opacity 0.2s',
        flexShrink: 0,
        padding: 0,
      }}
    >
      {/* CardArt SVG fills the face */}
      {!disabled && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <CardArt suitKey={socKey} color={color} rank={rank} />
        </div>
      )}

      {/* Card back pattern (when disabled) */}
      {disabled && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `repeating-linear-gradient(
            45deg,
            rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 2px,
            transparent 2px, transparent 8px
          )`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Glow tint overlay */}
      {(glow || selected) && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse, ${color}22, transparent 70%)`,
          pointerEvents: 'none',
        }} />
      )}
    </motion.button>
  );
}

// ── System Patch CSS boss sprite ──────────────────────────
function SystemPatchBoss() {
  const [imgFailed, setImgFailed] = useState(false);

  if (!imgFailed) {
    return (
      <div style={{ width: 260, height: 380, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.img
          src={SYSTEM_PATCH_IMG}
          onError={() => setImgFailed(true)}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            height: 320,
            width: 'auto',
            imageRendering: 'pixelated',
            mixBlendMode: 'screen',
            filter: 'brightness(1.2) contrast(1.15) drop-shadow(0 0 32px rgba(51,221,119,0.55))',
            objectFit: 'contain',
          }}
        />
      </div>
    );
  }

  // CSS fallback when systempatch.png is not yet available
  return (
    <div style={{ width: 260, height: 380, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer glitch ring */}
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute', inset: 30,
          border: '3px solid #33dd77',
          borderStyle: 'dashed',
          borderRadius: '50%',
          boxShadow: '0 0 14px #33dd7755',
          opacity: 0.8,
        }}
      />
      <motion.div
        animate={{ rotate: [360, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute', inset: 55,
          border: '2px solid #4da6ff',
          borderRadius: '50%',
          boxShadow: '0 0 10px #4da6ff55',
          opacity: 0.6,
        }}
      />
      {/* Core shield */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], filter: ['drop-shadow(0 0 10px #33dd77)', 'drop-shadow(0 0 32px #33dd77)', 'drop-shadow(0 0 10px #33dd77)'] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ fontSize: 110, position: 'relative', zIndex: 1 }}
      >
        🛡️
      </motion.div>
      {/* Glitch bars */}
      {[0, 1, 2, 3].map(i => (
        <motion.div
          key={i}
          animate={{ x: [0, i % 2 === 0 ? 8 : -8, 0], opacity: [0, 0.9, 0] }}
          transition={{ duration: 0.15, repeat: Infinity, delay: i * 0.4, repeatDelay: 2.5 }}
          style={{
            position: 'absolute',
            top: `${25 + i * 16}%`,
            left: 0, right: 0,
            height: 4,
            background: '#33dd77',
            opacity: 0,
            mixBlendMode: 'screen',
          }}
        />
      ))}
    </div>
  );
}

// ── Boss sprite selector ──────────────────────────────────
function BossSprite({ bossIndex, adapting }: { bossIndex: number; adapting?: boolean }) {
  const [fallback, setFallback] = useState(false);
  if (bossIndex === 0) return <SystemPatchBoss />;

  const primary   = bossIndex === 1 ? WESKER_IMG      : AI_ADAPTER_IMG;
  const backup    = bossIndex === 1 ? WESKER_FALLBACK : AI_ADAPTER_FALLBACK;
  const glowColor = bossIndex === 1 ? 'rgba(180,40,40,0.5)' : 'rgba(40,200,220,0.45)';
  const spriteHeight = bossIndex === 1 ? 280 : 400;

  const sprite = (
    <motion.img
      src={fallback ? backup : primary}
      onError={() => setFallback(true)}
      animate={adapting && bossIndex === 2 ? { y: 0 } : { y: [0, -10, 0] }}
      transition={adapting && bossIndex === 2
        ? { duration: 0 }
        : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
      }
      style={{
        height: spriteHeight,
        width: 'auto',
        imageRendering: 'pixelated',
        mixBlendMode: 'screen',
        objectFit: 'contain',
        animation: adapting && bossIndex === 2 ? 'rainbowHue 0.4s linear infinite' : undefined,
        filter: adapting && bossIndex === 2
          ? 'brightness(1.5) saturate(3) contrast(1.2)'
          : `brightness(1.2) contrast(1.15) drop-shadow(0 0 32px ${glowColor})`,
      }}
    />
  );

  if (bossIndex === 1) {
    const CROP = 70; // px to remove from top of wesker sprite (chess knight artifact)
    return (
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {/* Crimson radial aura */}
        <div style={{
          position: 'absolute',
          width: 260, height: 260,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(220,30,30,0.22) 0%, rgba(180,10,10,0.12) 45%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <img
          src={fallback ? backup : primary}
          onError={() => setFallback(true)}
          style={{
            height: spriteHeight,
            width: 'auto',
            imageRendering: 'pixelated',
            mixBlendMode: 'screen',
            objectFit: 'contain',
            clipPath: `inset(${CROP}px 0 0 0)`,
            filter: `brightness(1.2) contrast(1.15)`,
          }}
        />
      </motion.div>
    );
  }

  return sprite;
}

// ── Decorative slot machines ──────────────────────────────
export function SlotMachineCSS({ flip }: { flip?: boolean }) {
  return (
    <div style={{
      width: 80, height: 130,
      transform: flip ? 'scaleX(-1)' : undefined,
      position: 'relative',
      background: 'linear-gradient(180deg, #2a1a3a, #1a0e28)',
      border: '2px solid rgba(255,200,80,0.35)',
      borderRadius: 10,
      boxShadow: '3px 4px 0 #000, 0 0 10px rgba(255,180,40,0.1)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      gap: 4, padding: 8,
    }}>
      <div style={{
        width: '100%', height: 46,
        background: '#050810',
        border: '2px solid rgba(80,180,255,0.5)',
        borderRadius: 4,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 3,
      }}>
        {['🍋', '🍒', '⭐'].map((sym, i) => (
          <motion.span
            key={i}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.6 + i * 0.2, repeat: Infinity, delay: i * 0.15, repeatDelay: 3 }}
            style={{ fontSize: 11 }}
          >
            {sym}
          </motion.span>
        ))}
      </div>
      <div style={{ fontFamily: 'var(--px-font)', fontSize: 5, color: '#ffd700', letterSpacing: 1 }}>LUCKY★7</div>
      <motion.div
        animate={{ rotate: [0, -22, 0] }}
        transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 4 }}
        style={{
          position: 'absolute', right: -11, top: 22,
          width: 7, height: 32,
          background: 'linear-gradient(#ffd700, #c09000)',
          borderRadius: 3,
          boxShadow: '1px 1px 0 #000',
          transformOrigin: 'top center',
        }}
      />
      <div style={{
        width: 16, height: 5,
        background: '#000',
        border: '1px solid rgba(255,200,80,0.5)',
        borderRadius: 2, marginTop: 2,
      }} />
    </div>
  );
}

// ── Jackpot cinematic ────────────────────────────────────
const REEL_SYMS  = ['♠', '7', '♣', '★', '♦', '7', '♥', '7', '★', '7', '♠', '♣'];
const ROW_H      = 64;  // px per reel row — 3 rows visible = 192px window
// Symbols shown above/below the center 7 when a reel stops (gives a realistic 3-row look)
const REEL_ABOVE = ['♣', '★', '♠'];
const REEL_BELOW = ['♦', '♥', '♣'];
// Pre-computed flame wisp positions for the Getsuga beam (avoids Math.random in JSX)
const GETSUGA_FLAMES: Array<{ x: string; h: number; d: number; dl: number }> = [
  { x: '2%',  h: 13, d: 0.30, dl: 0.00 }, { x: '7%',  h: 22, d: 0.25, dl: 0.06 },
  { x: '13%', h: 15, d: 0.35, dl: 0.03 }, { x: '19%', h: 28, d: 0.22, dl: 0.09 },
  { x: '25%', h: 17, d: 0.32, dl: 0.01 }, { x: '31%', h: 24, d: 0.28, dl: 0.07 },
  { x: '37%', h: 19, d: 0.38, dl: 0.04 }, { x: '43%', h: 32, d: 0.20, dl: 0.02 },
  { x: '49%', h: 14, d: 0.33, dl: 0.08 }, { x: '55%', h: 26, d: 0.26, dl: 0.05 },
  { x: '61%', h: 18, d: 0.29, dl: 0.03 }, { x: '67%', h: 22, d: 0.36, dl: 0.07 },
  { x: '73%', h: 16, d: 0.31, dl: 0.01 }, { x: '79%', h: 30, d: 0.24, dl: 0.06 },
  { x: '85%', h: 14, d: 0.34, dl: 0.04 }, { x: '91%', h: 20, d: 0.27, dl: 0.09 },
  { x: '97%', h: 16, d: 0.32, dl: 0.02 },
];

type WebAudioContext = AudioContext;
const mkACtx = (): WebAudioContext =>
  new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

/** Burst of mechanical ticking sounds — plays when the reels start spinning. */
function playSpinTicks(): void {
  try {
    const ctx   = mkACtx();
    const ticks = 20;
    const span  = 1.55; // seconds of ticking (covers the spin window)
    // One shared noise buffer, reused per tick via separate BufferSource nodes
    const len = Math.floor(ctx.sampleRate * 0.038);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let j = 0; j < len; j++) d[j] = (Math.random() * 2 - 1) * Math.exp(-j / (len * 0.18));
    for (let i = 0; i < ticks; i++) {
      const t    = ctx.currentTime + (i / ticks) * span;
      const src  = ctx.createBufferSource();
      src.buffer = buf;
      const filt = ctx.createBiquadFilter();
      filt.type  = 'bandpass';
      filt.frequency.value = 850;
      filt.Q.value = 0.6;
      const g = ctx.createGain();
      // Fade ticks out as the spin ends
      g.gain.setValueAtTime(0.3 * Math.max(0.08, 1 - (i / ticks) * 0.75), t);
      src.connect(filt); filt.connect(g); g.connect(ctx.destination);
      src.start(t); src.stop(t + 0.038);
    }
  } catch { /* AudioContext unavailable */ }
}

/** Low mechanical thud + metallic ping — plays when each reel locks. */
function playReelStop(): void {
  try {
    const ctx = mkACtx();
    const t0  = ctx.currentTime;
    // Low thud (filtered noise)
    const len = Math.floor(ctx.sampleRate * 0.1);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.2));
    const src  = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type  = 'lowpass';
    filt.frequency.value = 320;
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.65, t0);
    src.connect(filt); filt.connect(g1); g1.connect(ctx.destination);
    src.start(t0); src.stop(t0 + 0.1);
    // Metallic ping after thud
    const osc = ctx.createOscillator();
    const g2  = ctx.createGain();
    osc.connect(g2); g2.connect(ctx.destination);
    osc.type  = 'sine';
    osc.frequency.setValueAtTime(1100, t0 + 0.03);
    osc.frequency.exponentialRampToValueAtTime(550, t0 + 0.42);
    g2.gain.setValueAtTime(0.38, t0 + 0.03);
    g2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.55);
    osc.start(t0 + 0.03); osc.stop(t0 + 0.55);
  } catch { /* AudioContext unavailable */ }
}

/** Cascading coin tones + bell — plays when all 3 reels hit 777. */
function playJackpotBells(): void {
  try {
    const ctx   = mkACtx();
    const freqs = [1318, 1568, 1760, 2093, 1760, 2637, 2093, 3136];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.09;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.5, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.start(t); osc.stop(t + 0.55);
    });
    // Warm bell undertone
    const bell = ctx.createOscillator();
    const bg   = ctx.createGain();
    bell.connect(bg); bg.connect(ctx.destination);
    bell.type = 'sine'; bell.frequency.value = 523;
    bg.gain.setValueAtTime(0.28, ctx.currentTime + 0.12);
    bg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.6);
    bell.start(ctx.currentTime + 0.12); bell.stop(ctx.currentTime + 1.6);
  } catch { /* AudioContext unavailable */ }
}

/** Shiny glitter sparkle burst — plays when jackpot button slams in. */
function playGlitter(): void {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    // Ascending sparkle tones — like gold coins raining from above
    const freqs = [2093, 2637, 2794, 3136, 3520, 3951, 4186];
    freqs.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.055;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.08, t + 0.15);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.35);
    });
    // Final shimmer sweep — rising gold shine
    const sweep = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweep.connect(sweepGain);
    sweepGain.connect(ctx.destination);
    sweep.type = 'sine';
    sweep.frequency.setValueAtTime(1800, ctx.currentTime + 0.1);
    sweep.frequency.exponentialRampToValueAtTime(4200, ctx.currentTime + 0.55);
    sweepGain.gain.setValueAtTime(0.12, ctx.currentTime + 0.1);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    sweep.start(ctx.currentTime + 0.1);
    sweep.stop(ctx.currentTime + 0.6);
  } catch { /* AudioContext unavailable */ }
}

function SlotReel({ stopped, jackpotFlash, reelIndex }: { stopped: boolean; jackpotFlash: boolean; reelIndex: number }) {
  const WINDOW_H = ROW_H * 3; // 192px — 3 visible rows

  // Chrome bezel — layered box-shadow gives a beveled physical look
  const bezel = jackpotFlash
    ? '0 0 0 1px #7a5500, 0 0 0 4px #d4a843, 0 0 0 6px #f5e0a0, 0 0 40px #d4a84388, 0 0 80px #d4a84333'
    : '0 0 0 1px #2e1c00, 0 0 0 3px #7a5500, 0 0 0 5px #c09040aa, 0 0 16px rgba(120,80,0,0.3)';

  return (
    <div style={{
      width: 112, height: WINDOW_H,
      borderRadius: 6,
      boxShadow: bezel,
      position: 'relative',
      overflow: 'hidden',
      // Velvet-dark interior
      background: jackpotFlash
        ? 'linear-gradient(180deg, #100500 0%, #1e0c00 50%, #100500 100%)'
        : 'linear-gradient(180deg, #0a0400 0%, #130700 50%, #0a0400 100%)',
      transition: 'box-shadow 0.35s ease, background 0.35s ease',
    }}>

      {/* Win-line glow band — spans full width including the bezel */}
      <div style={{
        position: 'absolute',
        top: ROW_H - 1, left: -6, right: -6, height: ROW_H + 2,
        background: jackpotFlash
          ? 'rgba(212,168,67,0.10)'
          : 'rgba(212,168,67,0.03)',
        borderTop:    `1px solid rgba(212,168,67,${jackpotFlash ? 0.85 : 0.28})`,
        borderBottom: `1px solid rgba(212,168,67,${jackpotFlash ? 0.85 : 0.28})`,
        pointerEvents: 'none', zIndex: 4,
        transition: 'all 0.35s ease',
      }} />

      {/* Top gradient mask — symbols fade into darkness above win line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '44%',
        background: 'linear-gradient(to bottom, rgba(8,3,0,0.95) 0%, rgba(8,3,0,0.3) 70%, transparent 100%)',
        pointerEvents: 'none', zIndex: 5,
      }} />
      {/* Bottom gradient mask */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '44%',
        background: 'linear-gradient(to top, rgba(8,3,0,0.95) 0%, rgba(8,3,0,0.3) 70%, transparent 100%)',
        pointerEvents: 'none', zIndex: 5,
      }} />

      {/* Bevel shine — top-left corner glint */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '50%', height: '30%',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05), transparent)',
        pointerEvents: 'none', zIndex: 6,
      }} />

      {stopped ? (
        <motion.div
          initial={{ y: -ROW_H * 0.5 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'flex', flexDirection: 'column', width: '100%', position: 'relative', zIndex: 3 }}
        >
          {/* Row above — dim warm gold */}
          <div style={{
            height: ROW_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontFamily: "'Playfair Display', Georgia, serif",
            fontStyle: 'italic', fontWeight: 900,
            color: '#c09040', opacity: 0.30,
          }}>
            {REEL_ABOVE[reelIndex]}
          </div>
          {/* Center win-line row — blazing 7 in jackpot font */}
          <div style={{
            height: ROW_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 56, fontWeight: 900,
            fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif",
            fontStyle: 'italic',
            color: jackpotFlash ? '#fff9e0' : '#e8c060',
            textShadow: jackpotFlash
              ? '0 0 6px #fff, 0 0 20px #ffd700, 0 0 50px #d4a843, 0 0 90px #d4a84366'
              : '0 0 10px #d4a84366',
            transition: 'all 0.3s ease',
          }}>
            7
          </div>
          {/* Row below — dim */}
          <div style={{
            height: ROW_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontFamily: "'Playfair Display', Georgia, serif",
            fontStyle: 'italic', fontWeight: 900,
            color: '#c09040', opacity: 0.30,
          }}>
            {REEL_BELOW[reelIndex]}
          </div>
        </motion.div>
      ) : (
        <motion.div
          animate={{ y: [0, -(ROW_H * REEL_SYMS.length)] }}
          transition={{ duration: 0.42, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 }}
        >
          {[...REEL_SYMS, ...REEL_SYMS].map((s, i) => (
            <div key={i} style={{
              height: ROW_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: 'italic', fontWeight: 900,
              color: '#c09040', opacity: 0.7,
            }}>
              {s}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}


function JackpotCinematic({ onDone }: { onDone: () => void }) {
  const [stage, setStage] = useState<'throw' | 'reels' | 'jackpot'>('throw');
  const [stopped, setStopped] = useState([false, false, false]);
  const [absorbFlash, setAbsorbFlash] = useState(false);

  useEffect(() => {
    // Flash fires just before the machine appears — sells the "icon goes in" moment
    const tf = setTimeout(() => { setAbsorbFlash(true); setTimeout(() => setAbsorbFlash(false), 220); }, 700);
    const t1 = setTimeout(() => { setStage('reels'); playSpinTicks(); }, 900);
    const t2 = setTimeout(() => { setStopped([true, false, false]); playReelStop(); }, 1600);
    const t3 = setTimeout(() => { setStopped([true, true,  false]); playReelStop(); }, 2300);
    const t4 = setTimeout(() => { setStopped([true, true,  true]);  playReelStop(); }, 3100);
    const t5 = setTimeout(() => { setStage('jackpot'); playJackpotBells(); }, 3200);
    const t6 = setTimeout(onDone, 5700);
    return () => [tf, t1, t2, t3, t4, t5, t6].forEach(clearTimeout);
  }, []);

  const isJackpot = stage === 'jackpot';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 950,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 18,
        background: 'radial-gradient(ellipse 80% 70% at 50% 50%, #120700 0%, #060300 60%, #000 100%)',
        pointerEvents: 'none',
      }}
    >
      {/* Font imports + shimmer keyframe */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,900;1,900&family=Oswald:wght@700&display=swap');
        @keyframes jp-shimmer {
          0%   { background-position: -250% center; }
          100% { background-position: 250% center; }
        }
      `}</style>

      {/* CRT scanlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.09) 3px, rgba(0,0,0,0.09) 4px)',
      }} />

      {/* Ambient gold bloom on jackpot */}
      <motion.div
        animate={{ opacity: isJackpot ? 1 : 0 }}
        transition={{ duration: 1.0 }}
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(ellipse 60% 50% at 50% 46%, rgba(212,168,67,0.09) 0%, transparent 70%)',
        }}
      />

      {/* Absorb flash — bright burst when icon enters the machine */}
      <AnimatePresence>
        {absorbFlash && (
          <motion.div
            key="absorb-flash"
            initial={{ opacity: 0.85 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{
              position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none',
              background: 'radial-gradient(ellipse 55% 45% at 50% 50%, rgba(255,240,160,0.95) 0%, rgba(212,168,67,0.55) 40%, transparent 75%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Icon flies in from below and gets absorbed into the machine center */}
      <AnimatePresence>
        {stage === 'throw' && (
          <motion.div
            key="hat-throw"
            initial={{ x: 0, y: 300, scale: 0.35, opacity: 0, rotate: -10 }}
            animate={{ x: 0, y: 0, scale: 2.0, opacity: 1, rotate: 15 }}
            exit={{ scale: 0, opacity: 0, rotate: 30, filter: 'drop-shadow(0 0 80px #fffbe0) drop-shadow(0 0 40px #d4a843)' }}
            transition={{
              default: { duration: 0.68, ease: [0.16, 1, 0.3, 1] },
              exit: { duration: 0.22, ease: [0.6, 0, 1, 0.4] },
            }}
            style={{ filter: 'drop-shadow(0 0 28px #d4a843) drop-shadow(0 0 56px #d4a84355)', position: 'absolute', zIndex: 10 }}
          >
            <img src={JACKPOT_ICON} alt="" style={{ width: 88, height: 88, objectFit: 'contain' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Everything revealed after hat throw ── */}
      {stage !== 'throw' && (
        <>
          {/* Rotating starburst — art deco behind cabinet */}
          {isJackpot && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, rotate: 360 }}
              transition={{ opacity: { duration: 0.7 }, rotate: { duration: 32, repeat: Infinity, ease: 'linear' } }}
              style={{ position: 'absolute', zIndex: 2, width: 820, height: 820, pointerEvents: 'none' }}
            >
              {Array.from({ length: 20 }, (_, i) => (
                <div key={i} style={{
                  position: 'absolute', top: '50%', left: '50%',
                  width: 1.5, height: 410, marginLeft: -1, marginTop: -205,
                  background: 'linear-gradient(to top, transparent 0%, rgba(212,168,67,0.14) 50%, transparent 100%)',
                  transform: `rotate(${i * 18}deg)`, transformOrigin: 'center center',
                }} />
              ))}
            </motion.div>
          )}

          {/* ════════════════════════════════════════════
              SLOT MACHINE CABINET — realistic physical look
              ════════════════════════════════════════════ */}
          <motion.div
            initial={{ y: 0, scale: 0.92, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'relative', zIndex: 5,
              display: 'flex', alignItems: 'stretch',
              // Arched top silhouette
              borderRadius: '40px 40px 10px 10px',
              overflow: 'hidden',
              boxShadow: isJackpot
                ? '0 0 0 2px #5a3a00, 0 0 0 5px #d4a843, 0 0 0 7px #4a3000, 0 0 70px #d4a84388, 0 0 140px #d4a84322'
                : '0 0 0 2px #1e1200, 0 0 0 4px #4a2e00, 0 0 0 6px #2a1c00, 0 0 30px rgba(50,32,0,0.6)',
              transition: 'box-shadow 0.6s ease',
            }}
          >
            {/* Left chrome rail */}
            <div style={{
              width: 11, flexShrink: 0,
              background: `linear-gradient(180deg, ${isJackpot ? '#f0c860' : '#5a3a00'} 0%, #2e1c00 25%, ${isJackpot ? '#d4a843' : '#4a2e00'} 50%, #2e1c00 75%, ${isJackpot ? '#f0c860' : '#5a3a00'} 100%)`,
              transition: 'background 0.6s ease',
            }} />

            {/* Cabinet body */}
            <div style={{
              flex: 1,
              background: 'linear-gradient(180deg, #1e1000 0%, #100800 35%, #090400 100%)',
              display: 'flex', flexDirection: 'column',
            }}>

              {/* ── Crown / marquee panel ── */}
              <div style={{
                background: isJackpot
                  ? 'linear-gradient(90deg, #600000 0%, #300f00 35%, #d4a84314 50%, #300f00 65%, #600000 100%)'
                  : 'linear-gradient(90deg, #200000 0%, #120800 50%, #200000 100%)',
                padding: '8px 28px 7px',
                borderBottom: `2px solid ${isJackpot ? '#d4a84344' : '#2a1800'}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                transition: 'all 0.5s',
              }}>
                {/* LED marquee dots */}
                <div style={{ display: 'flex', gap: 5 }}>
                  {Array.from({ length: 11 }, (_, i) => (
                    <motion.div
                      key={i}
                      animate={isJackpot ? {
                        background: ['#cc0000', '#ff6600', '#ffaa00', '#ff6600', '#cc0000'],
                        boxShadow: ['0 0 3px #cc0000', '0 0 7px #ff6600', '0 0 10px #ffaa00', '0 0 7px #ff6600', '0 0 3px #cc0000'],
                      } : { background: '#1a0900', boxShadow: 'none' }}
                      transition={isJackpot ? { duration: 0.7, repeat: Infinity, delay: i * 0.065, ease: 'easeInOut' } : {}}
                      style={{ width: 5, height: 5, borderRadius: '50%', background: '#1a0900' }}
                    />
                  ))}
                </div>
                {/* Marquee text */}
                <div style={{
                  letterSpacing: 6, fontSize: 9,
                  fontFamily: "'Oswald', 'Impact', sans-serif", fontWeight: 700,
                  color: isJackpot ? '#f0d890' : 'rgba(160,100,30,0.45)',
                  textShadow: isJackpot ? '0 0 8px #d4a84366' : 'none',
                  textTransform: 'uppercase', transition: 'all 0.5s',
                }}>
                  ✦ TRIPLE SEVENS ✦
                </div>
              </div>

              {/* ── Horizontal chrome strip ── */}
              <div style={{
                height: 4,
                background: `linear-gradient(90deg, #0a0500, ${isJackpot ? '#d4a843' : '#5a3a00'}, #d4a84311, ${isJackpot ? '#d4a843' : '#5a3a00'}, #0a0500)`,
                transition: 'background 0.5s',
              }} />

              {/* ── Reel window — recessed glass panel ── */}
              <div style={{
                margin: '12px 14px 10px',
                background: '#040100',
                borderRadius: 6,
                // Inset shadow = recessed panel
                boxShadow: `inset 0 3px 10px rgba(0,0,0,0.95), inset 0 0 0 2px ${isJackpot ? '#d4a84333' : '#1e1200'}`,
                padding: '12px 14px 10px',
                position: 'relative',
                transition: 'box-shadow 0.5s',
              }}>
                {/* Corner rivets */}
                {([{ top: 4, left: 4 }, { top: 4, right: 4 }, { bottom: 4, left: 4 }, { bottom: 4, right: 4 }] as React.CSSProperties[]).map((pos, i) => (
                  <div key={i} style={{
                    position: 'absolute', ...pos,
                    width: 5, height: 5, borderRadius: '50%',
                    background: isJackpot ? '#d4a843' : '#4a2e00',
                    boxShadow: isJackpot ? '0 0 4px #d4a84388' : 'none',
                    transition: 'all 0.5s',
                  }} />
                ))}

                {/* Payline arrows + reels */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <motion.div
                    animate={{ opacity: isJackpot ? [0.35, 1, 0.35] : 0.15 }}
                    transition={{ duration: 0.85, repeat: isJackpot ? Infinity : 0 }}
                    style={{ fontSize: 11, color: '#d4a843', textShadow: isJackpot ? '0 0 6px #d4a843' : 'none' }}
                  >▶</motion.div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        initial={{ y: -55, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1, duration: 0.38, ease: 'backOut' }}
                      >
                        <SlotReel stopped={stopped[i]} jackpotFlash={isJackpot} reelIndex={i} />
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    animate={{ opacity: isJackpot ? [0.35, 1, 0.35] : 0.15 }}
                    transition={{ duration: 0.85, repeat: isJackpot ? Infinity : 0 }}
                    style={{ fontSize: 11, color: '#d4a843', textShadow: isJackpot ? '0 0 6px #d4a843' : 'none' }}
                  >◀</motion.div>
                </div>

                {/* Payline label */}
                <div style={{
                  textAlign: 'center', fontSize: 7, letterSpacing: 5, marginTop: 7,
                  fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase',
                  color: isJackpot ? '#d4a843' : 'rgba(160,100,30,0.2)',
                  textShadow: isJackpot ? '0 0 5px #d4a84355' : 'none',
                  transition: 'all 0.5s',
                }}>payline</div>
              </div>

              {/* ── Lower chrome strip ── */}
              <div style={{
                height: 4,
                background: `linear-gradient(90deg, #0a0500, ${isJackpot ? '#d4a843' : '#5a3a00'}, #d4a84311, ${isJackpot ? '#d4a843' : '#5a3a00'}, #0a0500)`,
                transition: 'background 0.5s',
              }} />

              {/* ── Controls section ── */}
              <div style={{
                padding: '9px 16px 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              }}>
                {/* Credit display */}
                <div style={{
                  flex: 1, height: 22,
                  background: '#020100',
                  border: `1px solid ${isJackpot ? '#d4a84333' : '#180e00'}`,
                  borderRadius: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Courier New', monospace", fontSize: 7, letterSpacing: 2,
                  color: isJackpot ? '#d4a843' : '#2a1a00',
                  textShadow: isJackpot ? '0 0 5px #d4a84366' : 'none',
                  transition: 'all 0.5s',
                }}>
                  {isJackpot ? 'MAX PAYOUT' : 'CREDIT 000'}
                </div>
                {/* Spin button (decorative circle) */}
                <motion.div
                  animate={isJackpot ? {
                    boxShadow: ['0 0 6px #d4a84355', '0 0 18px #d4a84399', '0 0 6px #d4a84355'],
                  } : { boxShadow: '0 0 3px rgba(50,32,0,0.5)' }}
                  transition={{ duration: 0.85, repeat: isJackpot ? Infinity : 0 }}
                  style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    background: isJackpot ? 'radial-gradient(circle, #3c1400, #180800)' : 'radial-gradient(circle, #150a00, #080400)',
                    border: `2px solid ${isJackpot ? '#d4a843' : '#3a2200'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.5s',
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    background: isJackpot ? '#d4a84318' : '#120800',
                    border: `1px solid ${isJackpot ? '#d4a84344' : '#240f00'}`,
                  }} />
                </motion.div>
              </div>
            </div>

            {/* Right chrome rail */}
            <div style={{
              width: 11, flexShrink: 0,
              background: `linear-gradient(180deg, ${isJackpot ? '#f0c860' : '#5a3a00'} 0%, #2e1c00 25%, ${isJackpot ? '#d4a843' : '#4a2e00'} 50%, #2e1c00 75%, ${isJackpot ? '#f0c860' : '#5a3a00'} 100%)`,
              transition: 'background 0.6s ease',
            }} />
          </motion.div>

          {/* ════════════════════════════════════════════
              JACKPOT ANNOUNCEMENT — appears on win
              ════════════════════════════════════════════ */}
          <AnimatePresence>
            {isJackpot && (
              <motion.div
                key="jp-announcement"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, zIndex: 10 }}
              >
                {/* JACKPOT headline */}
                <motion.div
                  initial={{ scale: 1.55, opacity: 0, y: -48 }}
                  animate={{ scale: [1.55, 0.88, 1.08, 0.97, 1], opacity: 1, y: 0 }}
                  transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontWeight: 900, fontStyle: 'italic',
                    fontSize: 68, letterSpacing: 4, lineHeight: 1,
                    background: 'linear-gradient(90deg, #7a5200 0%, #d4a843 18%, #fff8c0 36%, #ffd700 50%, #fff8c0 64%, #d4a843 82%, #7a5200 100%)',
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    animation: 'jp-shimmer 2s linear infinite',
                    filter: 'drop-shadow(0 3px 0 rgba(0,0,0,1)) drop-shadow(0 0 28px #d4a84333)',
                    userSelect: 'none',
                  }}
                >
                  JACKPOT
                </motion.div>

                {/* ── Getsuga energy beam ── */}
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1], delay: 0.38 }}
                  style={{
                    position: 'relative', width: 400, height: 32,
                    display: 'flex', alignItems: 'center',
                    transformOrigin: 'left center',
                    overflow: 'visible',
                  }}
                >
                  {/* Main energy line — black with white-hot rim */}
                  <motion.div
                    animate={{ scaleY: [1, 1.5, 1], opacity: [0.9, 1, 0.9] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      width: '100%', height: 3,
                      background: 'linear-gradient(90deg, transparent 0%, #000 4%, #050505 50%, #000 96%, transparent 100%)',
                      boxShadow: '0 0 3px rgba(255,255,255,1), 0 0 8px rgba(255,255,255,0.7), 0 0 18px rgba(255,255,255,0.25)',
                      position: 'relative', zIndex: 2,
                    }}
                  />
                  {/* White flame wisps rising from the beam */}
                  {GETSUGA_FLAMES.map((f, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: [f.h * 0.25, f.h, f.h * 0.15],
                        opacity: [0.2, 0.95, 0],
                        y: [0, -(f.h * 0.9), -(f.h * 1.2)],
                      }}
                      transition={{ duration: f.d, repeat: Infinity, delay: f.dl, ease: 'easeOut', repeatType: 'loop' }}
                      style={{
                        position: 'absolute', left: f.x, bottom: 2,
                        width: 2, height: f.h,
                        background: 'linear-gradient(to top, rgba(255,255,255,0.9), rgba(200,200,255,0.4), transparent)',
                        boxShadow: '0 0 3px rgba(255,255,255,0.8)',
                        zIndex: 3,
                      }}
                    />
                  ))}
                </motion.div>

                {/* EXECUTING FINAL GETSUGA */}
                <motion.div
                  initial={{ opacity: 0, letterSpacing: 14 }}
                  animate={{ opacity: 1, letterSpacing: 6 }}
                  transition={{ duration: 0.55, delay: 0.55, ease: 'easeOut' }}
                  style={{
                    fontFamily: "'Oswald', 'Impact', sans-serif",
                    fontWeight: 700, fontSize: 12,
                    letterSpacing: 6, textTransform: 'uppercase',
                    color: '#e5e5e5',
                    textShadow: '0 0 6px rgba(255,255,255,0.35), 0 1px 0 rgba(0,0,0,1)',
                    userSelect: 'none',
                  }}
                >
                  EXECUTING FINAL GETSUGA
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confetti burst — 42 pieces */}
          {isJackpot && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 6 }}>
              {Array.from({ length: 42 }, (_, i) => {
                const angle = (i / 42) * 360;
                const dist  = 130 + (i * 17 % 280);
                const x = Math.cos((angle * Math.PI) / 180) * dist;
                const y = Math.sin((angle * Math.PI) / 180) * dist;
                const size = 5 + (i * 3 % 11);
                const color = i % 6 === 0 ? '#cc88ff' : i % 9 === 0 ? '#55aaff' : i % 4 === 0 ? '#fff8d0' : '#d4a843';
                return (
                  <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
                    animate={{ x, y, opacity: 0, scale: 0, rotate: angle * 3 }}
                    transition={{ duration: 1.6, delay: i * 0.016, ease: 'easeOut' }}
                    style={{
                      position: 'absolute', top: '50%', left: '50%',
                      width: size, height: i % 5 !== 0 ? size : Math.max(2, size * 0.35),
                      borderRadius: i % 5 !== 0 ? '50%' : 1,
                      background: color, boxShadow: `0 0 ${size + 2}px ${color}77`,
                    }}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

// ── Floating suit card particles ─────────────────────────
const FLOAT_CARDS = [
  { sym: '♠', color: '#4da6ff', x: '8%',  delay: 0,    dur: 9  },
  { sym: '♥', color: '#ff4455', x: '18%', delay: 1.5,  dur: 11 },
  { sym: '♦', color: '#cc88ff', x: '28%', delay: 3,    dur: 8  },
  { sym: '♣', color: '#33dd77', x: '72%', delay: 0.8,  dur: 10 },
  { sym: '♠', color: '#4da6ff', x: '82%', delay: 2.2,  dur: 12 },
  { sym: '♥', color: '#ff4455', x: '91%', delay: 4,    dur: 9  },
  { sym: '♦', color: '#cc88ff', x: '55%', delay: 5,    dur: 14 },
  { sym: '♣', color: '#33dd77', x: '45%', delay: 6.5,  dur: 11 },
];

function FloatingCards() {
  return (
    <>
      {FLOAT_CARDS.map((c, i) => (
        <motion.div
          key={i}
          animate={{
            y: [80, -120],
            opacity: [0, 0.35, 0.35, 0],
            rotate: [0, c.sym === '♠' ? 25 : -18],
          }}
          transition={{
            duration: c.dur,
            delay: c.delay,
            repeat: Infinity,
            repeatDelay: 1.5,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            left: c.x,
            bottom: '30%',
            fontSize: 22,
            color: c.color,
            textShadow: `0 0 12px ${c.color}88`,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {c.sym}
        </motion.div>
      ))}
    </>
  );
}

// ── Perspective floor grid ────────────────────────────────
function FloorGrid() {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%',
      overflow: 'hidden',
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute', bottom: 0, left: '-20%', right: '-20%', height: '100%',
        backgroundImage: `
          linear-gradient(to right, rgba(255,180,40,0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,180,40,0.08) 1px, transparent 1px)
        `,
        backgroundSize: '80px 60px',
        transform: 'perspective(500px) rotateX(55deg)',
        transformOrigin: 'bottom center',
        maskImage: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 80%)',
        WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 80%)',
      }} />
    </div>
  );
}

// ── Ceiling chandelier lights ─────────────────────────────
const LIGHTS = [
  { x: '20%', color: '#ff4455', delay: 0 },
  { x: '35%', color: '#ffd700', delay: 0.4 },
  { x: '50%', color: '#ffd700', delay: 0.2 },
  { x: '65%', color: '#ffd700', delay: 0.6 },
  { x: '80%', color: '#4da6ff', delay: 0.1 },
];

function CeilingLights() {
  return (
    <>
      {LIGHTS.map((l, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8 + i * 0.3, repeat: Infinity, delay: l.delay }}
          style={{
            position: 'absolute', top: 0, left: l.x,
            width: 2, height: 180,
            background: `linear-gradient(to bottom, ${l.color}99, ${l.color}22, transparent)`,
            pointerEvents: 'none',
          }}
        />
      ))}
      {/* Light source dots */}
      {LIGHTS.map((l, i) => (
        <motion.div
          key={`dot-${i}`}
          animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.3, 1] }}
          transition={{ duration: 1.8 + i * 0.3, repeat: Infinity, delay: l.delay }}
          style={{
            position: 'absolute', top: -4, left: l.x, transform: 'translateX(-50%)',
            width: 10, height: 10, borderRadius: '50%',
            background: l.color,
            boxShadow: `0 0 14px ${l.color}, 0 0 28px ${l.color}88`,
          }}
        />
      ))}
    </>
  );
}

// ── Pre-generated SOC screen data (stable, no re-render churn) ──
const SOC_LINES = Array.from({ length: 8 }, () =>
  Array.from({ length: 14 }, () =>
    Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0').toUpperCase()
  )
);

// ── SOC monitor wall (people at computers, back of room) ──
const SOC_STATIONS = [
  { x: '74%', col: '#cc88ff', label: 'INF-05', tw: 58 },
  { x: '81%', col: '#4da6ff', label: 'NET-06', tw: 50 },
  { x: '88%', col: '#33dd77', label: 'SYS-07', tw: 62 },
  { x: '95%', col: '#ff8844', label: 'ALR-08', tw: 54 },
];

function SocStation({ x, col, label, tw, idx }: { x: string; col: string; label: string; tw: number; idx: number }) {
  return (
    <div style={{ position: 'absolute', bottom: 302, left: x, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Dual monitors */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
        {[0, 1].map(mi => (
          <motion.div
            key={mi}
            animate={{ opacity: [0.55, 0.9, 0.55] }}
            transition={{ duration: 2.2 + idx * 0.18 + mi * 0.3, repeat: Infinity, delay: idx * 0.25 + mi * 0.4 }}
            style={{
              width: tw - 4, height: mi === 0 ? 38 : 44,
              background: '#030508',
              border: `1px solid ${col}55`,
              borderRadius: 3,
              overflow: 'hidden',
              position: 'relative',
              boxShadow: `0 0 8px ${col}33, inset 0 0 6px ${col}18`,
            }}
          >
            {/* Scan lines */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 3px, ${col}0a 3px, ${col}0a 4px)`,
              pointerEvents: 'none',
            }} />
            {/* Scrolling data */}
            <motion.div
              animate={{ y: [0, -(14 * 9)] }}
              transition={{ duration: 3.5 + idx * 0.4 + mi * 0.6, repeat: Infinity, ease: 'linear', delay: idx * 0.3 }}
              style={{ position: 'absolute', left: 2, top: 2, right: 2, fontFamily: 'monospace', fontSize: 3.5, color: col, lineHeight: 1.8, opacity: 0.75 }}
            >
              {SOC_LINES[idx % SOC_LINES.length].map((line, li) => (
                <div key={li}>{li % 3 === 0 ? `[${label}] ${line}` : line}</div>
              ))}
            </motion.div>
          </motion.div>
        ))}
      </div>
      {/* Monitor stands */}
      <div style={{ display: 'flex', gap: tw - 8, marginTop: 1 }}>
        {[0, 1].map(i => <div key={i} style={{ width: 3, height: 6, background: '#1a1220' }} />)}
      </div>
      {/* Desk surface */}
      <div style={{ width: tw + 16, height: 5, background: 'linear-gradient(180deg, #1c1228, #0e0a18)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 1 }} />
      {/* Person silhouette */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -3 }}>
        {/* Head */}
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: `rgba(12,7,22,0.9)`, border: `1px solid ${col}22` }} />
        {/* Body */}
        <div style={{ width: 22, height: 22, borderRadius: '40% 40% 0 0', background: `rgba(12,7,22,0.85)`, marginTop: -3 }} />
      </div>
      {/* Screen glow on desk */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: tw + 20, height: 50,
        background: `radial-gradient(ellipse, ${col}18 0%, transparent 65%)`,
        pointerEvents: 'none',
      }} />
    </div>
  );
}

function SocMonitorWall() {
  return (
    <>
      {SOC_STATIONS.map((s, i) => (
        <SocStation key={i} idx={i} x={s.x} col={s.col} label={s.label} tw={s.tw} />
      ))}
    </>
  );
}

// ── Roulette wheel (decorative, back-center) ──────────────
function RouletteTable() {
  return (
    <div style={{
      position: 'absolute', bottom: 302, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      opacity: 0.22, pointerEvents: 'none',
    }}>
      {/* Oval felt table */}
      <div style={{
        width: 220, height: 90,
        background: 'radial-gradient(ellipse, #0a2a12 0%, #061408 70%)',
        border: '2px solid rgba(255,200,40,0.25)',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 20px rgba(0,180,60,0.12)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Layout lines */}
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute', top: '20%', left: `${28 + i * 18}%`,
            width: 1, height: '60%', background: 'rgba(255,200,40,0.18)',
          }} />
        ))}
        {/* Spinning wheel */}
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 56, height: 56, borderRadius: '50%',
            border: '3px solid rgba(255,200,40,0.4)',
            background: 'radial-gradient(circle, #18080a 40%, #2a0c0e 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}
        >
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 2, height: 22,
              background: i % 2 === 0 ? 'rgba(255,60,60,0.5)' : 'rgba(0,0,0,0.5)',
              transformOrigin: '1px 0',
              transform: `translateX(-50%) rotate(${i * 45}deg)`,
            }} />
          ))}
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffd700', opacity: 0.7 }} />
        </motion.div>
      </div>
    </div>
  );
}

// ── Dealer card table (center-left background) ────────────
function DealerTable() {
  return (
    <div style={{
      position: 'absolute', bottom: 302, left: '33%',
      opacity: 0.18, pointerEvents: 'none',
    }}>
      {/* Felt table oval */}
      <div style={{
        width: 140, height: 60,
        background: 'radial-gradient(ellipse, #0a1a2a 0%, #05100e 70%)',
        border: '2px solid rgba(60,120,255,0.2)',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
      }}>
        {/* Cards on table */}
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{
            width: 16, height: 22,
            background: i < 2 ? '#1a1030' : 'linear-gradient(145deg, #f0eadc, #ddd4b8)',
            border: `1px solid ${i < 2 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.3)'}`,
            borderRadius: 2,
            transform: `rotate(${(i - 2) * 8}deg)`,
            boxShadow: '1px 1px 0 rgba(0,0,0,0.4)',
          }} />
        ))}
      </div>
    </div>
  );
}

// ── Neon wall signs (more variety) ───────────────────────
function NeonSigns() {
  return (
    <>
      {/* SOC LIVE — bottom-left corner indicator */}
      <motion.div
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.2, repeat: Infinity }}
        style={{
          position: 'fixed', top: 14, left: 16, zIndex: 28,
          display: 'flex', alignItems: 'center', gap: 7,
        }}
      >
        <motion.div
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1.1, repeat: Infinity }}
          style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#33dd77',
            boxShadow: '0 0 8px #33dd77, 0 0 16px #33dd7766',
          }}
        />
        <span style={{
          fontFamily: 'var(--px-font)', fontSize: 9, letterSpacing: 3,
          color: '#33dd77',
          textShadow: '0 0 10px #33dd7788',
        }}>
          SOC LIVE
        </span>
      </motion.div>

      {/* THREAT LEVEL — bottom-right corner indicator */}
      <motion.div
        animate={{ opacity: [0.65, 1, 0.65] }}
        transition={{ duration: 2.6, repeat: Infinity, delay: 0.6 }}
        style={{
          position: 'fixed', top: 14, right: 16, zIndex: 28,
          display: 'flex', alignItems: 'center', gap: 7,
        }}
      >
        <span style={{
          fontFamily: 'var(--px-font)', fontSize: 9, letterSpacing: 3,
          color: '#ff8844',
          textShadow: '0 0 10px #ff884488',
        }}>
          THREAT LVL 4
        </span>
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.9, repeat: Infinity }}
          style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#ff8844',
            boxShadow: '0 0 8px #ff8844, 0 0 16px #ff884466',
          }}
        />
      </motion.div>
    </>
  );
}

// ── Sleek tactical background ─────────────────────────────
function CasinoBackground() {
  const { state } = useCampaignContext();
  const isWesker = state.bossIndex === 1;

  if (isWesker) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <img
          src={WESKER_BG}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '75%', objectFit: 'cover', transform: 'scale(1)', transformOrigin: 'center center' }}
        />
        {/* Dark overlay over the bottom HUD area */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 300,
          background: 'linear-gradient(to top, rgba(4,2,10,0.92) 0%, rgba(4,2,10,0.85) 60%, rgba(4,2,10,0.4) 100%)',
          pointerEvents: 'none',
        }} />
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
      background: '#03050d',
    }}>
      {/* Edge vignette — left */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: '28%',
        background: 'linear-gradient(to right, rgba(0,0,0,0.72) 0%, transparent 100%)',
      }} />

      {/* Edge vignette — right */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: '28%',
        background: 'linear-gradient(to left, rgba(0,0,0,0.72) 0%, transparent 100%)',
      }} />

      {/* Top vignette */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '22%',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.68) 0%, transparent 100%)',
      }} />

      {/* Bottom fade into HUD */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '38%',
        background: 'linear-gradient(to top, #0a0010 0%, rgba(10,0,16,0.85) 40%, transparent 100%)',
      }} />

      {/* CRT scanline grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 4px)',
        pointerEvents: 'none',
      }} />

      {/* Retro phosphor arena bloom — teal */}
      <div style={{
        position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
        width: 700, height: 500,
        background: 'radial-gradient(ellipse, rgba(0,200,180,0.07) 0%, rgba(0,160,255,0.03) 50%, transparent 75%)',
      }} />

      {/* Amber top-edge glow — retro ceiling light */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 180,
        background: 'radial-gradient(ellipse 900px 120px at 50% 0%, rgba(255,180,40,0.1) 0%, transparent 70%)',
      }} />

      {/* Slow horizontal CRT sweep */}
      <motion.div
        animate={{ top: ['-2%', '102%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear', repeatDelay: 5 }}
        style={{
          position: 'absolute', left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent 0%, rgba(0,255,200,0.06) 25%, rgba(0,255,200,0.16) 50%, rgba(0,255,200,0.06) 75%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Floating suit symbols */}
      <FloatingCards />

      {/* Status indicators */}
      <NeonSigns />
    </div>
  );
}

// ── Top-left phase prompt (only shown when in actual battle) ─
const PHASE_LABELS: Record<string, string> = {
  'player-draw':    '► DRAW A CARD',
  'card-select':    '► SELECT POWER',
  'resolve':        '⟳ RESOLVING...',
  'enemy-attack':   '✕ ENEMY ATTACKING!',
  'defeat-pending': '★ THREAT DEFEATED',
  'phase-clear':    '★ THREAT DEFEATED',
  'victory':        '★ VICTORY',
  'game-over':      '✕ GAME OVER',
};

// Phases where prompt is hidden (overlay handles it)
const HIDDEN_PHASES = new Set(['boss-intro']);

export function PhasePrompt() {
  const { state } = useCampaignContext();
  if (HIDDEN_PHASES.has(state.phase)) return null;

  // During enemy-attack, show the boss flavor text instead of generic label
  const label = state.phase === 'enemy-attack' && state.lastAttackMsg
    ? state.lastAttackMsg
    : (PHASE_LABELS[state.phase] ?? state.phase.toUpperCase());

  const color =
    state.phase === 'game-over'       ? '#ff4455' :
    state.phase === 'victory'         ? '#33dd77' :
    state.phase === 'phase-clear'     ? '#ffd700' :
    state.phase === 'defeat-pending'  ? '#ffd700' :
    state.phase === 'enemy-attack'    ? '#ff8844' :
    state.phase === 'card-select'     ? '#cc88ff' :
    state.phase === 'player-draw'     ? '#ffffff' :
    'rgba(255,255,255,0.55)';

  return (
    <div style={{
      position: 'fixed', top: 52, left: 18, zIndex: 60,
      pointerEvents: 'none',
    }}>
      <div style={{
        fontFamily: 'var(--px-font)', fontSize: 9,
        color: 'rgba(255,255,255,0.38)', letterSpacing: 4,
        marginBottom: 6,
      }}>
        TURN {state.turn}
      </div>

      <motion.div
        key={state.phase}
        initial={{ opacity: 0, x: -14 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        style={{
          fontFamily: 'var(--px-font)', fontSize: 14,
          color,
          textShadow: `0 0 14px ${color}88, 2px 2px 0 rgba(0,0,0,0.9)`,
          letterSpacing: 1.5, lineHeight: 1.2,
        }}
      >
        {label}
      </motion.div>

      {/* Wesker diamond warning */}
      {state.boss.id === 'wesker' && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            fontFamily: 'var(--px-font)', fontSize: 8,
            color: '#cc88ff',
            textShadow: '0 0 8px #cc88ff88, 1px 1px 0 rgba(0,0,0,0.9)',
            marginTop: 8, letterSpacing: 2,
          }}
        >
          ♦ ISOLATION: {state.diamondsUsed}/3{state.weskerExposed ? ' 🔓 STUNNED!' : ''}
        </motion.div>
      )}

      {/* AI Adapter warning */}
      {state.boss.id === 'ai-adapter' && !state.jackpotUsed && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            fontFamily: 'var(--px-font)', fontSize: 7,
            color: '#ff8844',
            textShadow: '0 0 8px #ff884488, 1px 1px 0 rgba(0,0,0,0.9)',
            marginTop: 8, letterSpacing: 1,
          }}
        >
          IMMUNE — USE <img src={JACKPOT_ICON} alt="" style={{ width: 14, height: 14, objectFit: 'contain', verticalAlign: 'middle', display: 'inline' }} />
        </motion.div>
      )}
    </div>
  );
}

// ── System Compromised banner (flashes when System Patch backfires) ─
function SystemCompromisedBanner() {
  const { state } = useCampaignContext();
  if (!state.systemCompromised) return null;
  return (
    <motion.div
      key="sys-compromised"
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: [0, 1, 0.7, 1], scale: 1 }}
      transition={{ duration: 0.4, times: [0, 0.2, 0.6, 1] }}
      style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 200,
        pointerEvents: 'none',
        textAlign: 'center',
      }}
    >
      <div style={{
        fontFamily: 'var(--px-font)',
        fontSize: 28,
        color: '#ff2233',
        textShadow: '0 0 30px #ff0022, 0 0 60px #ff002288, 2px 2px 0 #000',
        letterSpacing: 4,
        lineHeight: 1.1,
      }}>
        ⚠ SYSTEM COMPROMISED
      </div>
      <div style={{
        fontFamily: 'var(--px-font)',
        fontSize: 10,
        color: '#ff8888',
        textShadow: '0 0 12px #ff444488',
        letterSpacing: 3,
        marginTop: 8,
      }}>
        NON-SPADE CARD BACKFIRED — PATCH EXPLOITED YOUR ACTION
      </div>
    </motion.div>
  );
}

// ── Wesker stun banner ────────────────────────────────────
function WeskerStunnedBanner() {
  const { state } = useCampaignContext();
  if (!state.weskerExposed || state.weskerStunTurnsLeft <= 0) return null;
  if (state.phase === 'boss-intro' || state.phase === 'defeat-pending' ||
      state.phase === 'phase-clear' || state.phase === 'victory' ||
      state.phase === 'game-over') return null;

  return (
    <AnimatePresence>
      <motion.div
        key={`stun-${state.weskerStunTurnsLeft}`}
        initial={{ opacity: 0, scale: 0.8, y: -30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.7, y: -20 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{
          position: 'fixed', top: '18%', left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 200, pointerEvents: 'none', textAlign: 'center',
        }}
      >
        <motion.div
          animate={{ textShadow: [
            '0 0 20px #cc88ff, 0 0 40px #cc88ff66, 2px 2px 0 #000',
            '0 0 40px #cc88ff, 0 0 80px #cc88ffaa, 2px 2px 0 #000',
            '0 0 20px #cc88ff, 0 0 40px #cc88ff66, 2px 2px 0 #000',
          ]}}
          transition={{ duration: 0.8, repeat: Infinity }}
          style={{
            fontFamily: 'var(--px-font)', fontSize: 20,
            color: '#cc88ff', letterSpacing: 3, lineHeight: 1.2,
          }}
        >
          ⚡ WESKER CAUGHT AND STUNNED!
        </motion.div>
        <motion.div
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 0.6, repeat: Infinity }}
          style={{
            fontFamily: 'var(--px-font)', fontSize: 13,
            color: '#ffd700', letterSpacing: 4, marginTop: 6,
            textShadow: '0 0 14px #ffd700aa, 2px 2px 0 #000',
          }}
        >
          ATTACK NOW!! [{state.weskerStunTurnsLeft} TURN{state.weskerStunTurnsLeft !== 1 ? 'S' : ''} LEFT]
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Wesker 7-minute countdown display ─────────────────────
function WeskerTimer() {
  const { state, weskerTimeLeft } = useCampaignContext();
  if (state.boss.id !== 'wesker') return null;
  if (state.phase === 'boss-intro' || state.phase === 'defeat-pending' ||
      state.phase === 'phase-clear' || state.phase === 'victory' ||
      state.phase === 'game-over') return null;

  const mins = Math.floor(weskerTimeLeft / 60);
  const secs = weskerTimeLeft % 60;
  const display = `${mins}:${String(secs).padStart(2, '0')}`;
  const urgent  = weskerTimeLeft <= 60;
  const critical = weskerTimeLeft <= 20;

  return (
    <motion.div
      style={{
        position: 'fixed', top: 44, left: '50%', transform: 'translateX(-50%)',
        zIndex: 65, pointerEvents: 'none', textAlign: 'center',
      }}
    >
      {/* Label */}
      <div style={{
        fontFamily: 'var(--px-font)', fontSize: 8,
        color: urgent ? '#ff8844' : 'rgba(255,255,255,0.7)',
        letterSpacing: 4, marginBottom: 2,
        textShadow: '2px 2px 0 #000, 0 0 10px rgba(0,0,0,0.9)',
        fontWeight: 700,
      }}>
        WESKER TIMER
      </div>

      {/* Clock */}
      <motion.div
        animate={critical
          ? { opacity: [1, 0.3, 1], scale: [1, 1.05, 1] }
          : urgent
          ? { opacity: [1, 0.7, 1] }
          : { opacity: 1 }
        }
        transition={{ duration: critical ? 0.4 : 0.8, repeat: Infinity }}
        style={{
          fontFamily: 'var(--px-font)', fontSize: critical ? 36 : 28,
          color: critical ? '#ff2233' : urgent ? '#ff8844' : '#ffd700',
          textShadow: critical
            ? '0 0 24px #ff0022, 0 0 48px #ff002266, 2px 2px 0 #000'
            : urgent
            ? '0 0 18px #ff8844aa, 2px 2px 0 #000'
            : '0 0 16px #ffd700aa, 2px 2px 0 #000',
          letterSpacing: 4,
          fontWeight: 700,
        }}
      >
        {display}
      </motion.div>

      {urgent && (
        <div style={{
          fontFamily: 'var(--px-font)', fontSize: 7,
          color: '#ff4455', letterSpacing: 3, marginTop: 3,
          textShadow: '0 0 10px #ff445599, 2px 2px 0 #000',
          fontWeight: 700,
        }}>
          {critical ? '⚠ SYSTEM BREACH IMMINENT' : '⚠ TIME RUNNING OUT'}
        </div>
      )}
    </motion.div>
  );
}

// ── Top-right phase/deck info (bars moved to arena) ───────
function HpBars() {
  // Replaced by CounterStack center badge — content moved to HandPhasePanel
  return (
    <div style={{
      position: 'fixed', bottom: 300, left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 22, pointerEvents: 'none',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <img src="/counterstack.ico" alt="" style={{ width: 26, height: 26, opacity: 0.85, filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.6))' }} />
      <span style={{
        fontFamily: "'Orbitron', sans-serif",
        fontSize: 20, letterSpacing: 4, fontWeight: 900,
        background: 'linear-gradient(135deg, #fff8dc 0%, #ffd700 35%, #f5a623 65%, #ffe066 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        textShadow: 'none',
        filter: 'drop-shadow(0 0 14px rgba(255,215,0,0.45)) drop-shadow(0 2px 4px rgba(0,0,0,0.9))',
      }}>COUNTERSTACK</span>
    </div>
  );
}

// ── Character orbit particles ─────────────────────────────
interface OrbitProps {
  color: string;
  color2: string;
  size1?: number;
  size2?: number;
}

function CharacterOrbit({ color, size1 = 140 }: OrbitProps) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      {/* Aura ring */}
      <motion.div
        animate={{ opacity: [0.12, 0.35, 0.12] }}
        transition={{ duration: 2.8, repeat: Infinity }}
        style={{
          position: 'absolute',
          width: size1 + 20, height: size1 + 20,
          borderRadius: '50%',
          border: `1px solid ${color}55`,
          boxShadow: `0 0 18px ${color}22, inset 0 0 18px ${color}11`,
        }}
      />
    </div>
  );
}

// ── Inline stat bar ───────────────────────────────────────
function StatBar({ value, max, color, label, showNums = true, height = 10 }: {
  value: number; max: number; color: string; label: string; showNums?: boolean; height?: number;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontFamily: 'var(--px-font)', fontSize: 8,
        color: '#fff', letterSpacing: 2, marginBottom: 4,
        textShadow: '2px 2px 0 #000, 0 0 8px rgba(0,0,0,0.9)',
      }}>
        <span>{label}</span>
        {showNums && <span style={{ color, textShadow: `0 0 8px ${color}99, 2px 2px 0 #000` }}>{value}/{max}</span>}
      </div>
      <div style={{
        height, background: 'rgba(0,0,0,0.6)',
        border: '1px solid rgba(255,255,255,0.14)', borderRadius: 2, overflow: 'hidden',
      }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          style={{ height: '100%', background: color, boxShadow: `0 0 9px ${color}99` }}
        />
      </div>
    </div>
  );
}

// ── Battle arena (characters tall in background) ──────────
function BattleArena() {
  const { state } = useCampaignContext();
  const tut = useContext(TutorialCtx);
  const hideBossHp = tut.open || state.bossIndex === 0;

  // Attack movement state
  const prevPhaseRef = useRef(state.phase);
  const [magAtk, setMagAtk] = useState(false);
  const [bossAtk, setBossAtk] = useState(false);

  // Diamond strength flash
  const [showStrengthFlash, setShowStrengthFlash] = useState(false);
  const prevChargeRef = useRef(state.diamondCharge);

  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    const curPhase  = state.phase;

    // Magician attacks when phase goes from card-select → resolve
    if (prevPhase === 'card-select' && curPhase === 'resolve') {
      setMagAtk(true);
      const t = setTimeout(() => setMagAtk(false), 400);
      prevPhaseRef.current = curPhase;
      return () => clearTimeout(t);
    }

    // Boss attacks when phase becomes enemy-attack
    // For AI Adapter with adapting: delay the lunge by 1s
    if (curPhase === 'enemy-attack') {
      const delay = state.adapterAdapting ? 1000 : 0;
      const t = setTimeout(() => {
        setBossAtk(true);
        setTimeout(() => setBossAtk(false), 400);
      }, delay);
      prevPhaseRef.current = curPhase;
      return () => clearTimeout(t);
    }

    prevPhaseRef.current = curPhase;
  }, [state.phase]);

  // Diamond charge increase → flash "STRENGTH INCREASE +"
  useEffect(() => {
    const prev = prevChargeRef.current;
    const cur  = state.diamondCharge;
    if (cur > prev) {
      setShowStrengthFlash(true);
      const t = setTimeout(() => setShowStrengthFlash(false), 1800);
      prevChargeRef.current = cur;
      return () => clearTimeout(t);
    }
    prevChargeRef.current = cur;
  }, [state.diamondCharge]);

  if (state.phase === 'boss-intro') return null;

  const boss       = state.boss;
  const bossColor  = boss.hp / boss.maxHp > 0.6 ? '#33dd77' : boss.hp / boss.maxHp > 0.25 ? '#ffd700' : '#ff4455';
  const playerColor = state.playerHp / state.playerMaxHp > 0.5 ? '#33dd77' : state.playerHp / state.playerMaxHp > 0.25 ? '#ffd700' : '#ff4455';
  const bossOrbitColor  = state.bossIndex === 0 ? '#720072' : state.bossIndex === 1 ? '#ff4455' : '#4da6ff';
  const bossOrbitColor2 = state.bossIndex === 0 ? '#960096' : state.bossIndex === 1 ? '#ffd700' : '#cc88ff';

  return (
    <div style={{
      position: 'fixed', left: 0, right: 0,
      top: 0, bottom: 300,
      zIndex: 20,
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      padding: '0 80px',
    }}>
      {/* Background — SimulationBackground flipped vertically (hidden for Wesker) */}
      {state.bossIndex !== 1 && (
        <img
          src={SIM_BG}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center',
            transform: 'scaleY(-1)',
            opacity: 0.55,
            pointerEvents: 'none',
            zIndex: 0,
          }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}

      {/* Purple colour wash over the image (hidden for Wesker) */}
      {state.bossIndex !== 1 && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'rgba(120, 0, 180, 0.18)',
          mixBlendMode: 'color',
          pointerEvents: 'none',
        }} />
      )}

      {/* Magician — tall left */}
      <motion.div
        animate={{ x: magAtk ? 60 : 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 6,
          filter: 'drop-shadow(0 0 28px rgba(0,220,200,0.35))',
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MagicianSprite size={0.82} />
        </div>

        {/* Player label */}
        <div style={{
          fontFamily: 'var(--px-font)', fontSize: 10, letterSpacing: 4,
          color: '#fff',
          textShadow: '0 0 12px rgba(0,220,200,0.9), 0 0 24px rgba(0,220,200,0.5), 2px 2px 0 #000',
          fontWeight: 700,
        }}>
          PLAYER
        </div>

        {/* Player stat bars + strength flash */}
        <div style={{ position: 'relative', width: 170 }}>
          <AnimatePresence>
            {showStrengthFlash && (
              <motion.div
                key="strength-flash"
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: -8, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.7 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: 'absolute', top: -46, left: '50%', transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 5,
                  fontFamily: 'var(--px-font)', fontSize: 8,
                  color: '#cc88ff',
                  textShadow: '0 0 16px #cc88ff, 0 0 32px #cc88ff88, 2px 2px 0 #000',
                  letterSpacing: 2,
                }}
              >
                ♦ STRENGTH INCREASE +
              </motion.div>
            )}
          </AnimatePresence>

          {/* Player HP + Mana bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <StatBar value={state.playerHp} max={state.playerMaxHp} color={playerColor} label="HP" />
            <StatBar value={state.mana} max={state.manaMax} color="#4da6ff" label="MANA" />
            {state.defenseStacks > 0 && (
              <div style={{
                fontFamily: 'var(--px-font)', fontSize: 5,
                color: '#cc88ff', textShadow: '0 0 6px #cc88ff88',
                letterSpacing: 2, textAlign: 'center',
              }}>
                ♦ ARMOR +{state.defenseStacks}
              </div>
            )}
          </div>
        </div>

      </motion.div>

      {/* Boss — tall right */}
      <motion.div
        animate={{ x: bossAtk ? -30 : 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 6,
          filter: state.bossIndex === 0
            ? `drop-shadow(0 0 32px rgba(114,0,114,0.7))`
            : state.bossIndex === 1
            ? `drop-shadow(0 0 32px rgba(255,68,85,0.4))`
            : `drop-shadow(0 0 32px rgba(77,166,255,0.4))`,
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BossSprite bossIndex={state.bossIndex} adapting={state.adapterAdapting} />
          {/* AI Adapter ADAPTING flash */}
          <AnimatePresence>
            {state.adapterAdapting && (
              <motion.div
                key="adapting"
                initial={{ opacity: 0, scale: 0.6, y: 20 }}
                animate={{ opacity: 1, scale: 1.1, y: -10 }}
                exit={{ opacity: 0, scale: 0.8, y: -30 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: 'absolute', top: -20,
                  fontFamily: 'var(--px-font)', fontSize: 16,
                  color: '#4da6ff', letterSpacing: 4,
                  textShadow: '0 0 20px #4da6ff, 0 0 40px #4da6ffaa, 2px 2px 0 #000',
                  pointerEvents: 'none', zIndex: 10,
                  whiteSpace: 'nowrap',
                }}
              >
                <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.4, repeat: Infinity }}>
                  ⟳ ADAPTING
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Boss name */}
        <div style={{
          fontFamily: 'var(--px-font)', fontSize: 10, letterSpacing: 4,
          color: '#fff',
          textShadow: '0 0 12px rgba(255,200,80,0.9), 0 0 24px rgba(255,200,80,0.4), 2px 2px 0 #000',
          fontWeight: 700,
        }}>
          {boss.name}
        </div>

        {/* Boss HP bar */}
        <div style={{ width: 200 }}>
          {hideBossHp
            ? <div style={{ fontFamily: 'var(--px-font)', fontSize: 10, color: '#ff4455', letterSpacing: 3, textShadow: '0 0 12px #ff445599, 2px 2px 0 #000', fontWeight: 700 }}>HP: ???</div>
            : <StatBar value={boss.hp} max={boss.maxHp} color={bossColor} label="BOSS HP" />
          }
        </div>

      </motion.div>
    </div>
  );
}

// ── Card action name lookup ───────────────────────────────
const CARD_ACTIONS: Record<Suit, Record<number, string>> = {
  spades: {
    2: 'Threat Ping',            3: 'Flag Malicious Behavior',
    4: 'Block Suspicious IP',    5: 'Terminate Suspicious Process',
    6: 'Disable Compromised Account', 7: 'Remove Malware Artifact',
    8: 'Quarantine Infected Endpoint', 9: 'Kill Persistence Mechanism',
    10: 'Sinkhole Malicious Domain',  11: 'Contain Lateral Movement',
    12: 'Network Isolation',     13: 'Full Threat Neutralization',
    1:  'Advanced Counterstrike',
  },
  clubs: {
    2: 'Resource Ping',          3: 'Assign SOC Analyst',
    4: 'Increase Logging',       5: 'Activate Monitoring',
    6: 'Deploy Detection Rule',  7: 'Enable Threat Intelligence Feed',
    8: 'Expand Monitoring Coverage', 9: 'Automated Alert Triage',
    10: 'Investigation Resource Boost', 11: 'SOC Surge Support',
    12: 'Security Operations Expansion', 13: 'Full SOC Mobilization',
    1: 'Emergency Resource Surge',
  },
  diamonds: {
    2: 'System Integrity Check', 3: 'Security Posture Scan',
    4: 'Deploy Firewall Rule',   5: 'Apply Security Configuration',
    6: 'Enable Endpoint Protection', 7: 'Patch Vulnerability',
    8: 'Strengthen Authentication',  9: 'Deploy Network Segmentation',
    10: 'Infrastructure Hardening',  11: 'Defensive Reinforcement',
    12: 'Enterprise Security Upgrade', 13: 'Maximum Defense Protocol',
    1: 'Zero Trust Lockdown',
  },
  hearts: {
    2: 'Health Check',           3: 'System Diagnostics',
    4: 'Restore Minor Service',  5: 'Reset User Credentials',
    6: 'Repair System Damage',   7: 'Restore Critical Service',
    8: 'Recover Endpoint',       9: 'Restore Backup Data',
    10: 'System Rebuild',        11: 'Incident Recovery',
    12: 'Full System Restoration', 13: 'Enterprise Recovery Protocol',
    1: 'Disaster Recovery Activation',
  },
};

// ── Suit action tooltips ──────────────────────────────────
const CARD_FLAVOR: Record<Suit, Record<number, string>> = {
  spades: {
    2:  'probe target for open vulnerabilities',
    3:  'mark anomalous activity for response',
    4:  'firewall drop — cut inbound vector',
    5:  'kill rogue exec — stop the spread',
    6:  'revoke credentials — lock the breach',
    7:  'purge payload from memory',
    8:  'isolate host — contain the damage',
    9:  'strip autorun — deny re-entry',
    10: 'redirect C2 traffic to null',
    11: 'segment network — block lateral pivot',
    12: 'full cut — zero egress allowed',
    13: 'total sweep — threat eliminated',
    1:  'max-power retaliation payload',
  },
  clubs: {
    2:  'minimal signal — restore trace mana',
    3:  'pull analyst — boost ops capacity',
    4:  'widen telemetry — refuel intel stream',
    5:  'spin up sensors — restore visibility',
    6:  'push SIEM rule — reclaim coverage',
    7:  'open threat feed — recharge intel',
    8:  'extend sensor net — deep restore',
    9:  'auto-sort queue — clear backlog',
    10: 'surge analysts — ops refuel',
    11: 'full team deploy — major recharge',
    12: 'scale ops center — full restore',
    13: 'all hands — complete mana recovery',
    1:  'crisis override — instant refuel',
  },
  diamonds: {
    2:  'run checksums — light hardening',
    3:  'scan attack surface — patch gaps',
    4:  'push ACL — block inbound route',
    5:  'lock down settings — harden config',
    6:  'spin up EDR — shield endpoints',
    7:  'apply CVE fix — seal the crack',
    8:  'enforce MFA — layer access gate',
    9:  'VLAN split — contain blast radius',
    10: 'harden all nodes — fortify stack',
    11: 'multi-layer shield — max coverage',
    12: 'full policy push — iron wall',
    13: 'zero-trust lockdown — impenetrable',
    1:  'trust nothing — verify everything',
  },
  hearts: {
    2:  'quick scan — minimal recovery',
    3:  'run checks — restore minor integrity',
    4:  'bring up micro-service — small heal',
    5:  'flush tokens — reboot access layer',
    6:  'patch corrupted files — restore core',
    7:  'revive key process — solid recovery',
    8:  'rebuild host from last clean image',
    9:  'pull clean snapshot — restore state',
    10: 'full OS reinstall — major recovery',
    11: 'post-breach restore — reclaim ops',
    12: 'wipe and rebuild — near full health',
    13: 'org-wide restore — full integrity',
    1:  'BCP triggered — complete recovery',
  },
};

function getSuitTooltip(suit: Suit, rank: number): string {
  const name   = CARD_ACTIONS[suit]?.[rank] ?? rankDisplay(rank);
  const flavor = CARD_FLAVOR[suit]?.[rank] ?? '';
  return flavor ? `${name} — ${flavor}` : name;
}

function getSuitValueIcon(suit: Suit): React.ReactNode {
  switch (suit) {
    case 'spades':   return '⚡';
    case 'clubs':    return '💧';
    case 'diamonds': return <span style={{ color: '#cc88ff', fontFamily: 'system-ui', fontSize: 12, lineHeight: 1 }}>♦</span>;
    case 'hearts':   return '❤️';
  }
}

// ── Number picker panel (floats above D-pad) ──────────────
interface NumberPickerPanelProps {
  suit: Suit;
  options: Array<{ id: string; rank: number }>;
  onPick: (rank: number) => void;
  onCancel: () => void;
}

// ── Power list view ───────────────────────────────────────
interface PowerListProps extends NumberPickerPanelProps {
  playerMana: number;
}

function PowerList({ suit, options, onPick, onCancel, playerMana }: PowerListProps) {
  const [hoveredRank, setHoveredRank] = useState<number | null>(null);
  const tut      = useContext(TutorialCtx);
  const tutDemo  = tut.open && tut.step === 2;
  const tutView  = tut.open && tut.step === 3;
  const color  = suitColor(suit);
  const sym    = suitSym(suit);
  const maxVal = Math.max(...options.map(o => rankValue(o.rank)));
  const isFree = suit === 'clubs';

  const renderRow = (opt: { id: string; rank: number }, i: number) => {
    const val       = rankValue(opt.rank);
    const label     = rankDisplay(opt.rank);
    const cost      = isFree ? 0 : manaCost(opt.rank);
    const canAfford = isFree || playerMana >= cost;
    const isHover   = hoveredRank === opt.rank && canAfford;
    const barPct    = Math.round((val / maxVal) * 100);

    return (
      <motion.button
        key={opt.rank}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.025, duration: 0.14 }}
        onMouseEnter={() => canAfford && setHoveredRank(opt.rank)}
        onMouseLeave={() => setHoveredRank(null)}
        onClick={() => canAfford && (tutDemo ? (onCancel(), tut.advance()) : tutView ? undefined : onPick(opt.rank))}
        whileTap={canAfford ? { scale: 0.97 } : undefined}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '8px 16px',
          background: isHover ? `${color}18` : 'transparent',
          border: 'none',
          borderBottom: `1px solid rgba(255,255,255,0.05)`,
          borderLeft: isHover ? `3px solid ${color}` : '3px solid transparent',
          cursor: canAfford ? 'pointer' : 'not-allowed',
          transition: 'background 0.1s, border-color 0.1s',
          textAlign: 'left', width: '100%',
          opacity: canAfford ? 1 : 0.3,
        }}
      >
        <div style={{
          fontFamily: 'var(--px-font)', fontSize: 11,
          color: isHover ? color : color + 'bb',
          width: 26, flexShrink: 0, textAlign: 'center',
          textShadow: isHover ? `0 0 8px ${color}` : 'none',
        }}>
          {label}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{
            fontFamily: 'var(--px-body-font)', fontSize: 13, fontWeight: 400,
            color: isHover ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.55)',
            letterSpacing: 0.4,
          }}>
            {getSuitTooltip(suit, opt.rank)}
          </div>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${barPct}%` }}
              transition={{ delay: i * 0.025 + 0.08, duration: 0.28 }}
              style={{ height: '100%', background: isHover ? color : color + '66', boxShadow: isHover ? `0 0 4px ${color}` : 'none' }}
            />
          </div>
        </div>

        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 1, color: isHover ? color : color + '77' }}>
            <span style={{ fontFamily: 'var(--px-font)', fontSize: 8, lineHeight: 1 }}>{val}</span>
            <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 8, lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>{getSuitValueIcon(suit)}</span>
          </div>
          {!isFree && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 1, color: canAfford ? (isHover ? '#4da6ff' : '#4da6ff88') : '#ff445588' }}>
              <span style={{ fontFamily: 'var(--px-font)', fontSize: 8, lineHeight: 1 }}>{cost}</span>
              <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 8, lineHeight: 1 }}>💧</span>
            </div>
          )}
          {isFree && <div style={{ fontFamily: 'var(--px-font)', fontSize: 8, color: '#4da6ff66' }}>FREE</div>}
        </div>
      </motion.button>
    );
  };

  // ── Popup modal ───────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onCancel}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200,
        display: 'flex', alignItems: 'center',
        justifyContent: tutView ? 'flex-start' : 'center',
        paddingBottom: 100,
        paddingLeft: tutView ? 'calc(50% - 412px)' : 0,
      }}
    >
      {/* Arena overlay — light blur, still visible */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 300,
        background: 'rgba(10,0,16,0.18)',
        backdropFilter: 'blur(1px)',
        pointerEvents: 'none',
      }} />

      {/* HUD overlay — heavy blur */}
      <div style={{
        position: 'absolute', top: 'calc(100% - 300px)', left: 0, right: 0, bottom: 0,
        background: 'rgba(10,0,16,0.5)',
        backdropFilter: 'blur(3px)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative', zIndex: 1,
          width: 340, maxHeight: '70vh',
          background: 'linear-gradient(160deg, #100020 0%, #0a0016 100%)',
          border: `1px solid ${color}55`,
          boxShadow: `0 0 40px ${color}22, 0 24px 60px rgba(0,0,0,0.8)`,
          borderRadius: 8,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 18px',
          borderBottom: `1px solid ${color}33`,
          background: `${color}0d`,
          flexShrink: 0,
          position: 'relative', zIndex: 2,
        }}>
          <div style={{
            fontFamily: 'var(--px-font)', fontSize: 10,
            color, letterSpacing: 4,
            textShadow: `0 0 14px ${color}88`,
          }}>
            {sym} {suit.toUpperCase()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {!isFree && (
              <div style={{ fontFamily: 'var(--px-font)', fontSize: 8, color: color, letterSpacing: 2 }}>
                {playerMana} STATS MAX
              </div>
            )}
            <button
              onClick={onCancel}
              style={{
                fontFamily: 'var(--px-font)', fontSize: 14,
                color: 'rgba(204,136,255,0.5)',
                background: 'none', border: 'none',
                cursor: 'pointer', lineHeight: 1,
                padding: '2px 4px',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ee88ff'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(204,136,255,0.5)'; }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable list */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {options.map((opt, i) => renderRow(opt, i))}
        </div>

      </motion.div>
    </motion.div>
  );
}

// ── D-pad card hand (console layout) ─────────────────────
// Layout:  TOP=Clubs, LEFT=Spades, RIGHT=Diamonds, BOTTOM=Hearts
const DPAD_LAYOUT: Array<{ suit: Suit; row: number; col: number; label: string }> = [
  { suit: 'clubs',    row: 1, col: 2, label: 'RESOURCE'   },
  { suit: 'spades',   row: 2, col: 1, label: 'OFFENSIVE'  },
  { suit: 'diamonds', row: 2, col: 3, label: 'HARDEN'     },
  { suit: 'hearts',   row: 3, col: 2, label: 'RESILIENCE' },
];

function JackpotButton() {
  const { triggerJackpot } = useCampaignContext();
  const [slotsActive, setSlotsActive] = useState(false);
  const [videoOpen,   setVideoOpen]   = useState(false);
  const videoRef   = useRef<HTMLVideoElement>(null);
  const safetyRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fire glitter SFX the instant this button mounts (turn 13 unlock)
  useEffect(() => { playGlitter(); }, []);

  const handleVideoDone = useCallback(() => {
    if (safetyRef.current) { clearTimeout(safetyRef.current); safetyRef.current = null; }
    setVideoOpen(false);
    SfxPlayer.play(SFX.virusDefeat);
    triggerJackpot();
  }, [triggerJackpot]);

  const handleSlotsDone = useCallback(() => {
    setSlotsActive(false);
    setVideoOpen(true);
    const el = videoRef.current!;
    el.currentTime = 0;
    el.muted  = false;
    el.volume = 1;
    el.play().catch(() => { });
    safetyRef.current = setTimeout(handleVideoDone, 15000);
  }, [handleVideoDone]);

  const handleJackpot = () => {
    MusicManager.stop();
    setSlotsActive(true);
    const el = videoRef.current!;
    el.currentTime = 0;
    el.muted  = true;
    el.volume = 1;
    el.play()
      .then(() => { el.pause(); el.currentTime = 0; })
      .catch(() => { });
  };

  return (
    <>
      {/* ── JACKPOT button — slams in with spring bounce + gold burst ── */}
      <motion.div
        initial={{ y: 90, scale: 0.15, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 7, stiffness: 280, mass: 0.85 }}
        style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
      >
        {/* Entrance burst ring 1 */}
        <motion.div
          initial={{ scale: 0.6, opacity: 1 }}
          animate={{ scale: 4.5, opacity: 0 }}
          transition={{ duration: 0.75, ease: 'easeOut', delay: 0.2 }}
          style={{
            position: 'absolute', inset: 0, borderRadius: 10,
            border: '3px solid #d4a843', pointerEvents: 'none',
          }}
        />
        {/* Entrance burst ring 2 */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0.7 }}
          animate={{ scale: 7, opacity: 0 }}
          transition={{ duration: 1.0, ease: 'easeOut', delay: 0.32 }}
          style={{
            position: 'absolute', inset: 0, borderRadius: 10,
            border: '2px solid #8B6914', pointerEvents: 'none',
          }}
        />

        <motion.button
          animate={{
            boxShadow: [
              '0 0 0 1px #7a5500, 0 0 0 3px #d4a843, 0 0 18px #d4a84366, 2px 3px 0 #000',
              '0 0 0 1px #9a7000, 0 0 0 3px #f0c860, 0 0 50px #d4a84399, 2px 3px 0 #000',
              '0 0 0 1px #7a5500, 0 0 0 3px #d4a843, 0 0 18px #d4a84366, 2px 3px 0 #000',
            ],
            scale: [1, 1.07, 1],
          }}
          transition={{ duration: 0.95, repeat: Infinity, ease: 'easeInOut' }}
          whileHover={{
            scale: 1.18,
            boxShadow: '0 0 0 1px #d4a843, 0 0 0 3px #f5e0a0, 0 0 60px #d4a843bb, 2px 3px 0 #000',
          }}
          whileTap={{ scale: 0.88 }}
          onClick={handleJackpot}
          style={{
            width: 82, height: 82,
            cursor: 'pointer',
            background: 'linear-gradient(145deg, #1a0d00 0%, #0f0800 50%, #1a0d00 100%)',
            border: 'none',
            borderRadius: 10,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <img src={JACKPOT_ICON} alt="Jackpot" style={{ width: 52, height: 52, objectFit: 'contain' }} />
        </motion.button>

        {/* Label */}
        <motion.div
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 0.95, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            fontFamily: "'Oswald', 'Impact', monospace", fontSize: 8, fontWeight: 700, letterSpacing: 4,
            color: '#d4a843',
            textShadow: '0 0 8px #d4a84388',
            userSelect: 'none', textTransform: 'uppercase',
          }}
        >
          Jackpot
        </motion.div>
      </motion.div>

      {/* ── Slot machine cinematic — fullscreen overlay ── */}
      <AnimatePresence>
        {slotsActive && (
          <JackpotCinematic key="slots" onDone={handleSlotsDone} />
        )}
      </AnimatePresence>

      {/* ── Dark backdrop for video ── */}
      <AnimatePresence>
        {videoOpen && (
          <motion.div
            key="jv-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            style={{
              position: 'fixed', inset: 0, zIndex: 900,
              background: 'rgba(0,0,0,0.95)',
            }}
          />
        )}
      </AnimatePresence>

      <video
        ref={videoRef}
        src={JACKPOT_VIDEO}
        playsInline
        onEnded={handleVideoDone}
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100vw', height: '100vh',
          objectFit: 'contain',
          zIndex: 901,
          opacity:    videoOpen ? 1 : 0,
          visibility: videoOpen ? 'visible' : 'hidden',
          transition: 'opacity 0.4s ease, visibility 0.4s',
          pointerEvents: videoOpen ? 'auto' : 'none',
        }}
      />
    </>
  );
}

function CardHand() {
  const { state, drawSuit, selectCard } = useCampaignContext();
  const tut = useContext(TutorialCtx);
  const isFourSuitsStep  = tut.open && tut.step === 1;
  const isSelectingStep  = tut.open && tut.step === 2;
  const [selectedSuit, setSelectedSuit] = useState<Suit | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);

  const canPlay  = state.phase === 'player-draw';
  const inSelect = state.phase === 'card-select';

  useEffect(() => {
    if (!inSelect) { setSelectedSuit(null); setPopupOpen(false); }
  }, [inSelect]);

  // Sync popup with tutorial step 3 (READING CARD VALUES)
  useEffect(() => {
    if (!tut.open) { setSelectedSuit(null); setPopupOpen(false); return; }
    if (tut.step === 3) {
      setSelectedSuit('spades');
      setPopupOpen(true);
      drawSuit('spades');
    } else {
      setSelectedSuit(null);
      setPopupOpen(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tut.step, tut.open]);

  const handleSuitClick = (suit: Suit) => {
    if (!canPlay && !inSelect) return;
    setSelectedSuit(suit);
    setPopupOpen(true);
    drawSuit(suit);
  };

  const handlePick = (rank: number) => {
    const suit = selectedSuit ?? state.drawnCard?.suit;
    if (!suit) return;
    const cardId = `${suit}-pick-${rank}`;
    const card = state.cardOptions.find(c => c.id === cardId);
    if (card) {
      const sfxId = CARD_SFX[card.suit];
      if (sfxId) SfxPlayer.playId(sfxId);
      selectCard(cardId);
    }
    setSelectedSuit(null);
    setPopupOpen(false);
  };

  const handleCancel = () => { setSelectedSuit(null); setPopupOpen(false); };

  const activeSuit = selectedSuit ?? (inSelect ? state.drawnCard?.suit ?? null : null);
  const showList   = popupOpen && inSelect && activeSuit && state.cardOptions.length > 0;

  const ROW_ORDER: Array<{ suit: Suit; label: string }> = [
    { suit: 'spades',   label: 'OFFENSIVE'  },
    { suit: 'clubs',    label: 'RESOURCE'   },
    { suit: 'diamonds', label: 'HARDEN'     },
    { suit: 'hearts',   label: 'RESILIENCE' },
  ];

  return (
    <div style={{
      flex: 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 18, height: '100%', padding: '10px 24px',
    }}>
      {/* Horizontal card row — fills panel height */}
      {ROW_ORDER.map(({ suit, label }) => {
        const isActiveSuit = popupOpen && inSelect && activeSuit === suit;
        const disabled     = !canPlay && !inSelect;
        const color        = suitColor(suit);
        return (
          <div key={suit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <PlayingCard
              suit={suit}
              rank={state.handRanks[suit]}
              size={2.0}
              selected={isActiveSuit}
              glow={isActiveSuit}
              disabled={(disabled && !isFourSuitsStep) || (isSelectingStep && suit !== 'spades')}
              constrainHover={isFourSuitsStep}
              flash={isSelectingStep && suit === 'spades' && !popupOpen}
              onClick={disabled || isFourSuitsStep ? undefined : isSelectingStep ? (suit === 'spades' ? () => { handleSuitClick(suit); tut.advance(); } : undefined) : () => handleSuitClick(suit)}
            />
            {(!isSelectingStep || suit === 'spades') && (
              <div style={{
                fontFamily: "'Cinzel Decorative', serif", fontSize: 9, fontWeight: 700,
                color: disabled ? 'rgba(255,255,255,0.18)' : color,
                letterSpacing: 1.5,
                textShadow: disabled ? 'none' : `0 0 8px ${color}88`,
              }}>
                {label}
              </div>
            )}
          </div>
        );
      })}

      {/* Jackpot button — inline at end when available */}
      <AnimatePresence>
        {state.jackpotAvailable && !state.jackpotUsed && canPlay && <JackpotButton key="jackpot-btn" />}
      </AnimatePresence>

      {/* Power list popup — floats above everything when suit selected */}
      <AnimatePresence>
        {showList && (
          <PowerList
            key={activeSuit}
            suit={activeSuit!}
            options={state.cardOptions}
            onPick={handlePick}
            onCancel={handleCancel}
            playerMana={state.mana}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Hand phase panel (left of D-pad) ────────────────────────
// ── Posture Status Popup ───────────────────────────────────
function PostureStatusPopup({ onClose }: { onClose: () => void }) {
  const { state } = useCampaignContext();

  // Map sim suit keys → posture rank keys
  const ranks: Record<string, number> = {
    spade:   state.handRanks['spades']   ?? 1,
    clover:  state.handRanks['clubs']    ?? 1,
    diamond: state.handRanks['diamonds'] ?? 1,
    heart:   state.handRanks['hearts']   ?? 1,
  };
  const posture = computePosture(ranks);

  const boss = state.boss;
  const bossHpPct = boss.hp / boss.maxHp;

  // Determine posture strength vs current threat
  const score = posture.score;
  const postureStrong = score >= 70;
  const postureMid    = score >= 40 && score < 70;
  const postureColor  = postureStrong ? '#33dd77' : postureMid ? '#ffd700' : '#ff4455';
  const postureLabel  = postureStrong ? 'STRONG' : postureMid ? 'MODERATE' : 'WEAK';

  // Threat pressure context
  const threatPressure = bossHpPct > 0.7 ? 'LOW' : bossHpPct > 0.4 ? 'MODERATE' : 'HIGH';
  const threatColor    = bossHpPct > 0.7 ? '#33dd77' : bossHpPct > 0.4 ? '#ffd700' : '#ff4455';

  const matchup = postureStrong
    ? 'Your posture is well-suited to absorb and counter this threat. Maintain pressure with offensive cards.'
    : postureMid
    ? 'Moderate posture — you can hold your ground but avoid prolonged exchanges. Prioritize efficient plays.'
    : 'Weak posture against this threat. Lean on RESOURCE cards to sustain mana and buy time for recovery.';

  const SUIT_LABELS: Record<string, { label: string; color: string }> = {
    spade:   { label: 'OFFENSIVE',   color: '#4da6ff' },
    clover:  { label: 'RESOURCE',    color: '#33dd77' },
    diamond: { label: 'HARDEN',      color: '#cc88ff' },
    heart:   { label: 'RESILIENCE',  color: '#ff6688' },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(2,1,8,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          width: 340,
          background: 'linear-gradient(160deg, #0a0618 0%, #060310 100%)',
          border: '1px solid rgba(0,212,255,0.25)',
          borderRadius: 10,
          boxShadow: '0 0 40px rgba(0,212,255,0.1), 4px 4px 0 #000',
          overflow: 'hidden',
          width: 520,
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 22px 14px',
          borderBottom: '1px solid rgba(0,212,255,0.15)',
          background: 'rgba(0,212,255,0.04)',
        }}>
          <div style={{ fontFamily: 'var(--px-font)', fontSize: 9, letterSpacing: 4, color: 'rgba(0,212,255,0.85)' }}>
            ◈ POSTURE STATUS
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'var(--px-font)', fontSize: 11 }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Posture hand */}
          <div>
            <div style={{ fontFamily: 'var(--px-font)', fontSize: 7, letterSpacing: 3, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>CURRENT HAND</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontFamily: 'var(--px-font)', fontSize: 14, color: postureColor, textShadow: `0 0 16px ${postureColor}88` }}>{posture.hand}</span>
              <span style={{ fontFamily: 'var(--px-font)', fontSize: 8, color: postureColor, letterSpacing: 2 }}>{postureLabel}</span>
              <span style={{ fontFamily: 'var(--px-font)', fontSize: 8, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>SCORE {posture.score}</span>
            </div>
          </div>

          {/* Suit ranks */}
          <div>
            <div style={{ fontFamily: 'var(--px-font)', fontSize: 7, letterSpacing: 3, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>SUIT RANKS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(ranks).map(([suit, rank]) => {
                const { label, color } = SUIT_LABELS[suit] ?? { label: suit.toUpperCase(), color: '#fff' };
                const pct = Math.round((rank / 13) * 100);
                return (
                  <div key={suit}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--px-font)', fontSize: 8, color: 'rgba(255,255,255,0.45)', letterSpacing: 2, marginBottom: 3 }}>
                      <span style={{ color }}>{label}</span><span style={{ color }}>RANK {rank}</span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(0,0,0,0.5)', border: `1px solid ${color}22`, borderRadius: 2, overflow: 'hidden' }}>
                      <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} style={{ height: '100%', background: color, boxShadow: `0 0 6px ${color}88` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Threat matchup */}
          <div style={{ borderTop: '1px solid rgba(0,212,255,0.1)', paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontFamily: 'var(--px-font)', fontSize: 7, letterSpacing: 3, color: 'rgba(255,255,255,0.35)' }}>THREAT PRESSURE</div>
              <div style={{ fontFamily: 'var(--px-font)', fontSize: 8, letterSpacing: 2, color: threatColor }}>{threatPressure}</div>
            </div>
            <div style={{ fontFamily: 'var(--px-body-font)', fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>
              {matchup}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function HandPhasePanel({ onShowInfo }: { onShowInfo?: () => void }) {
  const { state } = useCampaignContext();

  const LABELS: Record<string, string> = {
    'player-draw':    'DRAW A CARD',
    'card-select':    'SELECT CARD',
    'resolve':        'RESOLVING...',
    'enemy-attack':   'INCOMING!',
    'defeat-pending': 'THREAT DEFEATED',
    'phase-clear':    'THREAT DEFEATED',
    'victory':        'VICTORY',
    'game-over':      'GAME OVER',
  };

  const color =
    state.phase === 'game-over'       ? '#ff4455' :
    state.phase === 'victory'         ? '#33dd77' :
    state.phase === 'phase-clear'     ? '#ffd700' :
    state.phase === 'defeat-pending'  ? '#ffd700' :
    state.phase === 'enemy-attack'    ? '#ff8844' :
    state.phase === 'card-select'     ? '#00d4ff' :
    state.phase === 'player-draw'     ? '#e0d8ff' :
    'rgba(255,255,255,0.45)';

  const label = state.phase === 'enemy-attack' && state.lastAttackMsg
    ? state.lastAttackMsg
    : (LABELS[state.phase] ?? state.phase.toUpperCase());

  const [showPlayerInfo, setShowPlayerInfo] = useState(false);

  if (state.phase === 'boss-intro') return <div style={{ width: 215, flexShrink: 0 }} />;

  const ROW = (content: React.ReactNode, color_: string = 'rgba(255,255,255,0.55)') => (
    <div style={{ fontFamily: 'var(--px-font)', fontSize: 10, color: color_, letterSpacing: 2, lineHeight: 1.5 }}>
      {content}
    </div>
  );

  const playerHpPct  = Math.round(state.playerHp / state.playerMaxHp * 100);
  const manaPct      = Math.round(state.mana / state.manaMax * 100);
  const hpColor      = playerHpPct > 50 ? '#33dd77' : playerHpPct > 25 ? '#ffd700' : '#ff4455';

  return (
    <div style={{
      width: 215, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'flex-start', justifyContent: 'flex-start',
      paddingLeft: 4, paddingTop: 14, paddingRight: 4,
      height: '100%', gap: 8, position: 'relative',
    }}>
      {/* Turn */}
      <div style={{
        fontFamily: 'var(--px-font)', fontSize: 16,
        color: 'rgba(255,255,255,0.7)', letterSpacing: 4,
        textShadow: '2px 2px 0 rgba(0,0,0,0.9)',
      }}>
        TURN {state.turn}
      </div>

      {/* Phase label */}
      <motion.div
        key={state.phase}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        style={{
          fontFamily: 'var(--px-font)', fontSize: 13,
          color, lineHeight: 1.3, letterSpacing: 1,
          textShadow: `0 0 14px ${color}88, 2px 2px 0 rgba(0,0,0,0.9)`,
        }}
      >
        {label}
      </motion.div>

      {ROW(`PHASE ${state.bossIndex + 1} / 3`, 'rgba(204,136,255,0.65)')}
      {ROW(`DECK  ${state.deck.length}`, 'rgba(204,136,255,0.65)')}

      {state.boss.id === 'wesker' && ROW(
        `♦ ${state.diamondsUsed}/3${state.weskerExposed ? ' — STUNNED!' : ' ISOLATION'}`, '#cc88ff',
      )}

      {state.boss.id === 'ai-adapter' && !state.jackpotUsed && (
        <div style={{ fontFamily: 'var(--px-font)', fontSize: 10, color: '#ff8844', letterSpacing: 1, lineHeight: 1.6, textShadow: '0 0 8px #ff884466' }}>
          IMMUNE TO ALL SUITS — play 🎩 JACKPOT to break immunity and deal damage
        </div>
      )}

      {/* Posture button — styled like right panel buttons */}
      <motion.button
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        onClick={() => setShowPlayerInfo(v => !v)}
        onMouseEnter={e => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.background = 'rgba(0,212,255,0.12)';
          b.style.borderColor = 'rgba(0,212,255,0.6)';
          b.style.boxShadow = '0 0 20px rgba(0,212,255,0.2)';
        }}
        onMouseLeave={e => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.background = 'rgba(0,212,255,0.06)';
          b.style.borderColor = 'rgba(0,212,255,0.3)';
          b.style.boxShadow = '0 0 12px rgba(0,212,255,0.08)';
        }}
        style={{
          marginTop: 6,
          fontFamily: 'var(--px-font)', fontSize: 9, letterSpacing: 2,
          padding: '10px 10px', cursor: 'pointer',
          background: 'rgba(0,212,255,0.06)',
          border: '1px solid rgba(0,212,255,0.3)',
          color: 'rgba(0,212,255,0.85)',
          borderRadius: 5, transition: 'all 0.15s',
          textShadow: '0 0 8px rgba(0,212,255,0.4)',
          boxShadow: '0 0 12px rgba(0,212,255,0.08)',
          width: '100%', textAlign: 'left', whiteSpace: 'nowrap',
        }}
      >
        ◈ POSTURE STATUS
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => onShowInfo?.()}
        onMouseEnter={e => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.background = 'rgba(0,212,255,0.12)';
          b.style.borderColor = 'rgba(0,212,255,0.6)';
          b.style.boxShadow = '0 0 20px rgba(0,212,255,0.2)';
        }}
        onMouseLeave={e => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.background = 'rgba(0,212,255,0.06)';
          b.style.borderColor = 'rgba(0,212,255,0.3)';
          b.style.boxShadow = '0 0 12px rgba(0,212,255,0.08)';
        }}
        style={{
          marginTop: 2,
          fontFamily: 'var(--px-font)', fontSize: 9, letterSpacing: 2,
          padding: '10px 10px', cursor: 'pointer',
          background: 'rgba(0,212,255,0.06)',
          border: '1px solid rgba(0,212,255,0.3)',
          color: 'rgba(0,212,255,0.85)',
          borderRadius: 5, transition: 'all 0.15s',
          textShadow: '0 0 8px rgba(0,212,255,0.4)',
          boxShadow: '0 0 12px rgba(0,212,255,0.08)',
          width: '100%', textAlign: 'left', whiteSpace: 'nowrap',
        }}
      >
        ◈ GAME INFO
      </motion.button>

      <AnimatePresence>
        {showPlayerInfo && <PostureStatusPopup onClose={() => setShowPlayerInfo(false)} />}
      </AnimatePresence>

      {/* AI Adapter jackpot hint */}
      {state.boss.id === 'ai-adapter' && !state.jackpotUsed && (
        <div style={{
          fontFamily: 'var(--px-font)', fontSize: 6,
          color: '#ff8844', letterSpacing: 1,
          textShadow: '0 0 8px #ff884466',
        }}>
          IMMUNE — USE <img src={JACKPOT_ICON} alt="" style={{ width: 14, height: 14, objectFit: 'contain', verticalAlign: 'middle', display: 'inline' }} />
        </div>
      )}
    </div>
  );
}

// ── Threat Intel popup ────────────────────────────────────
function ThreatIntelPopup({ onClose }: { onClose: () => void }) {
  const { state } = useCampaignContext();
  const tut         = useContext(TutorialCtx);
  const hideBossHp  = tut.open || state.bossIndex === 0;
  const boss        = state.boss;
  const bossHpPct   = Math.round(boss.hp / boss.maxHp * 100);
  const playerHpPct = Math.round(state.playerHp / state.playerMaxHp * 100);
  const bossColor   = bossHpPct > 60 ? '#33dd77' : bossHpPct > 25 ? '#ffd700' : '#ff4455';
  const playerColor = playerHpPct > 50 ? '#33dd77' : playerHpPct > 25 ? '#ffd700' : '#ff4455';
  const recentLog   = [...state.log].reverse().slice(0, 8);
  const logKindColor: Record<string, string> = {
    info: 'rgba(200,190,255,0.6)', damage: '#4da6ff',
    enemy: '#ff8844', boss: '#cc88ff', jackpot: '#ffd700',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        paddingBottom: 100,
      }}
    >
      {/* Arena overlay */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 300,
        background: 'rgba(10,0,16,0.18)', backdropFilter: 'blur(1px)', pointerEvents: 'none',
      }} />
      {/* HUD overlay */}
      <div style={{
        position: 'absolute', top: 'calc(100% - 300px)', left: 0, right: 0, bottom: 0,
        background: 'rgba(10,0,16,0.5)', backdropFilter: 'blur(3px)', pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative', zIndex: 1,
          width: 440, maxHeight: '68vh',
          background: 'linear-gradient(160deg, #100020 0%, #0a0016 100%)',
          border: '1px solid rgba(204,136,255,0.35)',
          boxShadow: '0 0 40px rgba(204,136,255,0.1), 0 24px 60px rgba(0,0,0,0.8)',
          borderRadius: 8,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 18px',
          borderBottom: '1px solid rgba(204,136,255,0.2)',
          background: 'rgba(204,136,255,0.06)',
          flexShrink: 0,
          position: 'relative', zIndex: 2,
        }}>
          <div style={{
            fontFamily: 'var(--px-font)', fontSize: 10,
            color: 'rgba(204,136,255,0.9)', letterSpacing: 4,
            textShadow: '0 0 14px rgba(204,136,255,0.5)',
          }}>
            ★ THREAT INTEL
          </div>
          <button
            onClick={onClose}
            style={{
              fontFamily: 'var(--px-font)', fontSize: 14, lineHeight: 1,
              color: 'rgba(204,136,255,0.5)', background: 'none', border: 'none',
              cursor: 'pointer', padding: '2px 4px', transition: 'color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ee88ff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(204,136,255,0.5)'; }}
          >✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Boss HP */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontFamily: 'var(--px-font)', fontSize: 9, color: bossColor, letterSpacing: 2, textShadow: `0 0 8px ${bossColor}66` }}>
                {boss.name}
              </div>
              <div style={{ fontFamily: 'var(--px-body-font)', fontSize: 14, fontWeight: 600, color: hideBossHp ? '#ff4455' : bossColor }}>
                {hideBossHp ? '???' : `${boss.hp} / ${boss.maxHp}`}
              </div>
            </div>
            {!hideBossHp && (
            <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
              <motion.div animate={{ width: `${bossHpPct}%` }} transition={{ duration: 0.4 }}
                style={{ height: '100%', background: bossColor, boxShadow: `0 0 6px ${bossColor}88` }} />
            </div>
            )}
            <div style={{ display: 'flex', gap: 14, fontFamily: 'var(--px-body-font)', fontSize: 13, fontWeight: 500 }}>
              <span style={{ color: '#ff8844' }}>⚡ {boss.atkMin}–{boss.atkMax}</span>
              <span style={{ color: playerColor }}>♥ {state.playerHp}/{state.playerMaxHp}</span>
              <span style={{ color: '#4da6ff' }}>💧 {state.mana}/{state.manaMax}</span>
            </div>
          </div>

          {/* Battle Log */}
          <div>
            <div style={{ fontFamily: 'var(--px-font)', fontSize: 8, color: 'rgba(255,255,255,0.38)', letterSpacing: 3, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 6, marginBottom: 8 }}>
              BATTLE LOG
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {recentLog.map((entry, i) => (
                <div key={entry.id} style={{
                  fontFamily: 'var(--px-body-font)', fontSize: 13, fontWeight: 500,
                  color: logKindColor[entry.kind] ?? 'rgba(200,190,255,0.6)',
                  opacity: 1 - i * 0.1, lineHeight: 1.4,
                }}>{entry.msg}</div>
              ))}
            </div>
          </div>

          {/* CVE Reference */}
          <div>
            <div style={{ fontFamily: 'var(--px-font)', fontSize: 8, color: 'rgba(204,136,255,0.8)', letterSpacing: 3, borderBottom: '1px solid rgba(204,136,255,0.22)', paddingBottom: 6, marginBottom: 8, textShadow: '0 0 8px rgba(204,136,255,0.4)' }}>
              ★ CVE REFERENCE
            </div>
            {/* TODO: replace with real per-encounter CVE data */}
            <div style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', columnGap: 20, rowGap: 5 }}>
              {([
                ['CVE ID',    'CVE-2024-21412'],
                ['CVSS',      '8.1 HIGH'],
                ['Source',    'CISA KEV / NVD'],
                ['Published', '2024-02-13'],
                ['Vendor',    'Microsoft'],
                ['System',    'Windows SmartScreen'],
                ['Vector',    'Network / User Interaction'],
                ['Patch',     'MS24-Feb Patch Tuesday'],
                ['MITRE',     'T1566.002 — Spear Phishing'],
                ['Status',    'Actively Exploited (ITW)'],
              ] as [string, string][]).map(([k, v]) => (
                <>
                  <span key={k + '-k'} style={{ fontFamily: 'var(--px-font)', fontSize: 7, color: 'rgba(204,136,255,0.5)', letterSpacing: 1, whiteSpace: 'nowrap' }}>{k}</span>
                  <span key={k + '-v'} style={{ fontFamily: 'var(--px-font)', fontSize: 7, color: 'rgba(230,210,255,0.85)', letterSpacing: 0.5 }}>{v}</span>
                </>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── AI Analysis Popup ─────────────────────────────────────
function AiAnalysisPopup({ onClose }: { onClose: () => void }) {
  const { state } = useCampaignContext();
  const boss      = state.boss;
  const hpPct     = state.playerHp / state.playerMaxHp;
  const manaPct   = state.mana / state.manaMax;
  const bossHpPct = boss.hp / boss.maxHp;

  const urgency =
    hpPct < 0.3  ? 'CRITICAL' :
    hpPct < 0.55 ? 'ELEVATED' :
    'NOMINAL';

  const urgencyColor =
    urgency === 'CRITICAL' ? '#ff4455' :
    urgency === 'ELEVATED' ? '#ffd700' :
    '#33dd77';

  const tactics: { label: string; detail: string; color: string }[] = [
    bossHpPct > 0.7
      ? { label: 'PRESSURE PHASE', detail: 'Boss integrity is high — expend mana aggressively on high-rank plays. Conserving now costs more later.', color: '#cc88ff' }
      : bossHpPct > 0.35
        ? { label: 'SUSTAINED ASSAULT', detail: 'Boss is weakened. Maintain card pressure while rationing mana for defensive draws.', color: '#ffd700' }
        : { label: 'FINISH SEQUENCE', detail: 'Boss below 35% — prioritize damage suits. Do not waste turns on recovery.', color: '#ff4455' },
    manaPct > 0.6
      ? { label: 'MANA SURPLUS', detail: 'Resource pool is healthy. Consider poker-hand combos for jackpot bonus damage.', color: '#33dd77' }
      : manaPct > 0.3
        ? { label: 'MANA WATCH', detail: 'Mid-tier mana. Favor low-cost suit plays to extend action economy.', color: '#ffd700' }
        : { label: 'MANA CRITICAL', detail: 'Mana depleted. Draw recovery cards before committing to attacks.', color: '#ff4455' },
    hpPct < 0.4
      ? { label: 'DEFENSE PRIORITY', detail: 'Player integrity low. Hearts and shield suits should take precedence over offense.', color: '#4da6ff' }
      : { label: 'FORWARD STANCE', detail: 'Player health stable. Maintain offensive tempo to reduce boss action window.', color: '#33dd77' },
    { label: 'OPTIMAL PLAY', detail: `Current boss (${boss.name}) attacks for ${boss.atkMin}–${boss.atkMax} dmg per turn. High-variance plays increase volatility — match risk to current HP margin.`, color: '#cc88ff' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        paddingBottom: 100,
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 300, background: 'rgba(10,0,16,0.18)', backdropFilter: 'blur(1px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 'calc(100% - 300px)', left: 0, right: 0, bottom: 0, background: 'rgba(10,0,16,0.5)', backdropFilter: 'blur(3px)', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative', zIndex: 1,
          width: 440, maxHeight: '68vh',
          background: 'linear-gradient(160deg, #0c0020 0%, #080018 100%)',
          border: '1px solid rgba(204,136,255,0.35)',
          boxShadow: '0 0 40px rgba(204,136,255,0.1), 0 24px 60px rgba(0,0,0,0.8)',
          borderRadius: 8,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 18px',
          borderBottom: '1px solid rgba(204,136,255,0.18)',
          background: 'rgba(204,136,255,0.05)',
          flexShrink: 0,
          position: 'relative', zIndex: 2,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontFamily: 'var(--px-font)', fontSize: 10, color: 'rgba(204,136,255,0.9)', letterSpacing: 4, textShadow: '0 0 14px rgba(204,136,255,0.5)' }}>
              ★ AI ANALYSIS
            </div>
            <div style={{ fontFamily: 'var(--px-font)', fontSize: 7, color: urgencyColor, letterSpacing: 2, padding: '2px 6px', border: `1px solid ${urgencyColor}55`, borderRadius: 3, textShadow: `0 0 6px ${urgencyColor}88` }}>
              {urgency}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ fontFamily: 'var(--px-font)', fontSize: 14, lineHeight: 1, color: 'rgba(204,136,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', transition: 'color 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ee88ff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(204,136,255,0.5)'; }}
          >✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Status snapshot */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {([
              { label: 'PLAYER HP', value: `${Math.round(hpPct * 100)}%`, color: hpPct > 0.5 ? '#33dd77' : hpPct > 0.25 ? '#ffd700' : '#ff4455' },
              { label: 'MANA', value: `${state.mana}/${state.manaMax}`, color: '#4da6ff' },
              { label: 'BOSS HP', value: `${Math.round(bossHpPct * 100)}%`, color: bossHpPct > 0.6 ? '#ff8844' : bossHpPct > 0.3 ? '#ffd700' : '#33dd77' },
            ] as { label: string; value: string; color: string }[]).map(({ label, value, color }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 4, padding: '8px 10px', border: `1px solid ${color}22` }}>
                <div style={{ fontFamily: 'var(--px-font)', fontSize: 6, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: 'var(--px-body-font)', fontSize: 16, fontWeight: 700, color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Tactic cards */}
          <div style={{ fontFamily: 'var(--px-font)', fontSize: 8, color: 'rgba(255,255,255,0.35)', letterSpacing: 3, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 6 }}>
            TACTICAL DIRECTIVES
          </div>
          {tactics.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 3, flexShrink: 0, alignSelf: 'stretch', background: t.color, borderRadius: 2, opacity: 0.7 }} />
              <div>
                <div style={{ fontFamily: 'var(--px-font)', fontSize: 8, color: t.color, letterSpacing: 2, marginBottom: 3, textShadow: `0 0 6px ${t.color}66` }}>{t.label}</div>
                <div style={{ fontFamily: 'var(--px-body-font)', fontSize: 12, color: 'rgba(210,200,240,0.75)', lineHeight: 1.55 }}>{t.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Mission Brief Popup ───────────────────────────────────
const BOSS_BRIEFS = [
  {
    codename: 'UNPATCHED VULNERABILITY',
    classification: 'PERSISTENCE THREAT',
    accentColor: '#cc88ff',
    overview: 'A self-replicating patch exploit that has embedded itself into core system processes. Presents as a legitimate update to evade signature detection.',
    objectives: [
      'Neutralize the exploit before it completes lateral movement to adjacent nodes.',
      'Prevent the boss from triggering its PATCH CYCLE ability (deals AoE mana drain).',
      'Maintain player HP above 40% entering the final phase.',
    ],
    mechanics: [
      { name: 'PATCH CYCLE', desc: 'Every 4 turns, boss drains 2 mana from all active suits.' },
      { name: 'INTEGRITY SHIELD', desc: 'Below 50% HP, boss gains +20% damage resistance for 2 turns.' },
      { name: 'REPLICATE', desc: 'On crit, boss spawns a shadow copy with 30% HP.' },
    ],
    intel: 'CVE-2024-21412 — Microsoft SmartScreen bypass. Actively exploited in the wild. CISA KEV listed.',
  },
  {
    codename: 'ROOTKIT WESKER',
    classification: 'ELITE INFILTRATION',
    accentColor: '#cc88ff',
    overview: 'A kernel-level rootkit with adaptive camouflage. Named for its ability to operate with absolute system authority — invisible to standard telemetry.',
    objectives: [
      'Expose hidden processes before the 7-minute containment window expires.',
      'Deplete boss HP while managing the escalating WESKER TIMER pressure.',
      'Do not allow boss to reach 0% player mana — triggers instant defeat.',
    ],
    mechanics: [
      { name: 'WESKER TIMER', desc: 'Hard 7-minute clock. Failure to defeat before timer = auto-loss.' },
      { name: 'ROOT ACCESS', desc: 'Boss ignores card defense effects when above 60% HP.' },
      { name: 'ADAPTIVE CLOAK', desc: 'Boss becomes untargetable for 1 turn when hit for >40 damage.' },
    ],
    intel: 'Mapped to APT29 TTP: T1014 (Rootkit). Persistence mechanism survives reboots via bootloader injection.',
  },
  {
    codename: 'AI ADAPTER',
    classification: 'COGNITIVE ADVERSARY',
    accentColor: '#cc88ff',
    overview: 'A generative adversarial system that learns card patterns in real time and adapts its attack vectors to counter observed strategies.',
    objectives: [
      'Defeat the boss before its ADAPTATION STACK exceeds 5 — at 5 stacks, boss goes immune.',
      'Vary suit selection to slow adaptation accumulation.',
      'Survive the TRANSFORMATION phase (boss enters enrage at 50% HP).',
    ],
    mechanics: [
      { name: 'ADAPTATION STACK', desc: 'Each repeated suit play adds 1 stack. At 5 stacks, boss immune to that suit.' },
      { name: 'TRANSFORMATION', desc: 'At 50% HP, boss enrages: +50% damage, visual effect active.' },
      { name: 'MIRROR MATRIX', desc: 'Boss copies the last card played and reflects it as bonus damage.' },
    ],
    intel: 'Novel threat class — no existing CVE. Internal designation CS-AI-001. Behavioral analysis ongoing.',
  },
];

function MissionBriefPopup({ onClose }: { onClose: () => void }) {
  const { state } = useCampaignContext();
  const brief = BOSS_BRIEFS[state.bossIndex] ?? BOSS_BRIEFS[0];
  const ac = brief.accentColor;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        paddingBottom: 100,
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 300, background: 'rgba(10,0,16,0.18)', backdropFilter: 'blur(1px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 'calc(100% - 300px)', left: 0, right: 0, bottom: 0, background: 'rgba(10,0,16,0.5)', backdropFilter: 'blur(3px)', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative', zIndex: 1,
          width: 460, maxHeight: '70vh',
          background: `linear-gradient(160deg, #0a0018 0%, #060012 100%)`,
          border: `1px solid ${ac}40`,
          boxShadow: `0 0 40px ${ac}12, 0 24px 60px rgba(0,0,0,0.85)`,
          borderRadius: 8,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 18px',
          borderBottom: `1px solid ${ac}25`,
          background: `${ac}08`,
          flexShrink: 0,
          position: 'relative', zIndex: 2,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--px-font)', fontSize: 7, color: `${ac}99`, letterSpacing: 3, marginBottom: 3 }}>
              {brief.classification}
            </div>
            <div style={{ fontFamily: 'var(--px-font)', fontSize: 11, color: ac, letterSpacing: 4, textShadow: `0 0 14px ${ac}88` }}>
              ★ {brief.codename}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ fontFamily: 'var(--px-font)', fontSize: 14, lineHeight: 1, color: 'rgba(204,136,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', transition: 'color 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ee88ff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(204,136,255,0.5)'; }}
          >✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Overview */}
          <div style={{ fontFamily: 'var(--px-body-font)', fontSize: 13, color: 'rgba(220,210,255,0.8)', lineHeight: 1.65, borderLeft: `2px solid ${ac}55`, paddingLeft: 12 }}>
            {brief.overview}
          </div>

          {/* Objectives */}
          <div>
            <div style={{ fontFamily: 'var(--px-font)', fontSize: 8, color: 'rgba(255,255,255,0.35)', letterSpacing: 3, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 6, marginBottom: 10 }}>
              OBJECTIVES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {brief.objectives.map((obj, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ fontFamily: 'var(--px-font)', fontSize: 8, color: ac, marginTop: 2, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</div>
                  <div style={{ fontFamily: 'var(--px-body-font)', fontSize: 13, color: 'rgba(210,200,240,0.8)', lineHeight: 1.5 }}>{obj}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Boss Mechanics */}
          <div>
            <div style={{ fontFamily: 'var(--px-font)', fontSize: 8, color: 'rgba(255,255,255,0.35)', letterSpacing: 3, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 6, marginBottom: 10 }}>
              SPECIAL MECHANICS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {brief.mechanics.map((m, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 4, padding: '8px 12px', border: `1px solid ${ac}18` }}>
                  <div style={{ fontFamily: 'var(--px-font)', fontSize: 8, color: ac, letterSpacing: 2, marginBottom: 4, textShadow: `0 0 6px ${ac}66` }}>{m.name}</div>
                  <div style={{ fontFamily: 'var(--px-body-font)', fontSize: 12, color: 'rgba(200,195,230,0.7)', lineHeight: 1.5 }}>{m.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Intel footer */}
          <div style={{ fontFamily: 'var(--px-font)', fontSize: 7, color: 'rgba(204,136,255,0.55)', letterSpacing: 1, lineHeight: 1.6, paddingTop: 4, borderTop: '1px solid rgba(204,136,255,0.12)' }}>
            ◈ INTEL: {brief.intel}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Hand demo / intel panel (right side — button stack) ───
function HandDemoPanel({ openPanel, setOpenPanel }: { openPanel: 'threat' | 'ai' | 'mission' | null; setOpenPanel: (v: 'threat' | 'ai' | 'mission' | null) => void }) {
  const { state } = useCampaignContext();

  if (state.phase === 'boss-intro') return <div style={{ width: 280, flexShrink: 0 }} />;

  const btnStyle = (color: string) => ({
    fontFamily: 'var(--px-font)', fontSize: 9, letterSpacing: 4,
    color: `rgba(${color},0.85)`,
    background: `rgba(${color},0.06)`,
    border: `1px solid rgba(${color},0.3)`,
    borderRadius: 5,
    padding: '10px 18px',
    cursor: 'pointer',
    textShadow: `0 0 8px rgba(${color},0.4)`,
    boxShadow: `0 0 12px rgba(${color},0.08)`,
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
    width: '100%',
    textAlign: 'left' as const,
  });

  const onHover = (e: React.MouseEvent<HTMLButtonElement>, color: string, enter: boolean) => {
    const b = e.currentTarget;
    if (enter) {
      b.style.background = `rgba(${color},0.12)`;
      b.style.borderColor = `rgba(${color},0.6)`;
      b.style.boxShadow = `0 0 20px rgba(${color},0.2)`;
    } else {
      b.style.background = `rgba(${color},0.06)`;
      b.style.borderColor = `rgba(${color},0.3)`;
      b.style.boxShadow = `0 0 12px rgba(${color},0.08)`;
    }
  };

  return (
    <div style={{
      width: 280, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      justifyContent: 'flex-start', alignSelf: 'stretch',
      paddingTop: 16, paddingBottom: 16, gap: 8,
      paddingRight: 8,
    }}>
      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        onClick={() => setOpenPanel('mission')}
        style={btnStyle('204,136,255')}
        onMouseEnter={e => onHover(e, '204,136,255', true)}
        onMouseLeave={e => onHover(e, '204,136,255', false)}
      >
        ★ MISSION BRIEF
      </motion.button>

      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        onClick={() => setOpenPanel('threat')}
        style={btnStyle('204,136,255')}
        onMouseEnter={e => onHover(e, '204,136,255', true)}
        onMouseLeave={e => onHover(e, '204,136,255', false)}
      >
        ★ THREAT INTEL
      </motion.button>

      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        onClick={() => setOpenPanel('ai')}
        style={btnStyle('204,136,255')}
        onMouseEnter={e => onHover(e, '204,136,255', true)}
        onMouseLeave={e => onHover(e, '204,136,255', false)}
      >
        ★ AI ANALYSIS
      </motion.button>

      {/* Live Signal Feed */}
      <div style={{
        marginTop: 4,
        background: 'rgba(204,136,255,0.04)',
        border: '1px solid rgba(204,136,255,0.15)',
        borderRadius: 5,
        overflow: 'hidden',
        flex: 1,
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          fontFamily: 'var(--px-font)', fontSize: 7, letterSpacing: 3,
          color: 'rgba(204,136,255,0.55)',
          padding: '8px 12px 6px',
          borderBottom: '1px solid rgba(204,136,255,0.1)',
          flexShrink: 0,
        }}>
          ★ SIGNAL FEED
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <AnimatePresence initial={false}>
            {[...state.log].reverse().slice(0, 12).map((entry, i) => {
              const color =
                entry.kind === 'damage'  ? '#cc88ff' :
                entry.kind === 'enemy'   ? '#ff8877' :
                entry.kind === 'boss'    ? '#dd99ff' :
                entry.kind === 'jackpot' ? '#ffd700' :
                'rgba(200,185,230,0.45)';
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1 - i * 0.07, x: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    fontFamily: 'var(--px-body-font)', fontSize: 11, fontWeight: 500,
                    color, lineHeight: 1.45,
                  }}
                >
                  {entry.msg}
                </motion.div>
              );
            })}
          </AnimatePresence>
          {state.log.length === 0 && (
            <div style={{ fontFamily: 'var(--px-body-font)', fontSize: 11, color: 'rgba(204,136,255,0.25)', fontStyle: 'italic' }}>
              Awaiting activity...
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

// ── Boss intro overlay ─────────────────────────────────────
function BossIntroOverlay() {
  const { state, continueIntro } = useCampaignContext();
  const [imgFallback, setImgFallback] = useState(false);
  // AI Adapter transform states: 'idle' | 'transforming' | 'done'
  const [adapterTransform, setAdapterTransform] = useState<'idle' | 'transforming' | 'done'>('idle');

  // Reset fallback + transform state when boss changes
  useEffect(() => {
    setImgFallback(false);
    setAdapterTransform('idle');
  }, [state.bossIndex]);

  if (state.phase !== 'boss-intro' || !state.dialogueText) return null;

  const boss = state.boss;
  const delay = boss.introText.length * 0.034 + 0.8;
  const isAdapter = state.bossIndex === 2;

  // When BATTLE START is clicked for AI Adapter: run transform, then continue
  const handleBattleStart = () => {
    if (isAdapter && adapterTransform === 'idle') {
      setAdapterTransform('transforming');
      // After 1.5s glitch effect → show final sprite briefly → start battle
      setTimeout(() => setAdapterTransform('done'), 1500);
      setTimeout(() => continueIntro(), 2200);
    } else {
      continueIntro();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: isAdapter && adapterTransform === 'transforming'
          ? 'rgba(0,0,0,0.97)'
          : 'rgba(0,0,0,0.93)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 24,
        transition: 'background 0.3s',
      }}
    >
      {/* Cyan/purple radial overlay during transform */}
      {isAdapter && adapterTransform === 'transforming' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.7, 0.4, 0.9, 0.3, 0.8, 0] }}
          transition={{ duration: 1.5, times: [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1] }}
          style={{
            position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at center, rgba(0,255,220,0.22) 0%, rgba(120,0,255,0.18) 50%, transparent 80%)',
          }}
        />
      )}

      <div style={{
        fontFamily: 'var(--px-font)', fontSize: 7,
        color: 'rgba(255,200,40,0.45)', letterSpacing: 6,
        opacity: adapterTransform !== 'idle' ? 0 : 1,
        transition: 'opacity 0.3s',
      }}>
        — PHASE {state.bossIndex + 1} —
      </div>

      {/* Boss sprite area */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <motion.div
          animate={adapterTransform === 'idle' ? { scale: [1, 1.05, 1], y: [0, -7, 0] } : { scale: 1, y: 0 }}
          transition={{ duration: 2.5, repeat: adapterTransform === 'idle' ? Infinity : 0 }}
          style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}
        >
          {state.bossIndex === 0 ? (
            <SystemPatchBoss />
          ) : isAdapter ? (
            <>
              {/* Transform image — shown during idle + transforming */}
              <motion.img
                src={AI_ADAPTER_TRANSFORM_IMG}
                onError={() => setImgFallback(true)}
                animate={adapterTransform === 'transforming'
                  ? { opacity: [1, 0.8, 1, 0.3, 0.9, 0], filter: [
                      'brightness(1.2) hue-rotate(0deg)',
                      'brightness(3) hue-rotate(90deg)',
                      'brightness(1) hue-rotate(180deg)',
                      'brightness(4) hue-rotate(270deg)',
                      'brightness(2) hue-rotate(360deg)',
                      'brightness(0)',
                    ] }
                  : adapterTransform === 'done'
                    ? { opacity: 0 }
                    : { opacity: 1 }
                }
                transition={{ duration: adapterTransform === 'transforming' ? 1.5 : 0.3 }}
                style={{
                  height: 280, width: 'auto',
                  imageRendering: 'pixelated',
                  mixBlendMode: 'screen',
                  position: adapterTransform === 'done' ? 'absolute' : 'relative',
                }}
              />
              {/* Final aiadapter.png — revealed after transform */}
              {adapterTransform !== 'idle' && (
                <motion.img
                  src={imgFallback ? AI_ADAPTER_FALLBACK : AI_ADAPTER_IMG}
                  onError={() => setImgFallback(true)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: adapterTransform === 'done' ? 1 : 0 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    height: 280, width: 'auto',
                    imageRendering: 'pixelated',
                    mixBlendMode: 'screen',
                    filter: 'brightness(1.4) contrast(1.1) drop-shadow(0 0 40px rgba(0,220,255,0.7))',
                  }}
                />
              )}
            </>
          ) : (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Crimson radial aura */}
              <div style={{
                position: 'absolute',
                width: 260, height: 260,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(220,30,30,0.22) 0%, rgba(180,10,10,0.12) 45%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              <img
                key={state.bossIndex}
                src={imgFallback ? WESKER_FALLBACK : WESKER_IMG}
                onError={() => setImgFallback(true)}
                style={{
                  height: 300,
                  width: 'auto',
                  imageRendering: 'pixelated',
                  mixBlendMode: 'screen',
                  clipPath: 'inset(65px 0 0 0)',
                  filter: 'brightness(1.25) contrast(1.1)',
                }}
              />
            </div>
          )}
        </motion.div>

        {/* Glitch bars during transform */}
        {isAdapter && adapterTransform === 'transforming' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none', overflow: 'hidden' }}>
            {[0, 1, 2, 3, 4].map(i => (
              <motion.div
                key={i}
                animate={{ x: [0, i % 2 === 0 ? 40 : -40, 0, i % 2 === 0 ? -20 : 20, 0], opacity: [0, 1, 0.6, 1, 0] }}
                transition={{ duration: 0.18, repeat: 8, delay: i * 0.06, repeatDelay: 0.1 }}
                style={{
                  position: 'absolute',
                  top: `${12 + i * 18}%`, left: 0, right: 0,
                  height: 6 + i * 2,
                  background: i % 2 === 0 ? 'rgba(0,255,220,0.8)' : 'rgba(180,0,255,0.7)',
                  mixBlendMode: 'screen',
                  opacity: 0,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div style={{
        fontFamily: 'var(--px-font)', fontSize: 22,
        color: adapterTransform === 'transforming' ? '#00ffdd' : '#ffd700',
        textShadow: adapterTransform === 'transforming'
          ? '0 0 28px #00ffddaa, 3px 3px 0 #000'
          : '0 0 28px #ffd70066, 3px 3px 0 #000',
        letterSpacing: 6, textAlign: 'center',
        transition: 'color 0.3s',
        opacity: adapterTransform !== 'idle' ? 0 : 1,
      }}>
        {boss.name}
      </div>

      <div style={{
        maxWidth: 540, padding: '16px 24px',
        border: '2px solid rgba(255,200,40,0.35)',
        background: 'rgba(8,5,0,0.75)',
        borderRadius: 4,
        fontFamily: 'var(--px-font)', fontSize: 9,
        color: 'rgba(255,255,255,0.85)',
        lineHeight: 1.9, letterSpacing: 0.8,
        textAlign: 'center',
        boxShadow: '0 0 24px rgba(255,200,40,0.08)',
        opacity: adapterTransform !== 'idle' ? 0 : 1,
        transition: 'opacity 0.3s',
      }}>
        "<Typewriter text={state.dialogueText} speed={34} />"
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: adapterTransform !== 'idle' ? 0 : 1 }}
        transition={{ delay: adapterTransform === 'idle' ? delay : 0 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={handleBattleStart}
        disabled={adapterTransform !== 'idle'}
        style={{
          fontFamily: 'var(--px-font)', fontSize: 9, letterSpacing: 4,
          padding: '12px 40px', cursor: adapterTransform !== 'idle' ? 'default' : 'pointer',
          background: 'rgba(255,200,40,0.08)',
          border: '2px solid rgba(255,200,40,0.65)',
          color: '#ffd700',
          textShadow: '0 0 10px rgba(255,200,40,0.7)',
          boxShadow: '4px 4px 0 #000',
          borderRadius: 2,
        }}
      >
        [ BATTLE START ]
      </motion.button>
    </motion.div>
  );
}

// ── Defeat message banner (shown during 1s defeat-pending window) ──
function DefeatMessageBanner() {
  const { state } = useCampaignContext();
  if (state.phase !== 'defeat-pending' || !state.dialogueText) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 490,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div style={{
        fontFamily: 'var(--px-font)', fontSize: 11,
        color: '#ffd700',
        textShadow: '0 0 20px #ffd70066, 2px 2px 0 #000',
        letterSpacing: 3,
        textAlign: 'center',
        padding: '14px 32px',
        background: 'rgba(0,0,0,0.72)',
        border: '1px solid rgba(255,215,0,0.3)',
        borderRadius: 3,
        maxWidth: 440,
      }}>
        {state.dialogueText}
      </div>
    </motion.div>
  );
}

// ── Phase clear overlay ────────────────────────────────────
function PhaseClearOverlay() {
  const { state, advance } = useCampaignContext();
  const [imgFallback, setImgFallback] = useState(false);

  if (state.phase !== 'phase-clear') return null;

  // Show the defeated boss
  const defeatedBossSprite = state.bossIndex === 0
    ? <SystemPatchBoss />
    : (
      <motion.img
        key={state.bossIndex}
        src={imgFallback
          ? (state.bossIndex === 1 ? WESKER_FALLBACK : AI_ADAPTER_FALLBACK)
          : (state.bossIndex === 1 ? WESKER_IMG     : AI_ADAPTER_IMG)}
        onError={() => setImgFallback(true)}
        animate={{ opacity: [0.6, 0.15, 0.6], filter: ['hue-rotate(0deg) brightness(1.2)', 'hue-rotate(120deg) brightness(0.7)', 'hue-rotate(0deg) brightness(1.2)'] }}
        transition={{ duration: 1.8, repeat: Infinity }}
        style={{
          height: state.bossIndex === 1 ? 200 : 240,
          width: 'auto',
          imageRendering: 'pixelated',
          mixBlendMode: 'screen',
        }}
      />
    );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,8,0,0.93)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 20,
      }}
    >
      {/* Defeated boss (flickering) */}
      <div style={{ opacity: 0.65 }}>
        {defeatedBossSprite}
      </div>

      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{
          fontFamily: 'var(--px-font)', fontSize: 22,
          color: '#33dd77',
          textShadow: '0 0 28px #33dd7799, 3px 3px 0 #000',
          letterSpacing: 5,
        }}
      >
        {state.dialogueText ?? 'THREAT DEFEATED'}
      </motion.div>
      {/* "NEXT ENEMY" for phases 0 & 1, "FINISH" after the final boss */}
      <motion.button
        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
        onClick={advance}
        style={{
          fontFamily: 'var(--px-font)', fontSize: 9, letterSpacing: 4,
          padding: '12px 40px', cursor: 'pointer',
          background: 'rgba(51,221,119,0.08)',
          border: '2px solid rgba(51,221,119,0.65)',
          color: '#33dd77',
          boxShadow: '4px 4px 0 #000', borderRadius: 2,
        }}
      >
        {state.bossIndex < 2 ? '[ NEXT ENEMY ]' : '[ FINISH ]'}
      </motion.button>
    </motion.div>
  );
}

// ── Battle Log Overlay ─────────────────────────────────────
function BattleLogOverlay({ log, onClose }: { log: CampaignLogEntry[]; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 600,
        background: 'rgba(0,0,0,0.96)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 0 20px',
      }}
    >
      <div style={{ fontFamily: 'var(--px-font)', fontSize: 14, color: '#ffd700', letterSpacing: 5, marginBottom: 24, textShadow: '0 0 20px #ffd70066' }}>
        BATTLE LOG
      </div>
      <div style={{
        flex: 1, overflowY: 'auto', width: '100%', maxWidth: 760,
        padding: '0 32px', display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        {[...log].reverse().map(entry => {
          const col = entry.kind === 'damage' ? '#ff4455' : entry.kind === 'boss' ? '#ffd700' : '#4da6ff';
          return (
            <div key={entry.id} style={{
              fontFamily: 'var(--px-font)', fontSize: 12,
              color: col, letterSpacing: 1, lineHeight: 1.7,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              padding: '5px 0',
              opacity: 0.9,
            }}>
              {entry.msg}
            </div>
          );
        })}
      </div>
      <motion.button
        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={onClose}
        style={{
          marginTop: 24, fontFamily: 'var(--px-font)', fontSize: 8, letterSpacing: 3,
          padding: '10px 32px', cursor: 'pointer',
          background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.25)',
          color: 'rgba(255,255,255,0.6)', boxShadow: '3px 3px 0 #000', borderRadius: 2,
        }}
      >
        [ CLOSE ]
      </motion.button>
    </motion.div>
  );
}

// ── Victory overlay → Thank You Screen ─────────────────────
// After all three threats are defeated, show the full-screen
// ThankYouScreen with the background carousel and logo text.
function VictoryOverlay() {
  const { state, restart, onBack } = useCampaignContext();
  if (state.phase !== 'victory') return null;
  return <ThankYouScreen onRestart={restart} onBack={onBack ?? undefined} />;
}

function GameOverOverlay() {
  const { state, restart, onBack } = useCampaignContext();
  const [showLog, setShowLog] = useState(false);
  if (state.phase !== 'game-over') return null;
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(8,0,0,0.95)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 24,
        }}
      >
        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.6, repeat: Infinity }}
          style={{ fontFamily: 'var(--px-font)', fontSize: 22, color: '#ff4455', textShadow: '0 0 28px #ff445599, 3px 3px 0 #000', letterSpacing: 7 }}>
          GAME OVER
        </motion.div>
        <div style={{ fontFamily: 'var(--px-font)', fontSize: 7, color: 'rgba(255,255,255,0.3)', letterSpacing: 3 }}>PLAYER HP DEPLETED</div>
        <div style={{ display: 'flex', gap: 14 }}>
          <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={restart}
            style={{ fontFamily: 'var(--px-font)', fontSize: 9, letterSpacing: 3, padding: '12px 36px', cursor: 'pointer', background: 'rgba(255,68,85,0.08)', border: '2px solid rgba(255,68,85,0.65)', color: '#ff4455', boxShadow: '4px 4px 0 #000', borderRadius: 2 }}>
            [ TRY AGAIN ]
          </motion.button>
          <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={() => setShowLog(true)}
            style={{ fontFamily: 'var(--px-font)', fontSize: 9, letterSpacing: 2, padding: '12px 28px', cursor: 'pointer', background: 'rgba(77,166,255,0.08)', border: '2px solid rgba(77,166,255,0.5)', color: '#4da6ff', boxShadow: '4px 4px 0 #000', borderRadius: 2 }}>
            [ REVIEW LOG ]
          </motion.button>
          {onBack && (
            <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={onBack}
              style={{ fontFamily: 'var(--px-font)', fontSize: 9, letterSpacing: 2, padding: '12px 28px', cursor: 'pointer', background: 'rgba(204,136,255,0.08)', border: '2px solid rgba(204,136,255,0.5)', color: '#cc88ff', boxShadow: '4px 4px 0 #000', borderRadius: 2 }}>
              [ ANALYST MODE ]
            </motion.button>
          )}
        </div>
      </motion.div>
      {showLog && <BattleLogOverlay log={state.log} onClose={() => setShowLog(false)} />}
    </>
  );
}

// ── Info overlay helpers ────────────────────────────────────
const bodyText: import('react').CSSProperties = {
  fontSize: 14, color: 'rgba(220,210,255,0.72)', lineHeight: 1.75, marginBottom: 6,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontFamily: 'var(--px-font)', fontSize: 7,
        color: '#cc88ff', letterSpacing: 3,
        borderBottom: '1px solid rgba(204,136,255,0.18)',
        paddingBottom: 6, marginBottom: 12,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function SuitRow({ color, sym, name, desc }: { color: string; sym: string; name: string; desc: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 8, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 20, color, flexShrink: 0, lineHeight: 1.4 }}>{sym}</span>
      <div>
        <span style={{ fontFamily: 'var(--px-body-font)', fontWeight: 700, fontSize: 14, color, letterSpacing: 1 }}>{name}</span>
        <span style={{ fontFamily: 'var(--px-body-font)', fontSize: 13, color: 'rgba(220,210,255,0.62)', marginLeft: 8 }}>{desc}</span>
      </div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul style={{ paddingLeft: 18, margin: 0 }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontFamily: 'var(--px-body-font)', fontSize: 14, color: 'rgba(220,210,255,0.72)', lineHeight: 1.75 }}>{item}</li>
      ))}
    </ul>
  );
}

function BossRow({ name, color, desc }: { name: string; color: string; desc: string }) {
  return (
    <div style={{
      marginBottom: 10, padding: '8px 12px',
      background: `${color}0d`, borderLeft: `3px solid ${color}88`,
    }}>
      <div style={{ fontFamily: 'var(--px-font)', fontSize: 7, color, letterSpacing: 2, marginBottom: 4 }}>{name}</div>
      <div style={{ fontFamily: 'var(--px-body-font)', fontSize: 13, color: 'rgba(220,210,255,0.65)', lineHeight: 1.6 }}>{desc}</div>
    </div>
  );
}

const WESKER_DURATION = 7 * 60; // 420 seconds

// ── Tutorial Highlight Overlay ─────────────────────────────
// Layout constants matching the HUD structure
const HUD_H        = 300;   // bottom HUD height
const LEFT_PANEL_W = 235;   // HandPhasePanel (200px) + left padding (20px) + button overhang buffer
const RIGHT_PANEL_W = 300;  // HandDemoPanel (280px) + right padding + buffer to avoid overlap with right buttons

const OV: React.CSSProperties = {
  position: 'fixed',
  background: 'rgba(0, 0, 10, 0.74)',
  backdropFilter: 'blur(3px)',
  pointerEvents: 'all',
  zIndex: 36,
};

function HlBorder({ style }: { style: React.CSSProperties }) {
  return (
    <motion.div
      animate={{ opacity: [0.45, 1, 0.45] }}
      transition={{ duration: 1.4, repeat: Infinity }}
      style={{
        position: 'fixed', zIndex: 37, pointerEvents: 'none',
        border: '2px solid rgba(204,136,255,0.8)',
        borderRadius: 6,
        boxShadow: '0 0 28px rgba(204,136,255,0.35), inset 0 0 20px rgba(204,136,255,0.07)',
        ...style,
      }}
    />
  );
}

function HighlightOverlay({ highlight }: { highlight: TutorialHighlight }) {
  if (highlight === 'cards') {
    return (
      <>
        {/* Darken everything above HUD */}
        <div style={{ ...OV, top: 0, left: 0, right: 0, bottom: HUD_H }} />
        {/* Darken left panel (HandPhasePanel) */}
        <div style={{ ...OV, bottom: 0, left: 0, width: LEFT_PANEL_W, height: HUD_H }} />
        {/* Darken right panel (HandDemoPanel) */}
        <div style={{ ...OV, bottom: 0, right: 0, width: RIGHT_PANEL_W, height: HUD_H }} />
        {/* Pulsing border around card zone */}
        <HlBorder style={{ bottom: 0, left: LEFT_PANEL_W, right: RIGHT_PANEL_W, height: HUD_H }} />
      </>
    );
  }

  if (highlight === 'intel') {
    const zW = 318, zR = 0;
    return (
      <>
        {/* Above HUD */}
        <div style={{ ...OV, top: 0, left: 0, right: 0, bottom: HUD_H }} />
        {/* Left portion of HUD (everything except intel panel) */}
        <div style={{ ...OV, bottom: 0, left: 0, right: zW + zR, height: HUD_H }} />
        <HlBorder style={{ bottom: 0, right: zR, width: zW, height: HUD_H }} />
      </>
    );
  }

  // 'full' — full-screen overlay, no clear zone
  if (highlight === 'full') return <div style={{ ...OV, top: 0, left: 0, right: 0, bottom: 0 }} />;

  // null — no overlay at all (game stays fully visible)
  return null;
}

// ── Tutorial Modal ──────────────────────────────────────────
function TutorialModal({ step, onStepChange, onClose }: {
  step: number;
  onStepChange: (s: number) => void;
  onClose: () => void;
}) {
  const current = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', zIndex: 400,
        ...(step === 0
          ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
          : step === 1
            ? { bottom: HUD_H + 16, left: '50%', transform: 'translateX(-50%)' }
            : step === 2
              ? { top: 120, left: '50%', transform: 'translateX(-50%)' }
              : step === 3
                ? { top: '50%', left: 'calc(50% - 48px)', transform: 'translateY(-50%)' }
                : step === 4
                  ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
                  : step === 5
                    ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
                    : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
        ),
        pointerEvents: 'none',
      }}
    >
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        style={{
          width: step === 0 ? 580 : 460,
          background: 'linear-gradient(160deg, #100020 0%, #0a0016 100%)',
          border: '1px solid rgba(204,136,255,0.3)',
          borderRadius: 10,
          boxShadow: '0 0 40px rgba(204,136,255,0.15), 0 20px 60px rgba(0,0,0,0.8)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          pointerEvents: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px 12px',
          borderBottom: '1px solid rgba(204,136,255,0.12)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>{current.icon}</span>
            <span style={{
              fontFamily: 'var(--px-font)', fontSize: 8,
              color: '#cc88ff', letterSpacing: 3,
              textShadow: '0 0 10px rgba(204,136,255,0.5)',
            }}>
              {current.title}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--px-font)', fontSize: 14,
              color: 'rgba(204,136,255,0.4)', lineHeight: 1,
              padding: '2px 6px', transition: 'color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(204,136,255,0.9)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(204,136,255,0.4)'; }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '16px 20px', maxHeight: step === 0 ? 440 : 260 }}>
          {'body' in current && current.body && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {current.body.split('\n\n').map((para, i) => (
                <p key={i} style={{
                  fontFamily: 'var(--px-body-font)', fontSize: step === 0 ? 14 : 13,
                  lineHeight: 1.75, color: 'rgba(255,255,255,0.75)', margin: 0,
                }}>
                  {para}
                </p>
              ))}
            </div>
          )}
          {'lines' in current && current.lines && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {current.lines.map((line, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{
                    fontFamily: 'var(--px-font)', fontSize: 12, color: line.color,
                    textShadow: `0 0 8px ${line.color}66`,
                    flexShrink: 0, width: 18, textAlign: 'center', marginTop: 1,
                  }}>{line.sym}</span>
                  <div>
                    <span style={{
                      fontFamily: 'var(--px-font)', fontSize: 7,
                      color: line.color, letterSpacing: 2,
                      textShadow: `0 0 6px ${line.color}44`,
                    }}>{line.label} </span>
                    <span style={{
                      fontFamily: 'var(--px-body-font)', fontSize: 12,
                      color: 'rgba(255,255,255,0.6)', lineHeight: 1.6,
                    }}>— {line.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {'tips' in current && current.tips && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {current.tips.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: '#ffd700', fontFamily: 'var(--px-font)', fontSize: 8, flexShrink: 0, marginTop: 2 }}>►</span>
                  <span style={{ fontFamily: 'var(--px-body-font)', fontSize: 13, color: 'rgba(255,255,255,0.68)', lineHeight: 1.6 }}>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 18px',
          borderTop: '1px solid rgba(204,136,255,0.1)',
          flexShrink: 0,
        }}>
          {/* Step dots */}
          <div style={{ display: 'flex', gap: 6 }}>
            {TUTORIAL_STEPS.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 14 : 6, height: 6, borderRadius: 3,
                background: i === step ? '#cc88ff' : 'rgba(204,136,255,0.2)',
                transition: 'all 0.2s',
                boxShadow: i === step ? '0 0 6px #cc88ff88' : 'none',
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {step > 0 && (
              <button
                onClick={() => onStepChange(step - 1)}
                style={{
                  fontFamily: 'var(--px-font)', fontSize: 7, letterSpacing: 2,
                  padding: '7px 14px', cursor: 'pointer',
                  background: 'none',
                  border: '1px solid rgba(204,136,255,0.25)',
                  color: 'rgba(204,136,255,0.5)', borderRadius: 4,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.color = '#cc88ff'; b.style.borderColor = 'rgba(204,136,255,0.6)'; }}
                onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.color = 'rgba(204,136,255,0.5)'; b.style.borderColor = 'rgba(204,136,255,0.25)'; }}
              >← BACK</button>
            )}
            {step === 2 ? null : !isLast ? (
              <button
                onClick={() => onStepChange(step + 1)}
                style={{
                  fontFamily: 'var(--px-font)', fontSize: 7, letterSpacing: 2,
                  padding: '7px 14px', cursor: 'pointer',
                  background: 'rgba(204,136,255,0.1)',
                  border: '1px solid rgba(204,136,255,0.4)',
                  color: '#cc88ff', borderRadius: 4,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(204,136,255,0.2)'; b.style.borderColor = '#cc88ff'; }}
                onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(204,136,255,0.1)'; b.style.borderColor = 'rgba(204,136,255,0.4)'; }}
              >NEXT →</button>
            ) : (
              <button
                onClick={onClose}
                style={{
                  fontFamily: 'var(--px-font)', fontSize: 7, letterSpacing: 2,
                  padding: '7px 18px', cursor: 'pointer',
                  background: 'rgba(204,136,255,0.18)',
                  border: '1px solid #cc88ff',
                  color: '#cc88ff', borderRadius: 4,
                  boxShadow: '0 0 12px rgba(204,136,255,0.25)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(204,136,255,0.3)'; b.style.boxShadow = '0 0 20px rgba(204,136,255,0.45)'; }}
                onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(204,136,255,0.18)'; b.style.boxShadow = '0 0 12px rgba(204,136,255,0.25)'; }}
              >★ GOT IT — LET'S GO</button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Root component ─────────────────────────────────────────
export default function SimulationTable({ initialRanks, onBack }: { initialRanks?: Record<string, number>; onBack?: () => void }) {
  // Map SOC suit names (clover/spade/diamond/heart) → simulation suit names
  const mappedRanks = initialRanks ? {
    clubs:    initialRanks.clover   ?? 8,
    spades:   initialRanks.spade    ?? 9,
    diamonds: initialRanks.diamond  ?? 7,
    hearts:   initialRanks.heart    ?? 10,
  } : undefined;

  const campaign = useCampaign(mappedRanks);
  const { state } = campaign;

  const [navVisible, setNavVisible] = useState(false);

  // ── Wesker 7-minute countdown ──────────────────────────
  const [weskerTimeLeft, setWeskerTimeLeft] = useState(WESKER_DURATION);
  const weskerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const isWeskerBattle =
      state.boss.id === 'wesker' &&
      state.phase !== 'boss-intro' &&
      state.phase !== 'defeat-pending' &&
      state.phase !== 'phase-clear' &&
      state.phase !== 'victory' &&
      state.phase !== 'game-over';

    if (!isWeskerBattle) {
      // Clear timer when Wesker fight is over
      if (weskerTimerRef.current) {
        clearInterval(weskerTimerRef.current);
        weskerTimerRef.current = null;
      }
      // Reset counter when entering a new fight
      if (state.boss.id !== 'wesker') setWeskerTimeLeft(WESKER_DURATION);
      return;
    }

    // Start countdown if not already running
    if (weskerTimerRef.current) return;
    weskerTimerRef.current = setInterval(() => {
      setWeskerTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(weskerTimerRef.current!);
          weskerTimerRef.current = null;
          campaign.weskerTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (weskerTimerRef.current) {
        clearInterval(weskerTimerRef.current);
        weskerTimerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.boss.id, state.phase]);

  const selectCardWithSfx = useCallback((id: string) => {
    const card = state.cardOptions.find(c => c.id === id);
    if (card) {
      const sfxId = CARD_SFX[card.suit];
      if (sfxId) SfxPlayer.playId(sfxId);
    }
    campaign.selectCard(id);
  }, [campaign, state.cardOptions]);

  const triggerJackpotWithSfx = useCallback(() => {
    campaign.triggerJackpot();
  }, [campaign]);

  const ctx: CampaignCtxValue = {
    state,
    continueIntro:  campaign.continueIntro,
    drawCard:       campaign.drawCard,
    drawSuit:       campaign.drawSuit,
    selectCard:     selectCardWithSfx,
    advance:        campaign.advance,
    triggerJackpot: triggerJackpotWithSfx,
    restart:        campaign.restart,
    weskerTimeLeft,
    onBack,
  };

  // Tab hidden → mute
  useEffect(() => {
    const h = () => MusicManager.setMute(document.hidden);
    document.addEventListener('visibilitychange', h);
    return () => document.removeEventListener('visibilitychange', h);
  }, []);

  // main-ui theme is already playing from SimulationMode — let it run
  // Boss-specific music takes over once the battle starts (see audio sync below)

  // ── Audio sync per boss phase ─────────────────────────
  const prevPhaseRef = useRef(state.phase);
  const prevBossRef  = useRef(state.bossIndex);

  useEffect(() => {
    const { phase, bossIndex } = state;
    const prevPhase = prevPhaseRef.current;

    // ── Boss intro starts → silence music, fire intro SFX immediately ──
    if (phase === 'boss-intro' && prevPhase !== 'boss-intro') {
      MusicManager.stop(); // no music overlapping the dialogue textbox
      if (bossIndex === 1) {
        // Wesker: "7 minutes" plays the instant his textbox appears
        SfxPlayer.playId('wesker7mins');
      } else if (bossIndex === 2) {
        // AI Adapter: transformation + roar plays when textbox appears
        SfxPlayer.playSequence([SFX.aiAdapterTransform, SFX.aiAdapterBeginning]);
      }
    }

    // ── Battle start → switch to boss battle music ──
    if (phase === 'player-draw' && prevPhase === 'boss-intro') {
      if (bossIndex === 0) MusicManager.setTrack('system-patch');
      else if (bossIndex === 1) MusicManager.setTrack('wesker');
      else if (bossIndex === 2) MusicManager.setTrack('ai-adapter');
      if (bossIndex === 0 && !localStorage.getItem('cs_tutorial_done')) {
        setTutorialOpen(true);
        setTutorialStep(0);
      }
    }

    // Enemy attacks SFX
    if (phase === 'enemy-attack' && prevPhase === 'resolve') {
      SfxPlayer.stopAll(); // clear any residual card SFX before enemy attack
      if (bossIndex === 2 && state.adapterAdapting) {
        // AI Adapter: adapting.mp3 for 1s, THEN attack SFX
        SfxPlayer.playId('adapting');
        setTimeout(() => SfxPlayer.play(SFX.virusAttack), 1000);
      } else {
        SfxPlayer.play(SFX.virusAttack);
      }
    }

    // Boss defeated — stop music on defeat-pending (the 1s delay window before overlay)
    if (phase === 'defeat-pending' && prevPhase !== 'defeat-pending') {
      MusicManager.stop();
      SfxPlayer.stopAll(); // cut off any card SFX before defeat stinger
      SfxPlayer.play(SFX.virusDefeat);
    }

    // Victory — stop all music + any in-flight card SFX, then play stinger
    if (phase === 'victory') {
      MusicManager.stop();
      SfxPlayer.stopAll(); // cut off card SFX so it doesn't overlay victoryse
      SfxPlayer.playId('victorySe');
    }

    // Game over — stop all music + any in-flight card SFX, then play stinger
    if (phase === 'game-over' && prevPhase !== 'game-over') {
      MusicManager.stop();
      SfxPlayer.stopAll(); // cut off card SFX so it doesn't overlay defeat stinger
      SfxPlayer.play(SFX.virusDefeat);
    }

    prevPhaseRef.current = phase;
    prevBossRef.current  = bossIndex;
  }, [state.phase, state.bossIndex, state.adapterAdapting]);

  // Auto-advance non-interactive phases
  useEffect(() => {
    const { phase } = state;
    if (phase === 'resolve') {
      const t = setTimeout(() => campaign.advance(), 900);
      return () => clearTimeout(t);
    }
    if (phase === 'enemy-attack') {
      // AI Adapter adapting: 1s "ADAPTING" + 1s attack animation = 2200ms before player can act
      const delay = (state.boss.id === 'ai-adapter' && state.adapterAdapting) ? 2200 : 1200;
      const t = setTimeout(() => campaign.advance(), delay);
      return () => clearTimeout(t);
    }
  }, [state.phase]);

  const [showInfo, setShowInfo] = useState(false);
  const [openPanel, setOpenPanel] = useState<'threat' | 'ai' | 'mission' | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  return (
    <TutorialCtx.Provider value={{ step: tutorialStep, open: tutorialOpen, advance: () => setTutorialStep(s => Math.min(s + 1, TUTORIAL_STEPS.length - 1)) }}>
    <CampaignCtx.Provider value={ctx}>
      {/* Background */}
      <CasinoBackground />

      {/* CRT scanlines */}
      <div className="px-scanlines" style={{ position: 'fixed', inset: 0, zIndex: 55, pointerEvents: 'none' }} />

      {/* Invisible hover trigger zone at top of screen */}
      <div
        style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 8, zIndex: 59, pointerEvents: 'auto' }}
        onMouseEnter={() => setNavVisible(true)}
      />

      {/* Top bar — slides in on hover, matches analyze topbar style */}
      <div
        onMouseLeave={() => setNavVisible(false)}
        className="topbar"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 58,
          borderRadius: 0,
          justifyContent: 'center',
          transform: navVisible ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.25s ease',
        }}>
        <div className="tb-mode-toggle">
          <button className="tb-mode-btn" onClick={onBack}>● ANALYZE</button>
          <button className="tb-mode-btn active">○ SIMULATE</button>
        </div>
      </div>

      {/* Phase prompt moved to bottom hand section */}

      {/* Wesker 7-min countdown — centered top */}
      <WeskerTimer />

      {/* HP bars TOP RIGHT */}
      <HpBars />

      {/* Battle arena characters (background) */}
      <BattleArena />

      {/* Bottom hand — phase panel | D-pad | demo panel */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 300, zIndex: 30,
        background: 'linear-gradient(180deg, rgba(10,0,16,0) 0%, rgba(10,0,16,0.82) 28%, rgba(10,0,16,0.97) 100%)',
        borderTop: '1px solid rgba(204,136,255,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
      }}>
        {/* HUD / character-display divider — Mad Hatter lavender */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent 0%, rgba(204,136,255,0.15) 20%, rgba(204,136,255,0.5) 50%, rgba(204,136,255,0.15) 80%, transparent 100%)',
          pointerEvents: 'none',
        }} />
        <HandPhasePanel onShowInfo={() => setShowInfo(true)} />
        <CardHand />
        <HandDemoPanel openPanel={openPanel} setOpenPanel={setOpenPanel} />
      </div>

      {/* System Compromised flash */}
      <SystemCompromisedBanner />

      {/* Wesker stunned banner */}
      <WeskerStunnedBanner />

      {/* Tutorial */}
      <AnimatePresence>
        {tutorialOpen && (
          <>
            <HighlightOverlay highlight={TUTORIAL_STEPS[tutorialStep].highlight} />
            <TutorialModal
              step={tutorialStep}
              onStepChange={setTutorialStep}
              onClose={() => { setTutorialOpen(false); setTutorialStep(0); localStorage.setItem('cs_tutorial_done', '1'); }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Overlays */}
      <BossIntroOverlay />
      <DefeatMessageBanner />
      <PhaseClearOverlay />
      <VictoryOverlay />
      <GameOverOverlay />

      {/* Info overlay */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setShowInfo(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 900,
              background: 'rgba(2,1,8,0.82)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {/* Panel — stop click-through */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}
              style={{
                position: 'relative',
                width: 680, maxHeight: '82vh',
                background: 'linear-gradient(160deg, #0c0720 0%, #080514 100%)',
                border: '1px solid rgba(204,136,255,0.35)',
                boxShadow: '0 0 60px rgba(160,80,255,0.2), 0 24px 80px rgba(0,0,0,0.8)',
                borderRadius: 6,
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Header bar */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 22px',
                borderBottom: '1px solid rgba(204,136,255,0.18)',
                background: 'rgba(150,80,255,0.07)',
                flexShrink: 0,
              }}>
                <div style={{
                  fontFamily: 'var(--px-font)', fontSize: 9,
                  color: '#ffd700', letterSpacing: 4,
                  textShadow: '0 0 12px rgba(255,210,40,0.5)',
                }}>
                  ★ SIMULATION — FIELD GUIDE
                </div>
                <button
                  onClick={() => setShowInfo(false)}
                  style={{
                    fontFamily: 'var(--px-body-font)', fontWeight: 700,
                    fontSize: 20, lineHeight: 1,
                    color: 'rgba(200,180,255,0.6)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', padding: '2px 6px',
                    transition: 'color 0.1s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(200,180,255,0.6)'; }}
                >
                  ✕
                </button>
              </div>

              {/* Scrollable content */}
              <div style={{
                flex: 1, overflowY: 'auto', padding: '24px 28px',
                fontFamily: 'var(--px-body-font)',
              }}>

                <Section title="WHAT IS SIMULATION MODE?">
                  <p style={bodyText}>A poker-themed cybersecurity posture battle. You play as a security analyst using playing cards to defend against escalating threat scenarios. Each suit maps to a real cyber defense strategy.</p>
                </Section>

                <Section title="THE FOUR SUITS">
                  <SuitRow color="#4da6ff"  sym="♠" name="SPADES — OFFENSIVE"  desc="Deal direct damage to the active threat. High-rank Spades cost mana." />
                  <SuitRow color="#33dd77"  sym="♣" name="CLUBS — RESOURCE"   desc="Restore your mana pool. Always free to play. Fuel your bigger attacks." />
                  <SuitRow color="#ff4455"  sym="♥" name="HEARTS — RESILIENCE" desc="Recover HP. Higher ranks restore more health." />
                  <SuitRow color="#cc88ff"  sym="♦" name="DIAMONDS — HARDEN"  desc="Build armor stacks that absorb incoming damage. Costs mana." />
                </Section>

                <Section title="HOW TO WIN">
                  <BulletList items={[
                    'Reduce boss HP to zero before your own HP hits zero.',
                    'Manage mana — Spades and Diamonds drain it fast.',
                    'Use Clubs to refuel when low, then strike hard.',
                    'The 🎩 Jackpot unlocks at Turn 13 — save it for the right moment.',
                  ]} />
                </Section>

                <Section title="BOSS MECHANICS">
                  <BossRow name="UNPATCHED VULNERABILITY" color="#33dd77"
                    desc="Knowledge test. Only ♠ Spades deal damage. Any other suit triggers SYSTEM COMPROMISED — a penalty hit." />
                  <BossRow name="WESKER" color="#ffd700"
                    desc="Play 7× ♦ Diamonds to expose him. Once exposed, Spades deal 3× damage. 7-minute countdown active." />
                  <BossRow name="AI ADAPTER" color="#4da6ff"
                    desc="Immune to Spades entirely. The only way to defeat it is the 🎩 Jackpot ability." />
                </Section>

                <div style={{
                  marginTop: 28, padding: '10px 14px',
                  background: 'rgba(255,136,68,0.07)',
                  borderLeft: '3px solid #ff8844',
                  fontFamily: 'var(--px-body-font)', fontSize: 13,
                  color: 'rgba(255,180,100,0.75)', lineHeight: 1.6,
                }}>
                  ⚠ This guide is a work in progress and will change as the simulation evolves.
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mission brief / threat intel / AI popups — rendered at root level so they stack above WeskerTimer */}
      <AnimatePresence>
        {openPanel === 'threat'  && <ThreatIntelPopup   onClose={() => setOpenPanel(null)} />}
        {openPanel === 'ai'      && <AiAnalysisPopup    onClose={() => setOpenPanel(null)} />}
        {openPanel === 'mission' && <MissionBriefPopup  onClose={() => setOpenPanel(null)} />}
      </AnimatePresence>
    </CampaignCtx.Provider>
    </TutorialCtx.Provider>
  );
}
