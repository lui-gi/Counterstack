// CVE Scoring Engine
// Calculates threat percentage by comparing CVE severity against organization's security posture

import type { ScoredCve } from '../interfaces/ScoredCve.interface';
import type { CisaKevEntry } from '../data/cisaKev';

// Organization profile structure (matches sample-org-profile.json)
export interface OrgProfile {
  organization: {
    name: string;
    sector: string;
    employeeCount: number;
    complianceFrameworks: string[];
    cloudProvider: string;
  };
  nistCsf: {
    identify: {
      assetInventoryComplete: boolean;
      riskAssessmentAgeMonths: number;
      criticalAssetsDocumented: boolean;
    };
    protect: {
      mfaAdoptionPercent: number;
      encryptionAtRest: boolean;
      endpointHardeningPolicy: boolean;
      securityAwarenessTrainingFrequency: string;
      patchCadenceDays: number;
      zeroTrustMaturity: string;
    };
    detect: {
      siemActive: boolean;
      edrCoveragePercent: number;
      meanTimeToDetectHours: number;
      threatHuntingFrequency: string;
    };
    respond: {
      irPlanExists: boolean;
      irPlanAgeMonths: number;
      tabletopExerciseDays: number;
      meanTimeToRespondHours: number;
    };
    recover: {
      backupsTested: boolean;
      backupFrequencyHours: number;
      lastDrTestDays: number;
      rtoHours: number;
      rpoHours: number;
    };
  };
  openRisks: string[];
}

// Default org profile if none provided
export const DEFAULT_ORG_PROFILE: OrgProfile = {
  organization: {
    name: "Default Org",
    sector: "technology",
    employeeCount: 100,
    complianceFrameworks: [],
    cloudProvider: "AWS",
  },
  nistCsf: {
    identify: {
      assetInventoryComplete: false,
      riskAssessmentAgeMonths: 12,
      criticalAssetsDocumented: false,
    },
    protect: {
      mfaAdoptionPercent: 50,
      encryptionAtRest: true,
      endpointHardeningPolicy: false,
      securityAwarenessTrainingFrequency: "annual",
      patchCadenceDays: 30,
      zeroTrustMaturity: "none",
    },
    detect: {
      siemActive: false,
      edrCoveragePercent: 50,
      meanTimeToDetectHours: 24,
      threatHuntingFrequency: "never",
    },
    respond: {
      irPlanExists: false,
      irPlanAgeMonths: 24,
      tabletopExerciseDays: 365,
      meanTimeToRespondHours: 12,
    },
    recover: {
      backupsTested: false,
      backupFrequencyHours: 24,
      lastDrTestDays: 180,
      rtoHours: 24,
      rpoHours: 24,
    },
  },
  openRisks: [],
};

/**
 * Calculate threat percentage for a CVE against an organization's security posture
 * Higher score = higher threat to this specific organization
 */
export function calculateThreatPct(cve: CisaKevEntry, orgProfile: OrgProfile): number {
  // Base score from CVSS (0-10 → 0-100)
  let score = cve.cvssScore * 10;

  const { protect, detect, respond, recover, identify } = orgProfile.nistCsf;

  // === PROTECTIVE CONTROLS (reduce score) ===

  // Strong MFA adoption reduces attack surface
  if (protect.mfaAdoptionPercent >= 95) {
    score -= 8;
  } else if (protect.mfaAdoptionPercent >= 80) {
    score -= 5;
  }

  // Endpoint hardening blocks many exploits
  if (protect.endpointHardeningPolicy) {
    score -= 7;
  }

  // Fast patching reduces exposure window
  if (protect.patchCadenceDays <= 7) {
    score -= 10;
  } else if (protect.patchCadenceDays <= 14) {
    score -= 5;
  }

  // Zero Trust limits lateral movement
  if (protect.zeroTrustMaturity === "complete") {
    score -= 10;
  } else if (protect.zeroTrustMaturity === "in-progress") {
    score -= 4;
  }

  // EDR coverage enables detection
  if (detect.edrCoveragePercent >= 90) {
    score -= 8;
  } else if (detect.edrCoveragePercent >= 70) {
    score -= 4;
  }

  // SIEM enables detection
  if (detect.siemActive) {
    score -= 5;
  }

  // Proactive threat hunting
  if (detect.threatHuntingFrequency === "weekly") {
    score -= 5;
  } else if (detect.threatHuntingFrequency === "monthly") {
    score -= 2;
  }

  // Good IR readiness
  if (respond.irPlanExists && respond.irPlanAgeMonths <= 6) {
    score -= 5;
  }

  // Tested backups enable recovery
  if (recover.backupsTested && recover.lastDrTestDays <= 30) {
    score -= 5;
  }

  // === RISK FACTORS (increase score) ===

  // Slow patching increases exposure
  if (protect.patchCadenceDays > 30) {
    score += 15;
  } else if (protect.patchCadenceDays > 14) {
    score += 8;
  }

  // Stale IR plan means poor response
  if (!respond.irPlanExists || respond.irPlanAgeMonths > 12) {
    score += 10;
  }

  // No asset inventory = unknown attack surface
  if (!identify.assetInventoryComplete) {
    score += 8;
  }

  // Low EDR coverage = blind spots
  if (detect.edrCoveragePercent < 50) {
    score += 10;
  }

  // Slow detection time
  if (detect.meanTimeToDetectHours > 24) {
    score += 8;
  }

  // Untested backups = recovery risk
  if (!recover.backupsTested) {
    score += 8;
  }

  // === CVE-SPECIFIC FACTORS ===

  // Known ransomware use = higher priority
  if (cve.knownRansomwareCampaignUse) {
    score += 15;
  }

  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Score all CVEs against an organization profile
 * Returns sorted by threat percentage (highest first)
 */
export function scoreAllCves(
  cves: CisaKevEntry[],
  orgProfile: OrgProfile = DEFAULT_ORG_PROFILE
): ScoredCve[] {
  return cves
    .map((cve) => ({
      cveId: cve.cveId,
      name: cve.name,
      description: cve.description,
      cvssScore: cve.cvssScore,
      threatPct: calculateThreatPct(cve, orgProfile),
      exploitedInWild: true, // All CISA KEV entries are actively exploited
      affectedVendor: cve.vendorProject,
      affectedProduct: cve.product,
      dueDate: cve.dueDate,
      requiredAction: cve.requiredAction,
      cwes: cve.cwes,
    }))
    .sort((a, b) => b.threatPct - a.threatPct);
}

/**
 * Get a random CVE from the scored list
 */
export function shuffleCve(scoredCves: ScoredCve[]): ScoredCve | null {
  if (scoredCves.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * scoredCves.length);
  return scoredCves[randomIndex];
}

/**
 * Get the highest-threat CVE
 */
export function getTopThreat(scoredCves: ScoredCve[]): ScoredCve | null {
  if (scoredCves.length === 0) return null;
  return scoredCves[0]; // Already sorted by threatPct desc
}
