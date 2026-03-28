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
): Promise<{ threatPct: number; exposure: string; controls: string; verdict: string; attackVectors: string[]; remediationSteps: string[] }> {
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
): Promise<{ recommendations: string[]; reasoning: string }> {
  const suitDescriptions: Record<string, string> = {
    clover: 'RESOURCES - Baseline visibility, asset hygiene, patch compliance, vulnerability management',
    spade: 'OFFSEC - Detection capability, SOC operations, containment, threat hunting',
    diamond: 'HARDEN - Hardening, access control, zero trust, privileged access management',
    heart: 'RESILIENCE - Backup readiness, disaster recovery, business continuity, RTO/RPO',
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
  const prompt = `You are a cybersecurity analyst specializing in ${suitDescriptions[suitKey] || suitKey}.

Given this organization's security profile and their current ${suit.suitName} rank of ${suit.currentRank}/13, provide 4 specific, actionable recommendations to improve this domain.
${cveContext}

Organization Profile:
${JSON.stringify(orgProfile, null, 2)}

Respond ONLY with a JSON object:
{
  "recommendations": [
    "Specific action 1",
    "Specific action 2",
    "Specific action 3",
    "Specific action 4"
  ],
  "reasoning": "One sentence explaining the overall priority for this domain"
}

Make recommendations specific to the organization's actual gaps. Reference specific metrics from their profile.`;

  const raw = await callGemini(prompt);
  const parsed = parseJsonFromText(raw) as Record<string, unknown>;
  const recs = Array.isArray(parsed.recommendations) ? (parsed.recommendations as unknown[]).slice(0, 4).map(String) : [];
  return {
    recommendations: recs,
    reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
  };
}

export async function analyzeMagicianReading(input: {
  orgProfile: unknown;
  ranks: Record<string, number>;
}): Promise<{ summary: string; strengths: string[]; weaknesses: string[] }> {
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

Respond ONLY with a JSON object:
{
  "summary": "2-3 sentence executive overview of the overall security posture",
  "strengths": [
    "Specific strength 1 referencing domain and evidence from the profile",
    "Specific strength 2 referencing domain and evidence from the profile",
    "Specific strength 3 referencing domain and evidence from the profile"
  ],
  "weaknesses": [
    "Specific weakness 1 with actionable insight",
    "Specific weakness 2 with actionable insight",
    "Specific weakness 3 with actionable insight"
  ]
}`;

  const raw = await callGemini(prompt);
  const parsed = parseJsonFromText(raw) as Record<string, unknown>;
  return {
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    strengths: Array.isArray(parsed.strengths) ? (parsed.strengths as unknown[]).slice(0, 3).map(String) : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? (parsed.weaknesses as unknown[]).slice(0, 3).map(String) : [],
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
