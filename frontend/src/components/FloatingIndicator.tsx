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
      initial={{ opacity: 1, y: 0, scale: 1.3 }}
      animate={{ opacity: 0, y: -90, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2.0, ease: 'easeOut' }}
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
          fontSize: type === 'extra-damage' ? 22 : type === 'damage' ? 26 : 20,
          fontWeight: 700,
          color,
          letterSpacing: 2,
          textShadow: `0 0 12px ${color}, 0 0 28px ${color}bb, 3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000`,
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
