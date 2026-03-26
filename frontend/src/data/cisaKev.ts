import type { ScoredCve } from '../interfaces/ScoredCve.interface';
import { scoreAllCves, DEFAULT_ORG_PROFILE } from '../engine/cveScorer';

export { DEFAULT_ORG_PROFILE };

const CISA_KEV_URL = 'https://raw.githubusercontent.com/cisagov/kev-catalog/main/docs/known_exploited_vulnerabilities.json';

export function estimateCvssScore(entry: Record<string, unknown>): number {
  let score = 7.5;
  const desc = ((entry.shortDescription as string) || '').toLowerCase();
  if ((entry.knownRansomwareCampaignUse as string) === 'Known') score += 1.5;
  if (desc.includes('remote code execution') || desc.includes('rce')) score += 1.5;
  if (desc.includes('authentication bypass')) score += 1.0;
  if (desc.includes('injection')) score += 1.0;
  if (desc.includes('privilege escalation')) score += 0.8;
  if (desc.includes('unauthenticated')) score += 0.7;
  return Math.min(10.0, score);
}

export async function fetchCisaKevData(limit = 50): Promise<ScoredCve[]> {
  try {
    const res = await fetch(CISA_KEV_URL);
    if (!res.ok) throw new Error('Fetch failed');
    const data = await res.json() as { vulnerabilities: Record<string, unknown>[] };
    const sorted = data.vulnerabilities
      .sort((a, b) => ((b.dateAdded as string) || '').localeCompare((a.dateAdded as string) || ''))
      .slice(0, limit);

    const cves: ScoredCve[] = sorted.map(entry => ({
      cveId: (entry.cveID as string) || '',
      name: (entry.vulnerabilityName as string) || (entry.cveID as string) || '',
      description: (entry.shortDescription as string) || '',
      cvssScore: estimateCvssScore(entry),
      affectedVendor: (entry.vendorProject as string) || 'Unknown',
      affectedProduct: (entry.product as string) || 'Unknown',
      knownRansomware: (entry.knownRansomwareCampaignUse as string) === 'Known',
      dateAdded: (entry.dateAdded as string) || '',
      threatScore: 0,
    }));

    return scoreAllCves(cves, DEFAULT_ORG_PROFILE);
  } catch {
    return scoreAllCves(FALLBACK_KEV_DATA, DEFAULT_ORG_PROFILE);
  }
}

export const FALLBACK_KEV_DATA: ScoredCve[] = [
  {
    cveId: 'CVE-2021-44228', name: 'Log4Shell',
    description: 'Apache Log4j2 JNDI remote code execution vulnerability allows unauthenticated remote attackers to execute arbitrary code',
    cvssScore: 10.0, affectedVendor: 'Apache', affectedProduct: 'Log4j2',
    knownRansomware: true, dateAdded: '2021-12-10', threatScore: 0,
  },
  {
    cveId: 'CVE-2023-28121', name: 'PAN-OS Authentication Bypass',
    description: 'Authentication bypass vulnerability in Palo Alto Networks PAN-OS allows unauthenticated network access',
    cvssScore: 9.8, affectedVendor: 'Palo Alto Networks', affectedProduct: 'PAN-OS',
    knownRansomware: false, dateAdded: '2023-03-15', threatScore: 0,
  },
  {
    cveId: 'CVE-2024-21887', name: 'Ivanti Connect Secure RCE',
    description: 'Remote code execution vulnerability in Ivanti Connect Secure VPN allows authenticated attackers to execute commands',
    cvssScore: 9.1, affectedVendor: 'Ivanti', affectedProduct: 'Connect Secure',
    knownRansomware: true, dateAdded: '2024-01-10', threatScore: 0,
  },
  {
    cveId: 'CVE-2022-30190', name: 'Follina MSDT RCE',
    description: 'Microsoft Windows Support Diagnostic Tool MSDT remote code execution via Office documents',
    cvssScore: 7.8, affectedVendor: 'Microsoft', affectedProduct: 'Windows MSDT',
    knownRansomware: true, dateAdded: '2022-05-30', threatScore: 0,
  },
  {
    cveId: 'CVE-2020-1472', name: 'Zerologon',
    description: 'Privilege escalation vulnerability in Netlogon allows unauthenticated attacker to become domain administrator',
    cvssScore: 10.0, affectedVendor: 'Microsoft', affectedProduct: 'Active Directory',
    knownRansomware: false, dateAdded: '2020-09-11', threatScore: 0,
  },
];
