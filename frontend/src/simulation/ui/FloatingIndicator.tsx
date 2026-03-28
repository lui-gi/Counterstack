import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export interface FloatingIndicatorProps {
  value: number;
  type: 'damage' | 'healing' | 'extra-damage' | 'mana';
  x: number;
  y: number;
  onComplete?: () => void;
}

export function FloatingIndicator({ value, type, x, y, onComplete }: FloatingIndicatorProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 1600);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const getColor = () => {
    switch (type) {
      case 'damage':
        return '#ff4455';
      case 'healing':
        return '#33dd77';
      case 'extra-damage':
        return '#cc88ff';
      case 'mana':
        return '#4da6ff';
      default:
        return '#ffffff';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'damage':
        return '';
      case 'healing':
        return '';
      case 'extra-damage':
        return '↑ ⚔';
      case 'mana':
        return '+';
      default:
        return '';
    }
  };

  const displayValue = type === 'mana' ? `+${value}` : value;
  const color = getColor();
  const icon = getIcon();

  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 0, y: -60 }}
      transition={{ duration: 1.6, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        pointerEvents: 'none',
        fontFamily: 'var(--px-font)',
        fontSize: 14,
        fontWeight: 'bold',
        color: color,
        textShadow: `0 0 8px ${color}99, 2px 2px 0 #000`,
        letterSpacing: 1,
        zIndex: 999,
      }}
    >
      {icon && <span style={{ marginRight: 4 }}>{icon}</span>}
      {displayValue}
    </motion.div>
  );
}

export interface FloatingIndicatorManagerProps {
  indicators: FloatingIndicatorProps[];
  onRemove: (index: number) => void;
}

export function FloatingIndicatorManager({ indicators, onRemove }: FloatingIndicatorManagerProps) {
  return (
    <>
      {indicators.map((indicator, idx) => (
        <FloatingIndicator
          key={`${indicator.x}-${indicator.y}-${idx}`}
          {...indicator}
          onComplete={() => onRemove(idx)}
        />
      ))}
    </>
  );
}
