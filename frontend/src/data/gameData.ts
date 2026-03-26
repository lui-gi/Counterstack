import type { SuitConfig } from '../interfaces/SuitConfig.interface';

export const RANK_NAMES = ["","A","2","3","4","5","6","7","8","9","10","J","Q","K"] as const;

export const SUITS: Record<string, SuitConfig> = {
  clover:  { sym: '♣', name: 'HEALTH',   sub: 'Baseline Health & Monitoring',  color: '#00f5d4', dark: '#021a14', glow: '#00f5d440', pos: 'top'    },
  spade:   { sym: '♠', name: 'ENGAGE',   sub: 'Detection & Containment',       color: '#00aaff', dark: '#001428', glow: '#00aaff4040', pos: 'left'   },
  diamond: { sym: '♦', name: 'STRENGTH', sub: 'Hardening & Access Control',    color: '#b48afa', dark: '#130a2a', glow: '#b48afa40', pos: 'right'  },
  heart:   { sym: '♥', name: 'RECOVERY', sub: 'Backup & Business Continuity',  color: '#ff2277', dark: '#1f0012', glow: '#ff227740', pos: 'bottom' },
};

export const INIT_RANKS: Record<string, number> = {
  clover: 7,
  spade: 7,
  diamond: 7,
  heart: 7,
};

export interface SuitMetric {
  key: string;
  value: string;
  rawPct: number;
  trend: 'up' | 'down' | 'flat';
}

export interface SuitRisk {
  label: string;
  severity: 'high' | 'medium' | 'low';
}

export interface SuitDataEntry {
  metrics: SuitMetric[];
  risks: SuitRisk[];
  capabilities: string[];
  upgradePath: string[];
  aiRecs: string[];
}

export const SUIT_DATA: Record<string, SuitDataEntry> = {
  clover: {
    metrics: [
      { key: 'Patch Compliance',    value: '87%',   rawPct: 87, trend: 'up'   },
      { key: 'Asset Visibility',    value: '2,419', rawPct: 91, trend: 'up'   },
      { key: 'Vuln Scan Coverage',  value: '91%',   rawPct: 91, trend: 'up'   },
      { key: 'Config Drift',        value: '6%',    rawPct: 6,  trend: 'down' },
    ],
    risks: [
      { label: 'Legacy OS endpoints (47)',     severity: 'high'   },
      { label: 'Unpatched critical CVEs (12)', severity: 'high'   },
      { label: 'Rogue device detected',        severity: 'medium' },
      { label: 'SIEM rule staleness',          severity: 'low'    },
    ],
    capabilities: ['Asset Discovery', 'Vulnerability Scanning', 'Compliance Tracking', 'Network Baseline', 'EDR Coverage'],
    upgradePath:  ['Achieve 100% asset inventory', 'Automate patch deployment', 'Implement continuous compliance', 'Deploy EDR universally'],
    aiRecs: [
      'Patch the 12 critical CVEs immediately',
      'Enable auto-discovery on subnet 10.0.4.x',
      'Schedule EDR rollout for legacy OS tier',
      'Increase scan frequency to 4-hour cycles',
    ],
  },
  spade: {
    metrics: [
      { key: 'Mean Time to Detect', value: '4.2m', rawPct: 58, trend: 'down' },
      { key: 'SOC Analysts Online',  value: '7',   rawPct: 70, trend: 'flat' },
      { key: 'Containment Rate',     value: '94%', rawPct: 94, trend: 'up'   },
      { key: 'Alert Fatigue',        value: '23%', rawPct: 77, trend: 'down' },
    ],
    risks: [
      { label: 'No 24/7 SOC coverage',            severity: 'high'   },
      { label: 'Unmonitored endpoint segment',     severity: 'medium' },
      { label: 'Playbook gaps in IR workflow',     severity: 'medium' },
    ],
    capabilities: ['SIEM Integration', 'Threat Hunting', 'Automated Playbooks', 'XDR Coverage', 'Deception Tech'],
    upgradePath:  ['Activate 24/7 SOC rotation', 'Deploy deception honeypots', 'Integrate threat intel feeds', 'Enable ML anomaly detection'],
    aiRecs: [
      'Schedule night-shift SOC rotation',
      'Deploy honeypot on DMZ segment',
      'Integrate MITRE ATT&CK framework',
      'Tune alert threshold to reduce fatigue',
    ],
  },
  diamond: {
    metrics: [
      { key: 'Zero Trust Coverage',  value: '68%', rawPct: 68, trend: 'up'   },
      { key: 'MFA Enforcement',      value: '96%', rawPct: 96, trend: 'up'   },
      { key: 'Privileged Accts OK',  value: '78%', rawPct: 78, trend: 'up'   },
      { key: 'Attack Surface',       value: '34',  rawPct: 66, trend: 'down' },
    ],
    risks: [
      { label: '15 over-privileged service accounts', severity: 'high'   },
      { label: 'WAF bypass attempt detected',         severity: 'high'   },
      { label: 'Stale API tokens (31)',               severity: 'medium' },
    ],
    capabilities: ['Zero Trust Architecture', 'PAM Controls', 'WAF Rules', 'IAM Governance', 'API Gateway'],
    upgradePath:  ['Complete Zero Trust rollout', 'Automate privilege reviews', 'Harden API gateway', 'Implement CASB'],
    aiRecs: [
      'Revoke 31 stale API tokens immediately',
      'Enforce PAM on all service accounts',
      'Update WAF ruleset — CVE-2026-1337',
      'Enable CASB for SaaS shadow IT',
    ],
  },
  heart: {
    metrics: [
      { key: 'RTO Achieved',        value: '99m',   rawPct: 67, trend: 'down' },
      { key: 'Backup Success Rate', value: '99.4%', rawPct: 99, trend: 'up'   },
      { key: 'DR Test Score',       value: 'B+',    rawPct: 75, trend: 'flat' },
      { key: 'MTTR',                value: '2.1hrs', rawPct: 71, trend: 'down' },
    ],
    risks: [
      { label: 'DR plan untested (6 months)',  severity: 'high'   },
      { label: 'Offsite backup latency',       severity: 'medium' },
      { label: 'Single restore point — DB',    severity: 'medium' },
    ],
    capabilities: ['Automated Backups', 'DR Orchestration', 'Runbook Automation', 'BCP Testing', 'Multi-region Replication'],
    upgradePath:  ['Achieve sub-1hr RTO', 'Test DR quarterly', 'Multi-region replication', 'Automate restore validation'],
    aiRecs: [
      'Schedule DR drill this week',
      'Enable multi-region S3 replication',
      'Automate nightly restore validation',
      'Reduce RTO target to 60 min',
    ],
  },
};

/** Sparkline history for posture chart (last 6 data points per suit) */
export const HISTORY: Record<string, number[]> = {
  clover:  [5, 6, 6, 7, 7, 7],
  spade:   [4, 5, 6, 6, 7, 8],
  diamond: [6, 6, 7, 7, 6, 7],
  heart:   [4, 4, 5, 5, 6, 7],
};
