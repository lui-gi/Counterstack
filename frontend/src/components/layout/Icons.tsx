// ============================================================
// Icons.tsx — Inline SVG suit icons (no file paths, no <img>)
// All colors match the neon tokens from tailwind.config.ts
// ============================================================

import type { SuitName } from '../../interfaces/SuitName.interface';
import type { SuitIconProps } from '../../interfaces/SuitIconProps.interface';

export type { SuitName };

// Neon fill colors — match tailwind.config.ts tokens exactly
const SUIT_FILL: Record<SuitName, string> = {
  clubs:    '#10B981',
  diamonds: '#3B82F6',
  hearts:   '#EC4899',
  spades:   '#EF4444',
};

// Clean SVG paths for each suit at a 24×24 viewBox
const SUIT_PATH: Record<SuitName, string> = {
  // Three-circle club with stem
  clubs:
    'M12 4C10.3 4 9 5.3 9 7c0 .85.33 1.6.87 2.17C7.68 9.47 6 11.1 6 13c0 2.2 1.8 4 4 4 ' +
    '-.07.52-.3 1.42-1 2h6c-.7-.58-.93-1.48-1-2 2.2 0 4-1.8 4-4 0-1.9-1.68-3.53-3.87-3.83 ' +
    'C14.67 8.6 15 7.85 15 7c0-1.7-1.3-3-3-3z',

  // Rotated square (rhombus)
  diamonds:
    'M12 2L21.5 12 12 22 2.5 12z',

  // Classic heart
  hearts:
    'M12 21.6C7.8 18.1 2 13.9 2 8.5 2 5.4 4.4 3 7.5 3c1.74 0 3.41.9 4.5 2.3 ' +
    'C13.09 3.9 14.76 3 16.5 3 19.6 3 22 5.4 22 8.5c0 5.4-5.8 9.6-10 13.1z',

  // Inverted heart + triangular stem
  spades:
    'M12 3C9 6 3 8 3 12c0 3.31 2.69 6 6 6-.27 1.47-1.27 2.97-2.5 4h11 ' +
    'c-1.23-1.03-2.23-2.53-2.5-4 3.31 0 6-2.69 6-6 0-4-6-6-9-9z',
};

export function SuitIcon({ suit, size = 20, className = '' }: SuitIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={SUIT_FILL[suit]}
      className={className}
      aria-hidden="true"
    >
      <path d={SUIT_PATH[suit]} />
    </svg>
  );
}

// Convenience named exports for direct use
export const ClubIcon    = (p: Omit<SuitIconProps, 'suit'>) => <SuitIcon suit="clubs"    {...p} />;
export const DiamondIcon = (p: Omit<SuitIconProps, 'suit'>) => <SuitIcon suit="diamonds" {...p} />;
export const HeartIcon   = (p: Omit<SuitIconProps, 'suit'>) => <SuitIcon suit="hearts"   {...p} />;
export const SpadeIcon   = (p: Omit<SuitIconProps, 'suit'>) => <SuitIcon suit="spades"   {...p} />;

// CounterStack logo mark — inline SVG, no file required
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="6" fill="#0F172A" />
      {/* Club top-left */}
      <path
        d="M9 9C7.9 9 7 9.9 7 11c0 .55.22 1.04.57 1.4C6.24 12.6 5 13.7 5 15c0 1.66 1.34 3 3 3-.05.4-.22 1.07-.75 1.5h4.5c-.53-.43-.7-1.1-.75-1.5 1.66 0 3-1.34 3-3 0-1.3-1.24-2.4-2.57-2.6C11.78 12.04 12 11.55 12 11c0-1.1-.9-2-2-2h-1z"
        fill="#10B981"
        opacity="0.9"
      />
      {/* Spade top-right */}
      <path
        d="M23 9c-2.25 2.25-4.5 3-4.5 5.25 0 1.24 1.01 2.25 2.25 2.25-.1.55-.48 1.11-.94 1.5h4.38c-.46-.39-.84-.95-.94-1.5 1.24 0 2.25-1.01 2.25-2.25 0-2.25-2.25-3-3.5-5.25z"
        fill="#EF4444"
        opacity="0.9"
      />
      {/* Diamond bottom center */}
      <path d="M16 17l4 5-4 5-4-5z" fill="#3B82F6" opacity="0.9" />
    </svg>
  );
}
