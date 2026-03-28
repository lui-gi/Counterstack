import React from 'react';

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

export function CharacterSprite({ animationState, size = 1 }: CharacterSpriteProps) {
  const spriteMap: Record<string, string> = {
    idle: '/assets/sprites/character/idle.png',
    clover: '/assets/sprites/character/actions/clover.png',
    diamond: '/assets/sprites/character/actions/diamond.png',
    heart: '/assets/sprites/character/actions/heart.png',
    spade: '/assets/sprites/character/actions/spade.png',
    damage: '/assets/sprites/character/reactions/damage.png',
  };

  const shakeClass = animationState.isAnimating
    ? `shake-${animationState.shakeDirection}`
    : '';

  const w = 200 * size;
  const h = 300 * size;

  return (
    <div
      className={`character-sprite ${shakeClass}`}
      style={{
        backgroundImage: `url('${spriteMap[animationState.currentSprite]}')`,
        width: w,
        height: h,
      }}
    />
  );
}
