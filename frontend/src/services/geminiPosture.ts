/**
 * Stub service layer — replace with real API/Gemini calls in production.
 */

import type { ScoredCve } from '../interfaces/ScoredCve.interface';

// ── CVE threat analysis ──────────────────────────────────────────────────────

export interface CveThreatResult {
  threatPct: number;
  reasoning: string;
}

export async function analyzeCveThreat(
  cve: ScoredCve,
  orgProfile: Record<string, unknown> | null,
): Promise<CveThreatResult> {
  await new Promise(r => setTimeout(r, 800));
  const base = cve.threatScore;
  const adjusted = orgProfile ? Math.min(100, base + Math.floor(Math.random() * 10) - 5) : base;
  return {
    threatPct: adjusted,
    reasoning: orgProfile
      ? `Based on your organization's infrastructure profile, this vulnerability has a ${adjusted}% exposure likelihood. ${cve.knownRansomware ? 'Active ransomware campaigns are known to exploit this CVE.' : 'No known active campaigns target your profile specifically.'}`
      : `Default threat score of ${adjusted}% applied. Connect an org profile for a tailored analysis.`,
  };
}

// ── Suit domain analysis ─────────────────────────────────────────────────────

export interface SuitDomainAnalysis {
  loading: boolean;
  recommendations: string[];
  reasoning: string;
}

export async function analyzeSuitDomain(
  suit: { suitKey: string; suitName: string; currentRank: number; activeCve: ScoredCve | null },
  orgProfile: Record<string, unknown> | null,
): Promise<SuitDomainAnalysis> {
  await new Promise(r => setTimeout(r, 1000));
  const { suitKey, suitName, currentRank } = suit;
  const domainNames: Record<string, string> = {
    clover: 'Health & Monitoring', spade: 'Detection & Containment',
    diamond: 'Hardening & Access', heart: 'Recovery & Resilience',
  };
  const domain = domainNames[suitKey] ?? suitName;
  return {
    loading: false,
    recommendations: [
      `Prioritize the top two risk items in your ${domain} backlog`,
      `Increase coverage metrics by targeting the identified gap areas`,
      `Schedule a quarterly review to validate improvements`,
    ],
    reasoning: `Your ${domain} posture is at rank ${currentRank}/13. ${currentRank < 8 ? 'Significant improvement opportunities exist.' : currentRank < 11 ? 'Good baseline — focus on edge-case hardening.' : 'Excellent posture. Maintain and validate continuously.'}`,
  };
}

// ── Magician holistic reading ────────────────────────────────────────────────

export interface MagicianReadingResult {
  summary: string;
  strengths: string[];
  weaknesses: string[];
}

export async function analyzeMagicianReading(
  orgProfile: Record<string, unknown> | null,
  ranks: Record<string, number>,
): Promise<MagicianReadingResult> {
  await new Promise(r => setTimeout(r, 1200));
  const avg = Object.values(ranks).reduce((a, b) => a + b, 0) / 4;
  const org = (orgProfile as { orgName?: string } | null)?.orgName ?? 'your organization';
  return {
    summary: `${org}'s security posture averages rank ${avg.toFixed(1)}/13 across all four domains. ${avg >= 10 ? 'You are operating at an elite level with mature controls across the board.' : avg >= 7 ? 'Your posture is developing well with clear paths to improvement.' : 'There are significant gaps that require immediate attention.'}`,
    strengths: [
      Object.entries(ranks).reduce((best, [k, v]) => v > best.v ? { k, v } : best, { k: '', v: 0 }).k + ' domain leads with highest maturity',
      'Monitoring infrastructure shows consistent coverage',
      'Identity controls meet baseline requirements',
    ],
    weaknesses: [
      Object.entries(ranks).reduce((worst, [k, v]) => v < worst.v ? { k, v } : worst, { k: '', v: 14 }).k + ' domain requires priority investment',
      'Gap between strongest and weakest domains creates lateral risk',
      'Recovery procedures need more frequent testing',
    ],
  };
}

export async function registerUser(
  email: string,
  password: string,
  name: string,
): Promise<{ token: string; user: { id: string; name: string; email: string } }> {
  // Stub: simulate network delay
  await new Promise(r => setTimeout(r, 600));
  return {
    token: `stub-token-${Date.now()}`,
    user: { id: `user-${Date.now()}`, name, email },
  };
}

export async function loginUser(
  email: string,
  _password: string,
): Promise<{ token: string; user: { id: string; email: string } }> {
  await new Promise(r => setTimeout(r, 600));
  return {
    token: `stub-token-${Date.now()}`,
    user: { id: `user-${Date.now()}`, email },
  };
}

export async function createOrg(
  name: string,
  _token: string,
): Promise<{ id: string; name: string }> {
  await new Promise(r => setTimeout(r, 400));
  return { id: `org-${Date.now()}`, name };
}

export async function uploadProfile(
  _orgId: string,
  _file: File,
  _token: string,
): Promise<{ ranks: Record<string, number>; [key: string]: unknown }> {
  await new Promise(r => setTimeout(r, 1200));
  return {
    ranks: { clover: 8, spade: 9, diamond: 7, heart: 8 },
  };
}

export async function saveOnboardingProfile(
  _orgId: string,
  _answers: Record<string, unknown>,
  _ranks: Record<string, number>,
  _token: string,
): Promise<void> {
  await new Promise(r => setTimeout(r, 400));
}

export interface FiveYearPlanInput {
  ranks: Record<string, number>;
  targetRanks: Record<string, number>;
  currentHand: string;
  targetHand: string;
  currentScore: number;
  targetScore: number;
  orgName?: string;
  industry?: string;
}

export async function analyzeFiveYearPlan(
  input: FiveYearPlanInput,
): Promise<{ timeline: string }> {
  await new Promise(r => setTimeout(r, 1500));
  const org = input.orgName ?? 'Your organization';
  return {
    timeline: `5-YEAR SECURITY ROADMAP — ${org.toUpperCase()}

YEAR 1 (Foundation)
→ Achieve ${input.targetHand} from current ${input.currentHand}
→ Patch all critical CVEs and enforce MFA universally
→ Deploy EDR to 100% of endpoints
→ Establish 24/7 SOC coverage

YEAR 2 (Hardening)
→ Implement Zero Trust architecture (target 90% coverage)
→ Automate patch deployment pipeline
→ Reduce MTTR to under 60 minutes
→ Conduct quarterly DR drills

YEAR 3 (Intelligence)
→ Integrate threat intelligence feeds
→ Deploy ML-based anomaly detection
→ Achieve full asset inventory automation
→ Implement CASB for SaaS governance

YEAR 4 (Optimization)
→ Tune SOC playbooks for 95%+ containment rate
→ Achieve sub-30min RTO for all critical systems
→ Expand deception technology coverage
→ Implement continuous compliance monitoring

YEAR 5 (Excellence)
→ Target posture score: ${input.targetScore}/100
→ Achieve ROYAL FLUSH posture across all domains
→ Establish red team / blue team exercises
→ Certify against ISO 27001 and SOC 2 Type II`,
  };
}
