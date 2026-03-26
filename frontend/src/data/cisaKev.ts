// CISA KEV (Known Exploited Vulnerabilities) data
// Fetched from: https://github.com/cisagov/kev-data

const CISA_KEV_URL = 'https://raw.githubusercontent.com/cisagov/kev-data/main/known_exploited_vulnerabilities.json';

// Raw entry from CISA KEV API
export interface CisaKevRawEntry {
  cveID: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  dateAdded: string;
  shortDescription: string;
  requiredAction: string;
  dueDate: string;
  knownRansomwareCampaignUse: string; // "Known" or "Unknown"
  notes: string;
  cwes?: string[];
}

// Normalized entry for our app
export interface CisaKevEntry {
  cveId: string;
  vendorProject: string;
  product: string;
  name: string;
  description: string;
  cvssScore: number;
  dateAdded: string;
  dueDate: string;
  knownRansomwareCampaignUse: boolean;
  requiredAction: string;
  cwes: string[];
}

/**
 * Estimate CVSS score based on vulnerability characteristics
 * Since CISA KEV doesn't include CVSS, we estimate based on:
 * - Ransomware usage (known = higher severity)
 * - Vulnerability type keywords (RCE, auth bypass = critical)
 */
function estimateCvssScore(entry: CisaKevRawEntry): number {
  let score = 7.5; // Base score for all KEV entries (they're actively exploited)

  // Ransomware usage indicates high impact
  if (entry.knownRansomwareCampaignUse === 'Known') {
    score += 1.5;
  }

  const name = entry.vulnerabilityName.toLowerCase();
  const desc = entry.shortDescription.toLowerCase();
  const combined = `${name} ${desc}`;

  // Critical vulnerability types
  if (combined.includes('remote code execution') || combined.includes('rce')) {
    score += 1.5;
  }
  if (combined.includes('authentication bypass') || combined.includes('auth bypass')) {
    score += 1.0;
  }
  if (combined.includes('command injection') || combined.includes('sql injection')) {
    score += 1.0;
  }
  if (combined.includes('privilege escalation')) {
    score += 0.8;
  }
  if (combined.includes('unauthenticated') || combined.includes('without authentication')) {
    score += 0.7;
  }

  // Cap at 10.0
  return Math.min(10.0, Math.round(score * 10) / 10);
}

/**
 * Normalize raw CISA KEV entry to our app format
 */
function normalizeEntry(raw: CisaKevRawEntry): CisaKevEntry {
  return {
    cveId: raw.cveID,
    vendorProject: raw.vendorProject,
    product: raw.product,
    name: raw.vulnerabilityName,
    description: raw.shortDescription,
    cvssScore: estimateCvssScore(raw),
    dateAdded: raw.dateAdded,
    dueDate: raw.dueDate,
    knownRansomwareCampaignUse: raw.knownRansomwareCampaignUse === 'Known',
    requiredAction: raw.requiredAction,
    cwes: raw.cwes || [],
  };
}

/**
 * Fetch live CISA KEV data from GitHub repository
 * Returns the most recent entries (sorted by dateAdded desc)
 */
export async function fetchCisaKevData(limit: number = 50): Promise<CisaKevEntry[]> {
  try {
    const response = await fetch(CISA_KEV_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const data = await response.json();
    const vulnerabilities: CisaKevRawEntry[] = data.vulnerabilities || [];

    // Sort by dateAdded descending (most recent first)
    const sorted = vulnerabilities.sort((a, b) =>
      new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
    );

    // Take the most recent entries and normalize
    return sorted.slice(0, limit).map(normalizeEntry);
  } catch (error) {
    console.error('Failed to fetch CISA KEV data:', error);
    // Return fallback data on error
    return FALLBACK_KEV_DATA;
  }
}

/**
 * Fallback data in case the fetch fails
 */
export const FALLBACK_KEV_DATA: CisaKevEntry[] = [
  {
    cveId: "CVE-2024-3400",
    vendorProject: "Palo Alto Networks",
    product: "PAN-OS",
    name: "Command Injection Vulnerability",
    description: "A command injection vulnerability in the GlobalProtect feature of Palo Alto Networks PAN-OS allows unauthenticated attackers to execute arbitrary code with root privileges.",
    cvssScore: 10.0,
    dateAdded: "2024-04-12",
    dueDate: "2024-04-19",
    knownRansomwareCampaignUse: true,
    requiredAction: "Apply mitigations per vendor instructions or discontinue use of the product if mitigations are unavailable.",
    cwes: ["CWE-77"],
  },
  {
    cveId: "CVE-2024-21887",
    vendorProject: "Ivanti",
    product: "Connect Secure",
    name: "Command Injection Vulnerability",
    description: "A command injection vulnerability in web components of Ivanti Connect Secure and Ivanti Policy Secure allows an authenticated administrator to send specially crafted requests and execute arbitrary commands.",
    cvssScore: 9.1,
    dateAdded: "2024-01-10",
    dueDate: "2024-01-22",
    knownRansomwareCampaignUse: true,
    requiredAction: "Apply mitigations per vendor instructions or discontinue use of the product if mitigations are unavailable.",
    cwes: ["CWE-77"],
  },
  {
    cveId: "CVE-2024-1709",
    vendorProject: "ConnectWise",
    product: "ScreenConnect",
    name: "Authentication Bypass Vulnerability",
    description: "ConnectWise ScreenConnect contains an authentication bypass vulnerability that allows an attacker to directly access confidential information or critical systems.",
    cvssScore: 10.0,
    dateAdded: "2024-02-22",
    dueDate: "2024-02-29",
    knownRansomwareCampaignUse: true,
    requiredAction: "Apply mitigations per vendor instructions or discontinue use of the product if mitigations are unavailable.",
    cwes: ["CWE-288"],
  },
  {
    cveId: "CVE-2021-44228",
    vendorProject: "Apache",
    product: "Log4j2",
    name: "Remote Code Execution (Log4Shell)",
    description: "Apache Log4j2 contains a vulnerability where JNDI features do not protect against attacker-controlled LDAP and other JNDI related endpoints, allowing for remote code execution.",
    cvssScore: 10.0,
    dateAdded: "2021-12-10",
    dueDate: "2021-12-24",
    knownRansomwareCampaignUse: true,
    requiredAction: "Apply updates per vendor instructions.",
    cwes: ["CWE-917"],
  },
  {
    cveId: "CVE-2023-4966",
    vendorProject: "Citrix",
    product: "NetScaler ADC",
    name: "Buffer Overflow Vulnerability (Citrix Bleed)",
    description: "Citrix NetScaler ADC and NetScaler Gateway contain a buffer overflow vulnerability that allows for sensitive information disclosure when configured as a Gateway.",
    cvssScore: 9.4,
    dateAdded: "2023-10-18",
    dueDate: "2023-10-25",
    knownRansomwareCampaignUse: true,
    requiredAction: "Apply mitigations per vendor instructions or discontinue use of the product if mitigations are unavailable.",
    cwes: ["CWE-119"],
  },
];

// For backwards compatibility - export static data that can be used immediately
// Components should prefer fetchCisaKevData() for live data
export const CISA_KEV_DATA = FALLBACK_KEV_DATA;
