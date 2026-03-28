import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export interface FloatingIndicatorProps {
  value: number;
  type: 'damage' | 'healing' | 'extra-damage' | 'mana';
  x: number;
  y: number;
  id?: string; // Optional unique ID for tracking
}

const typeColors: Record<string, string> = {
  damage: '#ff4455',
  healing: '#33dd77',
  'extra-damage': '#cc88ff',
  mana: '#4da6ff',
};

const typeIcons: Record<string, string> = {
  'extra-damage': '↑⚔',
  mana: '+',
};

interface FloatingIndicatorRendererProps extends FloatingIndicatorProps {
  onComplete?: () => void;
}

export function FloatingIndicator({ value, type, x, y, onComplete }: FloatingIndicatorRendererProps) {
  const color = typeColors[type];
  const icon = typeIcons[type];
  const displayValue = icon ? `${icon} ${value}` : value.toString();

  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 0, y: -60 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.6, ease: 'easeOut' }}
      onAnimationComplete={onComplete}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        pointerEvents: 'none',
        zIndex: 999,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--px-font)',
          fontSize: type === 'extra-damage' ? 14 : 12,
          fontWeight: 700,
          color,
          letterSpacing: 2,
          textShadow: `0 0 8px ${color}cc, 0 0 16px ${color}77, 2px 2px 0 #000`,
          whiteSpace: 'nowrap',
        }}
      >
        {displayValue}
      </div>
    </motion.div>
  );
}

interface FloatingIndicatorManagerProps {
  indicators: FloatingIndicatorProps[];
  onRemove: (index: number) => void;
}

export function FloatingIndicatorManager({ indicators, onRemove }: FloatingIndicatorManagerProps) {
  return (
    <AnimatePresence>
      {indicators.map((indicator, index) => (
        <FloatingIndicator
          key={`${indicator.type}-${indicator.x}-${indicator.y}-${index}`}
          {...indicator}
          onComplete={() => onRemove(index)}
        />
      ))}
    </AnimatePresence>
  );
}
