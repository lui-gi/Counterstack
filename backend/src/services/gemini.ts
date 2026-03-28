import type { GeminiRanks } from '../interfaces/index.js';

const MODEL = 'gemini-3.1-flash-lite-preview';
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

async function callGemini(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set');
  const res = await fetch(`${BASE_URL}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${body}`);
  }
  const data = await res.json() as { candidates: Array<{ content: { parts: Array<{ text: string }> } }> };
  return data.candidates[0].content.parts[0].text;
}

function parseJsonFromText(text: string): unknown {
  let match = text.match(/```json\s*([\s\S]*?)```/);
  if (!match) match = text.match(/```\s*([\s\S]*?)```/);
  if (!match) match = text.match(/(\{[\s\S]*\})/);
  if (!match) throw new Error('No JSON found in Gemini response');
  const cleaned = match[1].replace(/,(\s*[}\]])/g, '$1');
  return JSON.parse(cleaned);
}

function clamp113(v: unknown): number {
  return Math.max(1, Math.min(13, Math.round(Number(v))));
}

export async function analyzeOrgProfile(json: unknown): Promise<GeminiRanks> {
  const prompt = `You are a cybersecurity posture analyst. Given the following NIST CSF organization profile, score each of these four security domains on a scale of 1 (critical risk) to 13 (excellent):
- resources: visibility and detection maturity (NIST Identify + Detect)
- harden: access control and defense depth (NIST Protect)
- resilience: backup and continuity readiness (NIST Recover)
- offsec: incident response capability and threat containment (NIST Respond — higher score = BETTER response)

Respond ONLY with a JSON object like:
{"resources": 9, "harden": 11, "resilience": 8, "offsec": 10, "summary": "...one sentence..."}

Profile:
${JSON.stringify(json, null, 2)}`;

  const raw = await callGemini(prompt);
  const parsed = parseJsonFromText(raw) as Record<string, unknown>;
  return {
    clover: clamp113(parsed.resources),
    diamond: clamp113(parsed.harden),
    heart: clamp113(parsed.resilience),
    spade: clamp113(parsed.offsec),
    summary: typeof parsed.summary === 'string' ? parsed.summary : undefined,
  };
}

export async function analyzeCveThreat(
  cve: Record<string, unknown>,
  orgProfile: unknown
): Promise<{ threatPct: number; summary: string; exposure: string; controls: string; verdict: string; attackVectors: string[]; remediationSteps: string[] }> {
  const prompt = `You are a cybersecurity threat analyst. Given a specific CVE and an organization's security profile, calculate how vulnerable this organization is to this specific CVE.

CVE Details:
- ID: ${cve.cveId}
- Name: ${cve.name}
- Description: ${cve.description}
- CVSS Score: ${cve.cvssScore}/10
- Affected Vendor: ${cve.affectedVendor}
- Affected Product: ${cve.affectedProduct}
${cve.knownRansomware ? '- WARNING: Known to be used in ransomware campaigns' : ''}

Organization Profile:
${JSON.stringify(orgProfile, null, 2)}

Respond ONLY with a JSON object:
{
  "threatPct": <0-100>,
  "summary": "<1-2 sentences briefly describing what this CVE does and why it matters>",
  "exposure": "<1 sentence: does this org use the affected vendor/product and to what extent?>",
  "controls": "<1 sentence: how well do their specific security controls mitigate this vulnerability?>",
  "verdict": "<1 sentence: why was this exact threat percentage assigned, tying exposure and controls together?>",
  "attackVectors": ["<label1>", "<label2>"],
  "remediationSteps": ["<step1>", "<step2>", "<step3>"]
}

Where threatPct is how vulnerable THIS organization is to THIS CVE:
- 0-30: Low threat (don't use affected product, or strong mitigations)
- 31-60: Medium threat (partial exposure or decent controls)
- 61-80: High threat (uses affected product with gaps in controls)
- 81-100: Critical threat (direct exposure with weak defenses)

For attackVectors: provide 1-4 short labels (e.g. "RCE", "Auth Bypass", "Priv Esc", "SSRF", "SQLi", "XSS", "Supply Chain") that describe the attack surface relevant to this CVE and this organization.

For remediationSteps: provide 3-5 concise, org-specific containment and remediation actions tailored to this organization's stack and security controls. Each step should be a single actionable sentence.`;

  const raw = await callGemini(prompt);
  const parsed = parseJsonFromText(raw) as Record<string, unknown>;
  return {
    threatPct: Math.max(0, Math.min(100, Math.round(Number(parsed.threatPct)))),
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    exposure: typeof parsed.exposure === 'string' ? parsed.exposure : '',
    controls: typeof parsed.controls === 'string' ? parsed.controls : '',
    verdict: typeof parsed.verdict === 'string' ? parsed.verdict : '',
    attackVectors: Array.isArray(parsed.attackVectors) ? (parsed.attackVectors as unknown[]).slice(0, 4).map(String) : [],
    remediationSteps: Array.isArray(parsed.remediationSteps) ? (parsed.remediationSteps as unknown[]).slice(0, 5).map(String) : [],
  };
}

export async function analyzeSuit(
  suit: Record<string, unknown>,
  orgProfile: unknown
): Promise<{
  recommendations: string[];
  reasoning: string;
  benchmarks: Record<string, string>;
  upgradePath: string[];
  complianceGaps: string[];
  attackerView: string[];
  businessImpact: string[];
}> {
  const suitDescriptions: Record<string, string> = {
    clover: 'RESOURCES - Baseline visibility, asset hygiene, patch compliance, vulnerability management',
    spade: 'OFFSEC - Detection capability, SOC operations, containment, threat hunting',
    diamond: 'HARDEN - Hardening, access control, zero trust, privileged access management',
    heart: 'RESILIENCE - Backup readiness, disaster recovery, business continuity, RTO/RPO',
  };

  const suitBenchmarkKeys: Record<string, string[]> = {
    clover:  ['Patch Cadence', 'Asset Inventory', 'Risk Assessment', 'Vuln Scan Coverage'],
    spade:   ['Mean Time to Detect', 'EDR Coverage', 'Mean Time to Respond', 'IR Plan Age'],
    diamond: ['MFA Adoption', 'Zero Trust Maturity', 'Encryption at Rest', 'Patch Cadence'],
    heart:   ['RTO', 'RPO', 'Backup Frequency', 'Last DR Test'],
  };

  const activeCve = suit.activeCve as Record<string, unknown> | undefined;
  const cveContext = activeCve ? `
Active Threat Context:
- CVE: ${activeCve.cveId}
- Name: ${activeCve.name}
- Description: ${activeCve.description}
- CVSS: ${activeCve.cvssScore}/10
- Vendor: ${activeCve.affectedVendor}
- Product: ${activeCve.affectedProduct}` : '';

  const suitKey = suit.suitKey as string;
  const nextRank = Math.min(Number(suit.currentRank) + 2, 13);
  const benchmarkKeys = (suitBenchmarkKeys[suitKey] || []).join(', ');

  const prompt = `You are a cybersecurity analyst specializing in ${suitDescriptions[suitKey] || suitKey}.

Given this organization's security profile and their current ${suit.suitName} rank of ${suit.currentRank}/13, respond ONLY with a JSON object:
{
  "recommendations": [
    "Specific action 1 referencing their actual metrics",
    "Specific action 2",
    "Specific action 3",
    "Specific action 4"
  ],
  "reasoning": "One sentence explaining the overall priority for this domain",
  "benchmarks": {
    ${benchmarkKeys.split(', ').map(k => `"${k}": "<industry median/target as short string, e.g. '7d', '95%', '<1h'>"`).join(',\n    ')}
  },
  "upgradePath": [
    "Rank-specific step 1 to reach rank ${nextRank}/13",
    "Rank-specific step 2",
    "Rank-specific step 3"
  ],
  "complianceGaps": [
    "If compliance frameworks exist in the profile, list 0-3 specific requirements at risk in this domain, e.g. 'PCI DSS 6.3.3: patch cadence SLA not met'. Empty array if no compliance data or no gaps."
  ],
  "attackerView": [
    "3 short bullets written from the attacker's perspective, referencing this org's actual metric gaps. E.g. 'Your 12h MTTD gives attackers a full business day of undetected dwell time.'",
    "Bullet 2",
    "Bullet 3"
  ],
  "businessImpact": [
    "3 short bullets translating this domain's technical gaps into business risk — revenue, compliance exposure, or reputational harm. E.g. 'An unverified backup means your stated 4h RTO is unconfirmed — real recovery time unknown.'",
    "Bullet 2",
    "Bullet 3"
  ]
}
${cveContext}

Organization Profile:
${JSON.stringify(orgProfile, null, 2)}`;

  const raw = await callGemini(prompt);
  const parsed = parseJsonFromText(raw) as Record<string, unknown>;
  const recs = Array.isArray(parsed.recommendations) ? (parsed.recommendations as unknown[]).slice(0, 4).map(String) : [];
  const benchmarks = (parsed.benchmarks && typeof parsed.benchmarks === 'object' && !Array.isArray(parsed.benchmarks))
    ? Object.fromEntries(Object.entries(parsed.benchmarks as Record<string, unknown>).map(([k, v]) => [k, String(v)]))
    : {};
  const upgradePath = Array.isArray(parsed.upgradePath) ? (parsed.upgradePath as unknown[]).slice(0, 4).map(String) : [];
  const complianceGaps = Array.isArray(parsed.complianceGaps) ? (parsed.complianceGaps as unknown[]).slice(0, 3).map(String) : [];
  const attackerView = Array.isArray(parsed.attackerView) ? (parsed.attackerView as unknown[]).slice(0, 3).map(String) : [];
  const businessImpact = Array.isArray(parsed.businessImpact) ? (parsed.businessImpact as unknown[]).slice(0, 3).map(String) : [];
  return {
    recommendations: recs,
    reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
    benchmarks,
    upgradePath,
    complianceGaps,
    attackerView,
    businessImpact,
  };
}

export async function analyzeMagicianReading(input: {
  orgProfile: unknown;
  ranks: Record<string, number>;
}): Promise<{ summary: string; topPriority: string; strengths: string[]; weaknesses: { text: string; urgency: 'immediate' | 'short_term' | 'long_term' }[] }> {
  const { orgProfile, ranks } = input;
  const prompt = `You are a senior cybersecurity strategist providing a holistic assessment of an organization's security posture across all four domains.

Current Domain Ranks (1=critical risk, 13=excellent):
- RESOURCES (asset visibility, patching, hygiene): ${ranks.clover}/13
- OFFSEC (detection maturity, SOC coverage, containment): ${ranks.spade}/13
- HARDEN (access control, hardening, zero trust): ${ranks.diamond}/13
- RESILIENCE (backup, disaster recovery, business continuity): ${ranks.heart}/13

Organization Profile:
${JSON.stringify(orgProfile, null, 2)}

Provide a holistic executive-level reading of this organization's overall security posture. Identify the 3 most significant strengths and 3 most significant weaknesses across ALL domains combined.

Instructions:
- In the summary (2-3 sentences), frame the posture relative to the organization's industry and size — note if they are above or below the typical baseline for their sector. Call out the most significant interaction between two domains where one domain's weakness amplifies another's risk.
- topPriority: one clear, specific action sentence — the single most important thing this org must do right now.
- For each weakness, assign an urgency: "immediate" (act within days/weeks), "short_term" (act within 1-3 months), or "long_term" (act within 6-12 months).

Respond ONLY with a JSON object:
{
  "summary": "2-3 sentence executive overview framed relative to industry/size, including cross-domain risk interaction",
  "topPriority": "Single most critical action sentence",
  "strengths": [
    "Specific strength 1 referencing domain and evidence from the profile",
    "Specific strength 2 referencing domain and evidence from the profile",
    "Specific strength 3 referencing domain and evidence from the profile"
  ],
  "weaknesses": [
    { "text": "Specific weakness 1 with actionable insight", "urgency": "immediate" },
    { "text": "Specific weakness 2 with actionable insight", "urgency": "short_term" },
    { "text": "Specific weakness 3 with actionable insight", "urgency": "long_term" }
  ]
}`;

  const raw = await callGemini(prompt);
  const parsed = parseJsonFromText(raw) as Record<string, unknown>;

  const rawWeaknesses = Array.isArray(parsed.weaknesses) ? parsed.weaknesses as unknown[] : [];
  const weaknesses = rawWeaknesses.slice(0, 3).map((w) => {
    if (typeof w === 'object' && w !== null && 'text' in w) {
      const obj = w as Record<string, unknown>;
      const urgency = obj.urgency === 'immediate' || obj.urgency === 'short_term' || obj.urgency === 'long_term'
        ? obj.urgency as 'immediate' | 'short_term' | 'long_term'
        : 'short_term';
      return { text: String(obj.text ?? ''), urgency };
    }
    return { text: String(w), urgency: 'short_term' as const };
  });

  return {
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    topPriority: typeof parsed.topPriority === 'string' ? parsed.topPriority : '',
    strengths: Array.isArray(parsed.strengths) ? (parsed.strengths as unknown[]).slice(0, 3).map(String) : [],
    weaknesses,
  };
}

export async function analyzeFiveYearPlan(input: Record<string, unknown>): Promise<{ timeline: string }> {
  const { ranks, targetRanks, currentHand, targetHand, currentScore, targetScore, orgName, industry } = input as {
    ranks: Record<string, number>;
    targetRanks: Record<string, number>;
    currentHand: string;
    targetHand: string;
    currentScore: number;
    targetScore: number;
    orgName?: string;
    industry?: string;
  };

  const orgLabel = orgName ? ` for ${orgName}` : '';
  const industryLabel = industry ? ` in the ${industry} industry` : '';

  const prompt = `You are a senior cybersecurity strategist${orgLabel}${industryLabel}. Generate a 5-year roadmap to improve security posture from [${currentHand} | ${currentScore}/100] to [${targetHand} | ${targetScore}/100].

Current domain ranks:
♣ RESOURCES (Asset visibility, patching): ${ranks.clover}/13
♠ OFFSEC (Detection, SOC coverage): ${ranks.spade}/13
♦ HARDEN (Access control, hardening): ${ranks.diamond}/13
♥ RESILIENCE (Backup, DR, continuity): ${ranks.heart}/13

Target domain ranks:
♣ RESOURCES: ${targetRanks.clover}/13
♠ OFFSEC: ${targetRanks.spade}/13
♦ HARDEN: ${targetRanks.diamond}/13
♥ RESILIENCE: ${targetRanks.heart}/13

Output a text-based 5-year timeline. Use Unicode arrows and box-drawing characters (→, ─, │, ▼, ►, ━) to visually connect steps between years. Each year has 2-4 concrete initiatives. Show how each year's work feeds the next using vertical arrows. Output ONLY the plain text timeline — no JSON, no markdown fences, no backticks.

Format:
YEAR 1: THEME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ♣  [initiative]
  ♠  [initiative]
                          │
                          ▼
YEAR 2: THEME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ...continue for all 5 years`;

  const raw = await callGemini(prompt);
  const timeline = raw.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim();
  return { timeline };
}
