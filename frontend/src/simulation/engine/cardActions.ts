// ============================================================
// simulation/engine/cardActions.ts
// Named cybersecurity action for every card rank × suit.
// Used by PlayerHand to show the action before executing it.
// ============================================================

export const CARD_ACTIONS: Record<string, Record<number, string>> = {
  spades: {
    2:  'Port Scan',
    3:  'Flag Malicious Behavior',
    4:  'Block Suspicious IP',
    5:  'Terminate Suspicious Process',
    6:  'Disable Compromised Account',
    7:  'Remove Malware Artifact',
    8:  'Quarantine Infected Endpoint',
    9:  'Kill Persistence Mechanism',
    10: 'Sinkhole Malicious Domain',
    11: 'Bug Bounty',
    12: 'Network Isolation',
    13: 'Full Threat Neutralization',
    1:  'Advanced Counterstrike',
  },
  clubs: {
    2:  'Asset Inventory',
    3:  'Assign SOC Analyst',
    4:  'Increase Logging',
    5:  'Activate Monitoring',
    6:  'Deploy Detection Rule',
    7:  'Enable Threat Intel Feed',
    8:  'Expand Monitoring Coverage',
    9:  'Automated Alert Triage',
    10: 'Investigation Boost',
    11: 'SOC Surge Support',
    12: 'Security Ops Expansion',
    13: 'Full SOC Mobilization',
    1:  'Emergency Resource Surge',
  },
  diamonds: {
    2:  'System Integrity Check',
    3:  'Security Posture Scan',
    4:  'Deploy Firewall Rule',
    5:  'Apply Security Config',
    6:  'Enable Endpoint Protection',
    7:  'Patch Vulnerability',
    8:  'Strengthen Authentication',
    9:  'Network Segmentation',
    10: 'Infrastructure Hardening',
    11: 'Defensive Reinforcement',
    12: 'Enterprise Security Upgrade',
    13: 'Maximum Defense Protocol',
    1:  'Zero Trust Lockdown',
  },
  hearts: {
    2:  'Health Check',
    3:  'System Diagnostics',
    4:  'Restore Minor Service',
    5:  'Reset User Credentials',
    6:  'Repair System Damage',
    7:  'Restore Critical Service',
    8:  'Recover Endpoint',
    9:  'Restore Backup Data',
    10: 'System Rebuild',
    11: 'Incident Recovery',
    12: 'Full System Restoration',
    13: 'Enterprise Recovery Protocol',
    1:  'Disaster Recovery Activation',
  },
};

export function getCardAction(suit: string, rank: number): string {
  return CARD_ACTIONS[suit]?.[rank] ?? 'Execute Action';
}
