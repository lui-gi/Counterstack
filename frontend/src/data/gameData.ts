import type { SuitConfig } from '../interfaces/SuitConfig.interface';
import type { SuitMetric } from '../interfaces/SuitMetric.interface';
import type { SuitRisk } from '../interfaces/SuitRisk.interface';
import type { SuitDataEntry } from '../interfaces/SuitDataEntry.interface';
import type { MockIncident } from '../interfaces/MockIncident.interface';
import type { MockEngineer } from '../interfaces/MockEngineer.interface';
import type { JokerThreat } from '../interfaces/JokerThreat.interface';
import type { CommMessage } from '../interfaces/CommMessage.interface';
import type { AIRec } from '../interfaces/AIRec.interface';

export type { SuitConfig, SuitMetric, SuitRisk, SuitDataEntry, MockIncident, MockEngineer, JokerThreat, CommMessage, AIRec };

export const RANK_NAMES: string[] = ["","A","2","3","4","5","6","7","8","9","10","J","Q","K"];
export const RANK_FULL: string[] = ["","Ace","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Jack","Queen","King"];

export const SUITS: Record<string, SuitConfig> = {
  clover:  { sym:"♣", name:"RESOURCES",  sub:"Baseline Health",     color:"#39d353", dark:"#0a1f0d", glow:"#39d35340", pos:"top"   },
  spade:   { sym:"♠", name:"OFFENSIVE",  sub:"Detection & Contain", color:"#00d4ff", dark:"#001f2d", glow:"#00d4ff40", pos:"left"  },
  diamond: { sym:"♦", name:"HARDEN",     sub:"Hardening & Access",  color:"#a78bfa", dark:"#160f2d", glow:"#a78bfa40", pos:"right" },
  heart:   { sym:"♥", name:"RESILIENCE", sub:"Backup & Continuity", color:"#f72585", dark:"#1f0010", glow:"#f7258540", pos:"bottom"},
};

export const SUIT_DATA: Record<string, SuitDataEntry> = {
  clover: {
    risks:[
      { n:"Legacy OS endpoints (47)",      lvl:"high"   },
      { n:"Unpatched critical CVEs (12)",  lvl:"high"   },
      { n:"Rogue device detected",         lvl:"medium" },
      { n:"SIEM rule staleness",           lvl:"low"    },
    ],
    capabilities:["Asset Discovery","Vulnerability Scanning","Compliance Tracking","Network Baseline","EDR Coverage"],
    upgrade:["Achieve 100% asset inventory","Automate patch deployment","Implement continuous compliance","Deploy EDR universally"],
    aiRecs:["Patch the 12 critical CVEs immediately","Enable auto-discovery on subnet 10.0.4.x","Schedule EDR rollout for legacy OS tier","Increase scan frequency to 4-hour cycles"],
    baseScore: 72,
  },
  spade: {
    risks:[
      { n:"No 24/7 SOC coverage",             lvl:"high"   },
      { n:"Unmonitored endpoint segment",     lvl:"medium" },
      { n:"Playbook gaps in IR workflow",     lvl:"medium" },
    ],
    capabilities:["SIEM Integration","Threat Hunting","Automated Playbooks","XDR Coverage","Deception Tech"],
    upgrade:["Activate 24/7 SOC rotation","Deploy deception honeypots","Integrate threat intel feeds","Enable ML anomaly detection"],
    aiRecs:["Schedule night-shift SOC rotation","Deploy honeypot on DMZ segment","Integrate MITRE ATT&CK framework","Tune alert threshold to reduce fatigue"],
    baseScore: 81,
  },
  diamond: {
    risks:[
      { n:"15 over-privileged service accounts", lvl:"high"   },
      { n:"WAF bypass attempt detected",         lvl:"high"   },
      { n:"Stale API tokens (31)",               lvl:"medium" },
    ],
    capabilities:["Zero Trust Architecture","PAM Controls","WAF Rules","IAM Governance","API Gateway"],
    upgrade:["Complete Zero Trust rollout","Automate privilege reviews","Harden API gateway","Implement CASB"],
    aiRecs:["Revoke 31 stale API tokens immediately","Enforce PAM on all service accounts","Update WAF ruleset — CVE-2024-3901","Enable CASB for SaaS shadow IT"],
    baseScore: 74,
  },
  heart: {
    risks:[
      { n:"DR plan untested (6 months)", lvl:"high"   },
      { n:"Offsite backup latency",      lvl:"medium" },
      { n:"Single restore point — DB",   lvl:"medium" },
    ],
    capabilities:["Automated Backups","DR Orchestration","Runbook Automation","BCP Testing","Multi-region Replication"],
    upgrade:["Achieve sub-1hr RTO","Test DR quarterly","Multi-region replication","Automate restore validation"],
    aiRecs:["Schedule DR drill this week","Enable multi-region S3 replication","Automate nightly restore validation","Reduce RTO target to 60 min"],
    baseScore: 63,
  },
};

export const HAND_ORDER = ["HIGH CARD","ONE PAIR","TWO PAIR","THREE OF A KIND","STRAIGHT","FULL HOUSE","FOUR OF A KIND","ROYAL FLUSH"];

export const MOCK_INCIDENTS: MockIncident[] = [
  {id:1,name:"Zero-Day API Exploit",sev:"Critical",time:"14:23",suit:"spade",status:"Active"},
  {id:2,name:"Phishing — Finance",sev:"High",time:"13:50",suit:"clover",status:"Investigating"},
  {id:3,name:"Ransomware Precursor",sev:"High",time:"12:12",suit:"heart",status:"Contained"},
  {id:4,name:"Privilege Escalation",sev:"Medium",time:"11:45",suit:"diamond",status:"Monitoring"},
  {id:5,name:"Anomalous API Traffic",sev:"Low",time:"10:30",suit:"spade",status:"Resolved"},
];

export const MOCK_ENGINEERS: MockEngineer[] = [
  {name:"SOC Online",pct:100,color:"#39d353"},
  {name:"Cloud Sec",pct:65,color:"#f72585"},
  {name:"Dev Patching",pct:42,color:"#a78bfa"},
];

export const HISTORY: Record<string, number[]> = {
  clover: [5,6,6,7,7,8,8,9,9,9,10,10],
  spade:  [4,5,5,6,7,7,8,8,9,9,10,10],
  diamond:[4,5,6,6,7,8,8,9,9,10,10,10],
  heart:  [3,3,4,4,5,5,6,6,7,7,7,8],
};

export const JOKER_THREATS: JokerThreat[] = [
  {n:"Remote Code Exec (RCE)",     lvl:"critical"},
  {n:"Lateral Movement",           lvl:"high"},
  {n:"Data Exfiltration",          lvl:"high"},
  {n:"Privilege Escalation",       lvl:"critical"},
  {n:"Persistence via API Keys",   lvl:"medium"},
];

export const INIT_RANKS: Record<string, number> = { clover:7, spade:9, diamond:8, heart:6 };
export const INIT_TELEMETRY: Record<string, number> = { clover:0, spade:0, diamond:0, heart:0 };

export const COMMS_INIT: CommMessage[] = [
  {role:"AI",   msg:"Threat vector identified: API Gateway. Recommend immediate containment.",time:"14:23"},
  {role:"Sec",  msg:"Acknowledged. Initiating SOC response protocol Alpha.",                  time:"14:24"},
  {role:"Dev",  msg:"Patching CVE-2024-3912 now. ETA 15 minutes.",                            time:"14:26"},
  {role:"AI",   msg:"Lateral movement in subnet 10.0.4.x — escalate containment scope.",      time:"14:28"},
];

export const TAG_COLORS: Record<string, string> = {External:"#00d4ff",Cloud:"#a78bfa","Priv Esc":"#f72585",RCE:"#ff9f1c"};
export const SEV_COLOR: Record<string, string>  = {Critical:"#f72585",High:"#ff9f1c",Medium:"#f7df1e",Low:"#39d353"};
export const STAT_COLOR: Record<string, string> = {Active:"#f72585",Investigating:"#ff9f1c",Contained:"#39d353",Monitoring:"#00d4ff",Resolved:"rgba(205,217,229,.45)"};

export const AI_RECS: AIRec[] = [
  {suit:"spade",  rank:10, rationale:"Increase SOC coverage to close detection gap"},
  {suit:"diamond",rank:11, rationale:"Enforce PAM on all privilege accounts"},
  {suit:"heart",  rank:9,  rationale:"Schedule DR test to validate RTO"},
  {suit:"clover", rank:11, rationale:"Patch critical CVEs & achieve 95%+ compliance"},
];
