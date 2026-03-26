import type { ScoredCve } from '../interfaces/ScoredCve.interface';

export const DEFAULT_ORG_PROFILE = {
  mfaEnforcement: 0,
  endpointHardening: false,
  patchCycleDays: 90,
  zeroTrust: false,
  edrCoverage: 0,
  siemActive: false,
  threatHuntingWeekly: false,
  irPlanTested: false,
  backupsTested: false,
};

export function calculateThreatPct(cve: ScoredCve, profile: typeof DEFAULT_ORG_PROFILE): number {
  let score = cve.cvssScore * 10;

  // Deductions (org has controls)
  if (profile.mfaEnforcement >= 95) score -= 8;
  if (profile.endpointHardening) score -= 7;
  if (profile.patchCycleDays <= 7) score -= 10;
  if (profile.zeroTrust) score -= 10;
  if (profile.edrCoverage >= 90) score -= 8;
  if (profile.siemActive) score -= 5;
  if (profile.threatHuntingWeekly) score -= 6;
  if (profile.irPlanTested) score -= 7;
  if (profile.backupsTested) score -= 5;

  // Additions (org missing controls)
  if (profile.patchCycleDays > 30) score += 10;
  if (!profile.irPlanTested) score += 7;
  if (!profile.endpointHardening) score += 8;
  if (profile.edrCoverage < 50) score += 8;
  if (profile.mfaEnforcement < 50) score += 6;
  if (!profile.backupsTested) score += 5;
  if (cve.knownRansomware) score += 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function scoreAllCves(cves: ScoredCve[], profile: typeof DEFAULT_ORG_PROFILE): ScoredCve[] {
  return cves.map(cve => ({
    ...cve,
    threatScore: calculateThreatPct(cve, profile),
  }));
}
