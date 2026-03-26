// ============================================================
// simulation/engine/posture.ts
// 5-level posture model for the Simulation mode.
// Separate from the SOC dashboard's 3-zone model.
// ============================================================

import type { PlayerResources, PostureLevel, PostureState } from './types';
import { POSTURE_THRESHOLDS } from './types';

// ----------------------------
// Score derivation
// Weighted blend of the three resources.
// Strength gives a small bonus to posture while active.
// ----------------------------

export function derivePostureScore(resources: PlayerResources): number {
  const { health, mana, strength } = resources;
  // Health is the primary driver; mana and strength are secondary
  const raw = health * 0.60 + mana * 0.25 + strength * 0.15;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

// ----------------------------
// Score → PostureLevel mapping
// ----------------------------

export function scoreTolevel(score: number): PostureLevel {
  if (score >= POSTURE_THRESHOLDS.secure)   return 'secure';
  if (score >= POSTURE_THRESHOLDS.stable)   return 'stable';
  if (score >= POSTURE_THRESHOLDS.strained) return 'strained';
  if (score >= POSTURE_THRESHOLDS.critical) return 'critical';
  return 'breached';
}

export function calculatePosture(resources: PlayerResources): PostureState {
  const score = derivePostureScore(resources);
  return { score, level: scoreTolevel(score) };
}

// ----------------------------
// Display helpers
// ----------------------------

export function postureLevelLabel(level: PostureLevel): string {
  const labels: Record<PostureLevel, string> = {
    secure:   'SECURE',
    stable:   'STABLE',
    strained: 'STRAINED',
    critical: 'CRITICAL',
    breached: 'BREACHED',
  };
  return labels[level];
}

/** Hex color for the posture gauge / badge. */
export function postureLevelColor(level: PostureLevel): string {
  const colors: Record<PostureLevel, string> = {
    secure:   '#10B981',  // emerald
    stable:   '#3B82F6',  // blue
    strained: '#EAB308',  // yellow
    critical: '#F97316',  // orange
    breached: '#EF4444',  // red
  };
  return colors[level];
}

/** Tailwind glow class for borders/shadows. */
export function postureLevelGlow(level: PostureLevel): string {
  const glows: Record<PostureLevel, string> = {
    secure:   'shadow-[0_0_20px_rgba(16,185,129,0.6)]',
    stable:   'shadow-[0_0_20px_rgba(59,130,246,0.6)]',
    strained: 'shadow-[0_0_20px_rgba(234,179,8,0.6)]',
    critical: 'shadow-[0_0_20px_rgba(249,115,22,0.7)]',
    breached: 'shadow-[0_0_30px_rgba(239,68,68,0.9)]',
  };
  return glows[level];
}

/** True when the UI should enter red-alert / CRT-flicker mode. */
export function isRedAlert(level: PostureLevel): boolean {
  return level === 'critical' || level === 'breached';
}
