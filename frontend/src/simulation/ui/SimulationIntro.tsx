// ============================================================
// simulation/ui/SimulationIntro.tsx
// Full-bleed artwork background, curtains, 4 suit cards +
// Joker card (clickable) to start the simulation.
// ============================================================

import { useEffect, useState, useCallback, useRef } from 'react'; // useRef kept for introTimers
import { motion, AnimatePresence } from 'framer-motion';
import { MusicManager } from '../audio/MusicManager';
import CardArt from '../../components/CardArt';
import JokerCardSVG from '../../components/JokerCardSVG';
import './pixel.css';
import '../../styles/counterstack.css';

type Phase = 'open' | 'cards' | 'title' | 'ready';


function Curtain({ side }: { side: 'left' | 'right' }) {
  const isLeft = side === 'left';
  return (
    <motion.div
      initial={{ x: isLeft ? -80 : 80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
      style={{
        position: 'absolute', top: 0, bottom: 0,
        [side]: 0, width: 160,
        background: `repeating-linear-gradient(
          90deg,
          #160000 0px, #520000 10px,
          #8b0000 16px, #660000 22px,
          #380000 32px, #160000 44px
        )`,
        boxShadow: isLeft
          ? 'inset -28px 0 55px rgba(0,0,0,0.88), 4px 0 18px rgba(0,0,0,0.6)'
          : 'inset  28px 0 55px rgba(0,0,0,0.88), -4px 0 18px rgba(0,0,0,0.6)',
        zIndex: 2,
      }}
    >
      <div style={{
        position: 'absolute', [isLeft ? 'right' : 'left']: 4,
        top: '35%', width: 3,
        background: 'linear-gradient(#c9a22766, #c9a227cc, #c9a22766)',
        borderRadius: 2, bottom: '35%',
      }} />
      <div style={{
        position: 'absolute', [isLeft ? 'right' : 'left']: -3,
        top: '42%', width: 10, height: 10, borderRadius: '50%',
        background: 'radial-gradient(#ffd700, #8a6000)',
        boxShadow: '0 0 8px #ffd70077',
      }} />
    </motion.div>
  );
}

interface Props {
  onStart: () => void;
  initialRanks?: Record<string, number>;
}

const BRIEF_SUITS = [
  { key: 'clover',  sym: '♣', color: '#10B981', label: 'HEALTH'   },
  { key: 'spade',   sym: '♠', color: '#EF4444', label: 'ATTACK'   },
  { key: 'diamond', sym: '♦', color: '#3B82F6', label: 'DEFENSE'  },
  { key: 'heart',   sym: '♥', color: '#EC4899', label: 'RECOVERY' },
];
const DEFAULT_RANKS: Record<string,number> = { clover:7, spade:7, diamond:7, heart:7 };
const RANK_NAMES = ['','A','2','3','4','5','6','7','8','9','10','J','Q','K'];

function briefHand(ranks: Record<string,number>): { hand: string; score: number } {
  const vals = Object.values(ranks);
  const counts: Record<number,number> = {};
  vals.forEach(v => counts[v] = (counts[v]||0)+1);
  const freq = Object.values(counts).sort((a,b)=>b-a);
  const sorted = [...vals].sort((a,b)=>a-b);
  const isStr = sorted[3]-sorted[0]===3 && new Set(sorted).size===4;
  if(vals.every(v=>v>=11)) return {hand:'ROYAL FLUSH',score:100};
  if(freq[0]===4) return {hand:'FOUR OF A KIND',score:92};
  if(freq[0]===3&&freq[1]===2) return {hand:'FULL HOUSE',score:84};
  if(isStr) return {hand:'STRAIGHT',score:76};
  if(freq[0]===3) return {hand:'THREE OF A KIND',score:65};
  if(freq[0]===2&&freq[1]===2) return {hand:'TWO PAIR',score:54};
  if(freq[0]===2) return {hand:'ONE PAIR',score:40};
  return {hand:'HIGH CARD',score:Math.round(vals.reduce((a,b)=>a+b,0)/4*5)};
}

export default function SimulationIntro({ onStart, initialRanks }: Props) {
  const [phase, setPhase] = useState<Phase>('open');
  const [jokerHover, setJokerHover] = useState(false);
  const introTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t = setTimeout(() => MusicManager.init(), 120);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('cards'), 300);
    const t2 = setTimeout(() => setPhase('title'), 900);
    const t3 = setTimeout(() => setPhase('ready'), 1800);
    introTimers.current = [t1, t2, t3];
    return () => { introTimers.current.forEach(clearTimeout); };
  }, []);

  const handleStart = useCallback(() => {
    MusicManager.init();
    onStart();
  }, [onStart]);

  return (

    <div
      className="px-root"
      style={{
        position: 'fixed', inset: 0, zIndex: 500, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 50, paddingBottom: 20,
      }}
    >
      {/* ── Full-bleed background art ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: 'url(/assets/sprites/mainuisimulation.png), url(/assets/sprites/mainuisimulation.jpg), url(/assets/sprites/intro-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }} />

      {/* Dark vignette overlay for readability */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.68) 100%)',
      }} />

      {/* CRT scanlines */}
      <div className="px-scanlines" style={{ zIndex: 3 }} />

      {/* Curtains */}
      <Curtain side="left" />
      <Curtain side="right" />

      {/* ── TOP LEFT: HIGH STAKES ROOM label ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        style={{
          position: 'absolute', top: 18, left: 180, zIndex: 10,
          fontFamily: 'var(--px-font)', fontSize: 7,
          color: '#ffd700', letterSpacing: 3,
          textShadow: '0 0 12px rgba(255,200,40,0.7), 2px 2px 0 #000',
          whiteSpace: 'nowrap',
        }}
      >
        ★ HIGH STAKES ROOM ★
      </motion.div>

      {/* ── Centre: title + joker start card ── */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 24, paddingBottom: 16 }}>

        {/* Title marquee */}
        <AnimatePresence>
          {(phase === 'title' || phase === 'ready') && (
            <motion.div
              initial={{ opacity: 0, y: 80, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              style={{ textAlign: 'center' }}
            >
              {/* Top marquee dots */}
              <div style={{ display: 'flex', gap: 9, justifyContent: 'center', marginBottom: 10 }}>
                {Array.from({ length: 13 }, (_, i) => (
                  <motion.div key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.06 }}
                    style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: i % 3 === 0 ? '#ffd700' : i % 3 === 1 ? '#ff6644' : '#ffaa00',
                      boxShadow: `0 0 4px ${i % 3 === 0 ? '#ffd700' : '#ff8844'}`,
                    }}
                  />
                ))}
              </div>
              <div style={{ fontFamily: 'var(--px-font)', fontSize: 21, letterSpacing: 5, color: '#fff8e0', textShadow: '0 0 12px rgba(255,220,80,0.5), 3px 3px 0 #000', lineHeight: 1.15 }}>
                COUNTER
              </div>
              <div style={{ fontFamily: 'var(--px-font)', fontSize: 21, letterSpacing: 5, color: '#00d4ff', textShadow: '0 0 16px rgba(0,212,255,0.85), 3px 3px 0 #000', lineHeight: 1.2, marginBottom: 6 }}>
                STACK
              </div>
              {/* Bottom marquee dots */}
              <div style={{ display: 'flex', gap: 9, justifyContent: 'center', marginTop: 6 }}>
                {Array.from({ length: 13 }, (_, i) => (
                  <motion.div key={i}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.06 }}
                    style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: i % 3 === 0 ? '#ffd700' : i % 3 === 1 ? '#ff6644' : '#ffaa00',
                      boxShadow: `0 0 4px ${i % 3 === 0 ? '#ffd700' : '#ff8844'}`,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Joker card — the start button ── */}
        <AnimatePresence>
          {phase === 'ready' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
            >
              {/* Pulse hint */}
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{
                  fontFamily: 'var(--px-font)', fontSize: 8,
                  color: '#fff', letterSpacing: 3,
                  textShadow: '0 0 10px #cc88ff, 2px 2px 0 #000',
                  background: 'rgba(0,0,0,.65)', borderRadius: 4, padding: '3px 12px',
                }}
              >
                CLICK THE JOKER TO BEGIN
              </motion.div>

              {/* Joker card button */}
              <motion.button
                onClick={handleStart}
                onMouseEnter={() => setJokerHover(true)}
                onMouseLeave={() => setJokerHover(false)}
                animate={{
                  y: jokerHover ? -10 : 0,
                  filter: jokerHover
                    ? 'drop-shadow(0 0 30px #f72585) drop-shadow(0 0 60px #f7258588)'
                    : 'drop-shadow(0 0 12px #f7258566)',
                }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'block' }}
              >
                <div
                  className="joker-card"
                  style={{
                    pointerEvents: 'none',
                    width: 110, height: 154,
                    position: 'relative',
                    borderRadius: 10,
                    overflow: 'hidden',
                    background: 'linear-gradient(145deg,#0c0008 0%,#200016 45%,#0c0008 100%)',
                    border: '2px solid rgba(247,37,133,.65)',
                    boxShadow: '0 0 30px rgba(247,37,133,.3),0 0 60px rgba(247,37,133,.1)',
                  }}
                >
                  <JokerCardSVG style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: 'inherit', zIndex: 0 }} />
                  <div className="jc-holo" style={{ zIndex: 1 }} />
                </div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── SOC Brief with CardArt SVGs — bottom section ── */}
      <AnimatePresence>
        {phase !== 'open' && (() => {
          const ranks = initialRanks ?? DEFAULT_RANKS;
          const { hand, score } = briefHand(ranks);
          return (
            <motion.div
              key="soc-brief"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'relative', zIndex: 8,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              }}
            >
              {/* Label */}
              {initialRanks && (
                <div style={{
                  fontFamily: 'var(--px-font)', fontSize: 8, color: '#fff', letterSpacing: 3,
                  textShadow: '0 0 12px #cc88ff, 2px 2px 0 #000',
                  background: 'rgba(0,0,0,.65)', borderRadius: 4, padding: '3px 10px',
                }}>
                  ◈ ANALYST BRIEF — ENTERING WITH
                </div>
              )}

              {/* Card row with CardArt SVGs */}
              <div style={{ display: 'flex', gap: 12 }}>
                {BRIEF_SUITS.map((s, i) => (
                  <motion.div
                    key={s.key}
                    initial={{ x: (1.5 - i) * 100, y: 20, opacity: 0, rotate: (i - 1.5) * 25 }}
                    animate={{ x: 0, y: 0, opacity: 1, rotate: (i - 1.5) * 3 }}
                    whileHover={{ y: -3, scale: 1.06, rotate: 0, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.75, delay: 0.08 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      cursor: 'default',
                    }}
                  >
                    {/* CardArt SVG card — matches SOC SuitCard styling */}
                    <motion.div
                      whileHover={{ boxShadow: `0 0 28px ${s.color}55, 0 0 56px ${s.color}22, inset 0 0 24px ${s.color}08` }}
                      style={{
                        width: 88, height: 124,
                        borderRadius: 9, overflow: 'hidden',
                        background: '#050a10',
                        border: `1.5px solid ${s.color}44`,
                        boxShadow: `0 0 10px ${s.color}22`,
                        position: 'relative',
                        flexShrink: 0,
                        transition: 'box-shadow 0.3s',
                      }}>
                      {/* CardArt SVG fills the face */}
                      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                        <CardArt suitKey={s.key} color={s.color} rank={ranks[s.key] ?? 7} />
                      </div>
                      {/* Holo shimmer — matches .card-holo */}
                      <div style={{
                        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
                        background: 'linear-gradient(135deg, transparent 25%, rgba(255,255,255,0.04) 50%, transparent 75%)',
                        animation: 'holo 5s ease-in-out infinite',
                      }} />
                    </motion.div>
                    {/* Rank label below card */}
                    <span style={{
                      fontFamily: 'var(--px-font)', fontSize: 7, color: s.color,
                      textShadow: `0 0 6px ${s.color}88`, letterSpacing: 1,
                    }}>
                      {RANK_NAMES[ranks[s.key] ?? 7]}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Hand + score */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                style={{
                  fontFamily: 'var(--px-font)', fontSize: 8, color: '#fff',
                  letterSpacing: 2, textShadow: '0 0 8px rgba(180,79,255,.6)',
                  background: 'rgba(3,0,7,.7)',
                  border: '1px solid rgba(180,79,255,.25)',
                  borderRadius: 6, padding: '4px 14px',
                }}
              >
                {hand} — {score}/100
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
