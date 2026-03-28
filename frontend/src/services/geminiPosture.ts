interface GeminiRanks {
  clover: number;
  diamond: number;
  heart: number;
  spade: number;
  summary: string;
}

interface CveThreatInput {
  cveId: string;
  name: string;
  description: string;
  cvssScore: number;
  affectedVendor: string;
  affectedProduct: string;
  knownRansomware?: boolean;
}

interface CveThreatResult {
  threatPct: number;
  summary: string;
  exposure: string;
  controls: string;
  verdict: string;
  attackVectors: string[];
  remediationSteps: string[];
}

interface SuitAnalysisInput {
  suitKey: 'clover' | 'spade' | 'diamond' | 'heart';
  suitName: string;
  currentRank: number;
  activeCve?: CveThreatInput | null;
}

interface SuitAnalysisResult {
  recommendations: string[];
  reasoning: string;
  benchmarks?: Record<string, string>;
  upgradePath?: string[];
  complianceGaps?: string[];
  attackerView?: string[];
  businessImpact?: string[];
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function analyzeOrgProfile(json: Record<string, unknown>): Promise<GeminiRanks> {
  const res = await fetch(`${API_URL}/api/posture/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile: json }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API error ${res.status}`);
  }

  const data: GeminiRanks = await res.json();

  if (
    typeof data.clover !== 'number' ||
    typeof data.diamond !== 'number' ||
    typeof data.heart !== 'number' ||
    typeof data.spade !== 'number'
  ) {
    throw new Error('Invalid response format from server');
  }

  return data;
}

export async function analyzeCveThreat(
  cve: CveThreatInput,
  orgProfile: Record<string, unknown>
): Promise<CveThreatResult> {
  const res = await fetch(`${API_URL}/api/posture/cve-threat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cve, orgProfile }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API error ${res.status}`);
  }

  const data: CveThreatResult = await res.json();

  if (typeof data.threatPct !== 'number') {
    throw new Error('Invalid response format from server');
  }

  return data;
}

interface MagicianReadingResult {
  summary: string;
  topPriority: string;
  strengths: string[];
  weaknesses: { text: string; urgency: 'immediate' | 'short_term' | 'long_term' }[];
}

export async function analyzeMagicianReading(
  orgProfile: Record<string, unknown>,
  ranks: { clover: number; spade: number; diamond: number; heart: number }
): Promise<MagicianReadingResult> {
  const res = await fetch(`${API_URL}/api/posture/magician-reading`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgProfile, ranks }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API error ${res.status}`);
  }

  const data: MagicianReadingResult = await res.json();

  if (typeof data.summary !== 'string' || !Array.isArray(data.strengths) || !Array.isArray(data.weaknesses)) {
    throw new Error('Invalid response format from server');
  }

  return data;
}

export async function analyzeFiveYearPlan(input: {
  ranks: Record<string, number>;
  targetRanks: Record<string, number>;
  currentHand: string;
  targetHand: string;
  currentScore: number;
  targetScore: number;
  orgName?: string;
  industry?: string;
}): Promise<{ timeline: string }> {
  const res = await fetch(`${API_URL}/api/posture/five-year-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

export async function askMagician(
  question: string,
  orgProfile: Record<string, unknown> | null,
  accountData: { orgName?: string; industry?: string; integrations?: string[] } | null
): Promise<{ answer: string }> {
  const res = await fetch(`${API_URL}/api/posture/ask-magician`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, profile: orgProfile, accountData }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API error ${res.status}`);
  }
  const data = await res.json() as { answer: string };
  if (typeof data.answer !== 'string') throw new Error('Invalid response format from server');
  return data;
}

export interface BattleDebriefResult {
  headline: string;
  steps: string[];
  summary: string;
}

export async function analyzeBattleDebrief(
  log: Array<{ msg: string; kind: string }>,
  outcome: 'victory' | 'defeat'
): Promise<BattleDebriefResult> {
  const res = await fetch(`${API_URL}/api/posture/battle-debrief`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ log, outcome }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  const data: BattleDebriefResult = await res.json();
  if (typeof data.headline !== 'string' || !Array.isArray(data.steps)) {
    throw new Error('Invalid response format from server');
  }
  return data;
}

export async function analyzeSuitDomain(
  suit: SuitAnalysisInput,
  orgProfile: Record<string, unknown>
): Promise<SuitAnalysisResult> {
  const res = await fetch(`${API_URL}/api/posture/suit-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ suit, orgProfile }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API error ${res.status}`);
  }

  const data: SuitAnalysisResult = await res.json();

  if (!Array.isArray(data.recommendations)) {
    throw new Error('Invalid response format from server');
  }

  return data;
}
