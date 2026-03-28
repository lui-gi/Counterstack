import React from 'react';
import { motion } from 'framer-motion';

export interface CharacterAnimationState {
  currentSprite: 'idle' | 'clover' | 'diamond' | 'heart' | 'spade' | 'damage';
  isAnimating: boolean;
  shakeDirection: 'forward' | 'backward' | null;
  animationStartTime: number;
  animationDuration: number;
}

interface CharacterSpriteProps {
  animationState: CharacterAnimationState;
  size?: number;
}

const SPRITE_MAP: Record<string, string> = {
  idle:    '/assets/sprites/character/idle.png',
  clover:  '/assets/sprites/character/actions/clover.png',
  diamond: '/assets/sprites/character/actions/diamond.png',
  heart:   '/assets/sprites/character/actions/heart.png',
  spade:   '/assets/sprites/character/actions/spade.png',
  damage:  '/assets/sprites/character/reactions/damage.png',
};

export function CharacterSprite({ animationState, size = 1 }: CharacterSpriteProps) {
  const src = SPRITE_MAP[animationState.currentSprite] ?? SPRITE_MAP.idle;
  const isDamage = animationState.currentSprite === 'damage';

  return (
    <motion.img
      key={animationState.currentSprite}
      src={src}
      animate={isDamage
        ? { x: [-6, 6, -4, 4, 0] }
        : { y: [0, -9, 0] }
      }
      transition={isDamage
        ? { duration: 0.4, ease: 'easeInOut' }
        : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }
      }
      style={{
        height: 260 * size,
        width: 'auto',
        objectFit: 'contain',
        filter: 'drop-shadow(0 0 22px rgba(200,140,255,0.55)) drop-shadow(0 0 8px rgba(180,120,255,0.4))',
        imageRendering: 'pixelated',
        display: 'block',
      }}
      draggable={false}
    />
  );
}
