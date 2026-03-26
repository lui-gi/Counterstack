export interface PostureInputs {
  /** Combined health score: visibility + hygiene averaged. */
  healthScore: number;
  /** Hardening effectiveness: higher = more hardened defenses. */
  hardeningScore: number;
  /** Recovery readiness: backup and DR preparedness. */
  recoveryScore: number;
  /**
   * Raw incoming Spade damage this turn (before shield reduction).
   * Pass 0 when recalculating steady-state posture without a new hit.
   */
  incomingSpadeRaw: number;
  /** Existing accumulated attack pressure (0–100). */
  currentPressure: number;
}
