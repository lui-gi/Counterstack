// ============================================================
// MagicianSprite.tsx — player character sprite
// ============================================================

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function MagicianSprite({ size = 1 }: { size?: number }) {
  const [useFallback, setUseFallback] = useState(false);

  return (
    <motion.img
      src={useFallback ? '/assets/sprites/IMG_4302.png' : '/assets/sprites/magiciansimulation.png'}
      onError={() => setUseFallback(true)}
      animate={{ y: [0, -9, 0] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        height: 260 * size,
        width: 'auto',
        objectFit: 'contain',
        filter: 'drop-shadow(0 0 22px rgba(200,140,255,0.55)) drop-shadow(0 0 8px rgba(180,120,255,0.4))',
        imageRendering: 'pixelated',
      }}
      draggable={false}
    />
  );
}
