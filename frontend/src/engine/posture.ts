// ============================================================
// posture.ts — Posture Calculation Engine
// Formula: (Health + Hardening + Recovery) / 3 - AttackPressure
// ============================================================

// ----------------------------
// Constants
// ----------------------------

/** If Hardening score exceeds this threshold, incoming Spade damage is halved. */
export const HARDENING_SHIELD_THRESHOLD = 80;

/** Posture thresholds for zone classification. */
export const ZONE_THRESHOLDS = {
  SECURE: 70,
  STABLE: 30,
} as const;

// ----------------------------
// Types (imported from interfaces/)
// ----------------------------

import type { PostureZone } from '../interfaces/PostureZone.interface';
import type { PostureInputs } from '../interfaces/PostureInputs.interface';
import type { PostureResult } from '../interfaces/PostureResult.interface';

export type { PostureZone, PostureInputs, PostureResult };

// ----------------------------
// Core Formula
// ----------------------------

/**
 * Calculates overall posture using the CounterStack formula:
 *
 *   OverallPosture = clamp((Health + Hardening + Recovery) / 3 - AttackPressure, 0, 100)
 *
 * Hardening Shield Rule:
 *   If hardeningScore > 80, incoming Spade damage (incomingSpadeRaw) is halved
 *   before being added to currentPressure.
 */
export function calculateOverallPosture(inputs: PostureInputs): PostureResult {
  const { healthScore, hardeningScore, recoveryScore, incomingSpadeRaw, currentPressure } = inputs;

  // 1. Hardening shield check
  const shieldActive = hardeningScore > HARDENING_SHIELD_THRESHOLD;
  const mitigatedSpade = shieldActive ? incomingSpadeRaw * 0.5 : incomingSpadeRaw;

  // 2. Total effective attack pressure
  const effectivePressure = clamp(currentPressure + mitigatedSpade, 0, 100);

  // 3. Posture formula
  const baseline = (healthScore + hardeningScore + recoveryScore) / 3;
  const raw = baseline - effectivePressure;

  // 4. Clamp to valid range
  const score = clamp(Math.round(raw), 0, 100);

  return {
    score,
    zone: getPostureZone(score),
    shieldActive,
    effectivePressure: Math.round(effectivePressure),
  };
}

// ----------------------------
// Zone Helpers
// ----------------------------

/** Maps a posture score to its zone. */
export function getPostureZone(score: number): PostureZone {
  if (score >= ZONE_THRESHOLDS.SECURE) return 'secure';
  if (score >= ZONE_THRESHOLDS.STABLE) return 'stable';
  return 'red-alert';
}

/** Human-readable label for display. */
export function getZoneLabel(zone: PostureZone): string {
  switch (zone) {
    case 'secure':    return 'Secure';
    case 'stable':    return 'Stable';
    case 'red-alert': return 'Red Alert';
  }
}

/** Tailwind color class for each zone (text). */
export function getZoneTextClass(zone: PostureZone): string {
  switch (zone) {
    case 'secure':    return 'text-clubs';
    case 'stable':    return 'text-yellow-400';
    case 'red-alert': return 'text-spades';
  }
}

/** Tailwind glow + border class for each zone. */
export function getZoneGlowClass(zone: PostureZone): string {
  switch (zone) {
    case 'secure':    return 'shadow-glow-clubs border-clubs';
    case 'stable':    return 'shadow-[0_0_20px_rgba(234,179,8,0.5)] border-yellow-400';
    case 'red-alert': return 'shadow-glow-spades border-spades';
  }
}

/** Hex color for SVG/canvas rendering. */
export function getZoneColor(zone: PostureZone): string {
  switch (zone) {
    case 'secure':    return '#10B981';
    case 'stable':    return '#EAB308';
    case 'red-alert': return '#EF4444';
  }
}

// ----------------------------
// Utility
// ----------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
