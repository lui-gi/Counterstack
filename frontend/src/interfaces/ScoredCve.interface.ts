export interface ScoredCve {
  cveId: string;               // e.g., "CVE-2024-3400"
  name: string;                // e.g., "PAN-OS Command Injection"
  description: string;         // Full description
  cvssScore: number;           // Raw CVSS (0-10)
  threatPct: number;           // Calculated threat % (0-100)
  exploitedInWild: boolean;    // From CISA KEV
  affectedVendor: string;      // e.g., "Palo Alto Networks"
  affectedProduct: string;     // e.g., "PAN-OS"
  dueDate?: string;            // CISA remediation deadline
  requiredAction?: string;     // CISA required action/mitigation
  cwes?: string[];             // CWE IDs (e.g., ["CWE-77"])
}
