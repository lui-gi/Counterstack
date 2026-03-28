import React from 'react';

export interface AIAdapterAnimationState {
  currentSprite: 'idle' | 'adapting' | 'attack' | 'damage';
  isAnimating: boolean;
  shakeDirection: 'forward' | 'backward' | null;
  animationStartTime: number;
  animationDuration: number;
}

interface AIAdapterSpriteProps {
  animationState: AIAdapterAnimationState;
  size?: number;
}

export function AIAdapterSprite({ animationState, size = 1 }: AIAdapterSpriteProps) {
  const spriteMap: Record<string, string> = {
    idle: '/assets/sprites/aiadapter/idle.gif',
    adapting: '/assets/sprites/aiadapter/reactions/adapt.png',
    attack: '/assets/sprites/aiadapter/actions/attack.png',
    damage: '/assets/sprites/aiadapter/reactions/damage.png',
  };

  const shakeClass = animationState.isAnimating
    ? `shake-${animationState.shakeDirection}`
    : '';

  const w = 280 * size;
  const h = 280 * size;

  return (
    <div
      className={`aiadapter-sprite ${shakeClass}`}
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
