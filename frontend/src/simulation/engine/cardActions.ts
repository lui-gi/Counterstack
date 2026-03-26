const SPADE_ACTIONS: Record<number, string> = {
  1: 'Ace Exploit', 2: 'Port Scan', 3: 'Phishing Probe', 4: 'SQL Injection',
  5: 'XSS Strike', 6: 'Brute Force', 7: 'MITM Attack', 8: 'DNS Poison',
  9: 'Buffer Overflow', 10: 'Zero-Day Strike', 11: 'APT Intrusion',
  12: 'Ransomware Deploy', 13: 'King Breach',
};
const CLUB_ACTIONS: Record<number, string> = {
  1: 'Asset Audit', 2: 'Log Review', 3: 'Patch Scan', 4: 'Config Check',
  5: 'Inventory Sync', 6: 'Risk Assessment', 7: 'Compliance Audit',
  8: 'Threat Intel', 9: 'Vuln Scan', 10: 'Policy Review',
  11: 'Security Audit', 12: 'Framework Align', 13: 'Maturity Assess',
};
const DIAMOND_ACTIONS: Record<number, string> = {
  1: 'MFA Deploy', 2: 'PAM Setup', 3: 'Firewall Rule', 4: 'Network Segment',
  5: 'Cert Rotation', 6: 'Key Harden', 7: 'Zero Trust Step', 8: 'RBAC Enforce',
  9: 'EDR Tune', 10: 'SIEM Harden', 11: 'SOC Upgrade', 12: 'Defense Layer',
  13: 'Fortress Mode',
};
const HEART_ACTIONS: Record<number, string> = {
  1: 'Quick Restore', 2: 'Backup Verify', 3: 'DR Test', 4: 'BCP Review',
  5: 'Snapshot Create', 6: 'Offsite Sync', 7: 'Failover Test', 8: 'RTO Optimize',
  9: 'Immutable Backup', 10: 'Crisis Response', 11: 'Full Recovery',
  12: 'Business Restore', 13: 'Continuity King',
};

export function getCardAction(suit: string, rank: number): string {
  switch (suit) {
    case 'spade': return SPADE_ACTIONS[rank] || `Spade ${rank}`;
    case 'club': return CLUB_ACTIONS[rank] || `Club ${rank}`;
    case 'diamond': return DIAMOND_ACTIONS[rank] || `Diamond ${rank}`;
    case 'heart': return HEART_ACTIONS[rank] || `Heart ${rank}`;
    default: return `Card ${rank}`;
  }
}
