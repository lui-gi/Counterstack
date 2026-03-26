import type { Threat } from './Threat.interface';

export interface OrganizationState {
  health: {
    visibilityScore: number;  // 0–100
    hygienePercent: number;   // 0–100
  };
  hardening: {
    // 0–100: how hardened the org's defenses are
    // (inverted from old defenseMultiplier — 100 = fully hardened)
    hardeningScore: number;
    activePolicies: string[];
  };
  recovery: {
    resilienceFactor: number;       // 0–100
    lastBackupTimestamp: string;
  };
  attack: {
    activeThreats: Threat[];
    pressureLevel: number;  // 0–100 accumulated pressure
  };
  overallPosture: number;  // 0–100, always derived via calculatePosture
}
