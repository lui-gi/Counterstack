import type { PostureZone } from './PostureZone.interface';

export interface PostureResult {
  /** Final clamped posture score (0–100). */
  score: number;
  /** Zone classification. */
  zone: PostureZone;
  /** Whether the hardening shield triggered (hardeningScore > 80). */
  shieldActive: boolean;
  /** Effective attack pressure after shield is applied. */
  effectivePressure: number;
}
