import React from 'react';

export interface WeskerAnimationState {
  currentSprite: 'idle' | 'attack' | 'damage' | 'stun';
  isAnimating: boolean;
  shakeDirection: 'forward' | 'backward' | null;
  animationStartTime: number;
  animationDuration: number;
}

interface WeskerSpriteProps {
  animationState: WeskerAnimationState;
  size?: number;
}

export function WeskerSprite({ animationState, size = 1 }: WeskerSpriteProps) {
  const spriteMap: Record<string, string> = {
    idle: '/assets/sprites/wesker/idle.png',
    attack: '/assets/sprites/wesker/actions/attack.png',
    damage: '/assets/sprites/wesker/reactions/damage.png',
    stun: '/assets/sprites/wesker/reactions/stun.png',
  };

  const shakeClass = animationState.isAnimating
    ? `shake-${animationState.shakeDirection}`
    : '';

  const w = 240 * size;
  const h = 360 * size;

  return (
    <div
      className={`wesker-sprite ${shakeClass}`}
      style={{
        backgroundImage: `url('${spriteMap[animationState.currentSprite]}')`,
        width: w,
        height: h,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        imageRendering: 'pixelated',
        position: 'relative',
      }}
    />
  );
}
