"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════
// DATA LAYER
// ═══════════════════════════════════════════════════════
const RANK_NAMES = ["","A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const RANK_FULL  = ["","Ace","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Jack","Queen","King"];

const SUITS = {
  clover:  { sym:"♣", name:"HEALTH",   sub:"Baseline Health & Monitoring",  color:"#00f5d4", dark:"#021a14", glow:"#00f5d440", pos:"top"    },
  spade:   { sym:"♠", name:"ENGAGE",   sub:"Detection & Containment",       color:"#00aaff", dark:"#001428", glow:"#00aaff40", pos:"left"   },
  diamond: { sym:"♦", name:"STRENGTH", sub:"Hardening & Access Control",    color:"#b48afa", dark:"#130a2a", glow:"#b48afa40", pos:"right"  },
  heart:   { sym:"♥", name:"RECOVERY", sub:"Backup & Business Continuity",  color:"#ff2277", dark:"#1f0012", glow:"#ff227740", pos:"bottom" },
};

const SUIT_DATA = {
  clover: {
    baseScore:72,
    telemetry:[
      {ok:true, text:"SIEM coverage: 94% of endpoints"},{ok:true, text:"EDR active on 312 / 330 hosts"},
      {ok:true, text:"Log pipeline uptime: 99.7%"},{ok:false,text:"18 unmonitored legacy assets"},
      {ok:false,text:"Telemetry gap: DMZ segment 3"},
    ],
    nextLevel:{target:"Ten of Clovers",steps:["Deploy EDR agents to remaining 18 legacy hosts","Extend SIEM coverage to DMZ segment 3","Implement NetFlow v9 across core switches","Enable DNS query logging on all resolvers"]},
    metrics:[{k:"Patch Compliance",v:"87%",raw:87,trend:+3},{k:"Asset Visibility",v:"2,419",raw:91,trend:+14},{k:"Vuln Scan Coverage",v:"91%",raw:91,trend:+2},{k:"Config Drift",v:"6%",raw:6,trend:-4}],
    risks:[{n:"Legacy OS endpoints (47)",lvl:"high"},{n:"Unpatched critical CVEs (12)",lvl:"high"},{n:"Rogue device detected",lvl:"medium"},{n:"SIEM rule staleness",lvl:"low"}],
    capabilities:["Asset Discovery","Vulnerability Scanning","Compliance Tracking","Network Baseline","EDR Coverage"],
    upgrade:["Achieve 100% asset inventory","Automate patch deployment","Implement continuous compliance","Deploy EDR universally"],
    aiRecs:["Patch the 12 critical CVEs immediately","Enable auto-discovery on subnet 10.0.4.x","Schedule EDR rollout for legacy OS tier","Increase scan frequency to 4-hour cycles"],
  },
  spade: {
    baseScore:81,
    telemetry:[
      {ok:false,text:"47 brute-force attempts in last 24h"},{ok:false,text:"3 IPs on threat-intel watchlist active"},
      {ok:false,text:"API scan detected via Shodan crawler"},{ok:true, text:"IDS blocking 89% of signature hits"},
      {ok:true, text:"DDoS mitigation: CDN layer active"},
    ],
    nextLevel:{target:"Ten of Spades",steps:["Block 3 watchlisted IPs at perimeter firewall","Enable geo-fencing for high-risk origin regions","Deploy SSH/RDP honeypot for early lateral detection","Raise IDS rule confidence threshold to 95%"]},
    metrics:[{k:"Mean Time to Detect",v:"4.2m",raw:58,trend:-12},{k:"SOC Analysts Online",v:"7",raw:70,trend:0},{k:"Containment Rate",v:"94%",raw:94,trend:+5},{k:"Alert Fatigue",v:"23%",raw:77,trend:-8}],
    risks:[{n:"No 24/7 SOC coverage",lvl:"high"},{n:"Unmonitored endpoint segment",lvl:"medium"},{n:"Playbook gaps in IR workflow",lvl:"medium"}],
    capabilities:["SIEM Integration","Threat Hunting","Automated Playbooks","XDR Coverage","Deception Tech"],
    upgrade:["Activate 24/7 SOC rotation","Deploy deception honeypots","Integrate threat intel feeds","Enable ML anomaly detection"],
    aiRecs:["Schedule night-shift SOC rotation","Deploy honeypot on DMZ segment","Integrate MITRE ATT&CK framework","Tune alert threshold to reduce fatigue"],
  },
  diamond: {
    baseScore:74,
    telemetry:[
      {ok:true, text:"Firewall active — 2,847 rules loaded"},{ok:true, text:"WAF enabled on 4 of 6 API gateways"},
      {ok:false,text:"3 critical API vulnerabilities unpatched"},{ok:false,text:"TLS 1.0 active on legacy endpoints"},
      {ok:false,text:"Config drift detected on 12 servers"},
    ],
    nextLevel:{target:"Ten of Diamonds",steps:["Patch CVE-2026-1337, -1338, -1339 (critical API chain)","Enable strict WAF rules for lateral movement vectors","Verify config integrity on 12 drifted servers","Disable TLS 1.0 / 1.1 on all legacy endpoints"]},
    metrics:[{k:"Zero Trust Coverage",v:"68%",raw:68,trend:+12},{k:"MFA Enforcement",v:"96%",raw:96,trend:+4},{k:"Privileged Accts OK",v:"78%",raw:78,trend:+8},{k:"Attack Surface",v:"34",raw:66,trend:-9}],
    risks:[{n:"15 over-privileged service accounts",lvl:"high"},{n:"WAF bypass attempt detected",lvl:"high"},{n:"Stale API tokens (31)",lvl:"medium"}],
    capabilities:["Zero Trust Architecture","PAM Controls","WAF Rules","IAM Governance","API Gateway"],
    upgrade:["Complete Zero Trust rollout","Automate privilege reviews","Harden API gateway","Implement CASB"],
    aiRecs:["Revoke 31 stale API tokens immediately","Enforce PAM on all service accounts","Update WAF ruleset — CVE-2026-1337","Enable CASB for SaaS shadow IT"],
  },
  heart: {
    baseScore:63,
    telemetry:[
      {ok:true, text:"Backup integrity verified (6h ago)"},{ok:true, text:"RTO target < 4 hours tested & confirmed"},
      {ok:true, text:"IR runbooks: 23 / 25 updated"},{ok:false,text:"Offsite backup sync: 14h behind"},
      {ok:false,text:"2 IR playbooks not tested in 90 days"},
    ],
    nextLevel:{target:"Nine of Hearts",steps:["Fix offsite backup sync pipeline (14h lag)","Run tabletop exercise on 2 outdated IR playbooks","Implement hourly automated backup integrity checks","Define and document < 2hr RTO for critical APIs"]},
    metrics:[{k:"RTO Achieved",v:"99m",raw:67,trend:-18},{k:"Backup Success Rate",v:"99.4%",raw:99,trend:+1},{k:"DR Test Score",v:"B+",raw:75,trend:0},{k:"MTTR",v:"2.1hrs",raw:71,trend:-22}],
    risks:[{n:"DR plan untested (6 months)",lvl:"high"},{n:"Offsite backup latency",lvl:"medium"},{n:"Single restore point — DB",lvl:"medium"}],
    capabilities:["Automated Backups","DR Orchestration","Runbook Automation","BCP Testing","Multi-region Replication"],
    upgrade:["Achieve sub-1hr RTO","Test DR quarterly","Multi-region replication","Automate restore validation"],
    aiRecs:["Schedule DR drill this week","Enable multi-region S3 replication","Automate nightly restore validation","Reduce RTO target to 60 min"],
  },
};

function computePosture(ranks) {
  const vals=Object.values(ranks);const counts={};
  vals.forEach(v=>counts[v]=(counts[v]||0)+1);
  const freq=Object.values(counts).sort((a,b)=>b-a);
  const sorted=[...vals].sort((a,b)=>a-b);
  const isStr=sorted[3]-sorted[0]===3&&new Set(sorted).size===4;
  if(vals.every(v=>v>=11))     return{hand:"ROYAL FLUSH",    tier:7,score:100,royal:true, desc:"Maximum Defense Posture"};
  if(freq[0]===4)              return{hand:"FOUR OF A KIND", tier:6,score:92, royal:false,desc:"Elite Posture"};
  if(freq[0]===3&&freq[1]===2) return{hand:"FULL HOUSE",     tier:5,score:84, royal:false,desc:"Strong Posture"};
  if(isStr)                    return{hand:"STRAIGHT",       tier:4,score:76, royal:false,desc:"Balanced Posture"};
  if(freq[0]===3)              return{hand:"THREE OF A KIND",tier:3,score:65, royal:false,desc:"Developing Posture"};
  if(freq[0]===2&&freq[1]===2) return{hand:"TWO PAIR",       tier:2,score:54, royal:false,desc:"Partial Coverage"};
  if(freq[0]===2)              return{hand:"ONE PAIR",       tier:1,score:40, royal:false,desc:"Limited Coverage"};
  return{hand:"HIGH CARD",tier:0,score:Math.round(vals.reduce((a,b)=>a+b,0)/4*5),royal:false,desc:"Exposed Posture"};
}

const MOCK_INCIDENTS=[
  {id:1,name:"Zero-Day API Exploit",sev:"Critical",time:"14:23",suit:"spade",status:"Active"},
  {id:2,name:"Phishing — Finance",sev:"High",time:"13:50",suit:"clover",status:"Investigating"},
  {id:3,name:"Ransomware Precursor",sev:"High",time:"12:12",suit:"heart",status:"Contained"},
  {id:4,name:"Privilege Escalation",sev:"Medium",time:"11:45",suit:"diamond",status:"Monitoring"},
  {id:5,name:"Anomalous API Traffic",sev:"Low",time:"10:30",suit:"spade",status:"Resolved"},
];
const MOCK_ENGINEERS=[
  {name:"SOC Online",pct:100,color:"#00f5d4"},
  {name:"Cloud Sec",pct:65,color:"#ff2277"},
  {name:"Dev Patching",pct:42,color:"#b48afa"},
];
const HISTORY={clover:[5,6,6,7,7,8,8,9,9,9,10,10],spade:[4,5,5,6,7,7,8,8,9,9,10,10],diamond:[4,5,6,6,7,8,8,9,9,10,10,10],heart:[3,3,4,4,5,5,6,6,7,7,7,8]};
const JOKER_THREATS=[{n:"Remote Code Exec (RCE)",lvl:"critical"},{n:"Lateral Movement",lvl:"high"},{n:"Data Exfiltration",lvl:"high"},{n:"Privilege Escalation",lvl:"critical"},{n:"Persistence via API Keys",lvl:"medium"}];
const INCIDENT={cve:"CVE-2026-1337",entry:"External – Public API",type:"Zero-Day Exploit",severity:"CRITICAL",recs:[{p:"P0",action:"Isolate API Gateway pods immediately"},{p:"P0",action:"Rotate all API keys and OAuth tokens"},{p:"P1",action:"Apply emergency WAF rule — block CVE-2026-1337 vector"},{p:"P1",action:"Enable enhanced logging on Auth Service"},{p:"P1",action:"Trigger IR Playbook: Zero-Day Response v3"}]};
const BASE_LOGS=[
  {id:1,t:"04:17:03",tag:"SYSTEM",msg:"Incident Room initialized — Threat: CVE-2026-1337"},
  {id:2,t:"04:17:05",tag:"JOKER",msg:"Beginning telemetry ingestion from 6 data sources..."},
  {id:3,t:"04:17:08",tag:"SYSTEM",msg:"Pulling CVSS v3.1 vector: AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H"},
  {id:4,t:"04:17:12",tag:"JOKER",msg:"Vector analysis complete. Attack surface mapped to Auth Service."},
  {id:5,t:"04:17:19",tag:"SYSTEM",msg:"MITRE ATT&CK: T1190 (Exploit Public-Facing Application) detected."},
  {id:6,t:"04:17:24",tag:"JOKER",msg:"Intelligence at 67%. Refining threat model..."},
];
const ROLLING_LOGS=[
  {tag:"SYSTEM",msg:"Ingesting new CVSS v3.1 vector data from NVD live feed..."},
  {tag:"JOKER",msg:"Analyzing CVE-2026-1337 payload — 3 new code execution paths identified."},
  {tag:"SYSTEM",msg:"Vulnerability mapped: Auth Service token handler. Posture model updating..."},
  {tag:"JOKER",msg:"Privilege escalation confirmed via crafted JWT header. Confidence: 91%."},
  {tag:"SYSTEM",msg:"Correlating with threat-intel feed: 2 known APT groups use this technique."},
  {tag:"JOKER",msg:"Intelligence increased to 72%. Mitigation: isolate token issuer, rotate signing keys."},
  {tag:"SYSTEM",msg:"Scanning lateral movement paths from API Gateway... 4 internal paths found."},
  {tag:"JOKER",msg:"Updating Diamond hardening recommendations. WAF strictness upgrade required."},
  {tag:"SYSTEM",msg:"WAF rule match rate for CVE-2026-1337 vector: 94.3%. Monitoring bypass attempts."},
  {tag:"JOKER",msg:"Data exfil risk revised downward. Spread risk recalculated: 58% (was 62%)."},
];
const COMMS_INIT=[
  {role:"AI",msg:"Threat vector identified: API Gateway. Recommend immediate containment.",time:"14:23"},
  {role:"Sec",msg:"Acknowledged. Initiating SOC response protocol Alpha.",time:"14:24"},
  {role:"Dev",msg:"Patching CVE-2026-1337 now. ETA 15 minutes.",time:"14:26"},
  {role:"AI",msg:"Lateral movement in subnet 10.0.4.x — escalate containment scope.",time:"14:28"},
];
const AI_RECS=[{suit:"spade",rank:10,rationale:"Increase SOC coverage"},{suit:"diamond",rank:11,rationale:"Enforce PAM on all accounts"},{suit:"heart",rank:9,rationale:"Schedule DR test"},{suit:"clover",rank:11,rationale:"Patch critical CVEs"}];
const SEV_COLOR={Critical:"#ff2277",High:"#ff9f1c",Medium:"#f7df1e",Low:"#00f5d4"};
const STAT_COLOR={Active:"#ff2277",Investigating:"#ff9f1c",Contained:"#00f5d4",Monitoring:"#00aaff",Resolved:"rgba(205,217,229,.45)"};
const INIT_RANKS={clover:7,spade:9,diamond:8,heart:6};
const roleColor={AI:"#00aaff",Sec:"#ff2277",Dev:"#b48afa",You:"#fff"};

// ═══════════════════════════════════════════════════════
// GLOBAL CSS
// ═══════════════════════════════════════════════════════
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800;900&family=Orbitron:wght@400;600;700;900&family=DM+Mono:wght@300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#030309;--bg2:#060d1a;--panel:rgba(4,12,28,0.93);
  --cyan:#00f5d4;--violet:#b48afa;--blue:#00aaff;--pink:#ff2277;--gold:#f5c400;
  --text:#c8d6e8;--dim:rgba(200,214,232,0.4);--border:rgba(0,245,212,0.12);
  --fh:'Orbitron',sans-serif;--fb:'Poppins',sans-serif;--fm:'DM Mono',monospace;
  --r:8px;
}
html,body{width:100%;height:100%;overflow:hidden;background:var(--bg)}
body{font-family:var(--fb);color:var(--text);font-size:13px}
::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-thumb{background:rgba(0,245,212,0.2);border-radius:2px}

.noise{position:fixed;inset:0;z-index:9999;pointer-events:none;opacity:.018;
  background:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.scanlines{position:fixed;inset:0;z-index:9998;pointer-events:none;
  background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.04) 2px,rgba(0,0,0,.04) 4px)}
.gridbg{position:fixed;inset:0;z-index:0;pointer-events:none;
  background-image:linear-gradient(rgba(0,245,212,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,212,.022) 1px,transparent 1px);
  background-size:48px 48px}
.ambience{position:fixed;inset:0;z-index:0;pointer-events:none;
  background:radial-gradient(ellipse at 50% 0%,rgba(0,245,212,.06) 0%,transparent 60%),
             radial-gradient(ellipse at 0% 100%,rgba(180,74,250,.05) 0%,transparent 50%),
             radial-gradient(ellipse at 100% 0%,rgba(0,170,255,.04) 0%,transparent 50%)}

/* ══════════ LANDING ══════════ */
.landing{position:fixed;inset:0;z-index:2000;display:flex;flex-direction:column;
  align-items:center;justify-content:flex-end;padding-bottom:56px;overflow:hidden;
  background:var(--bg)}
.landing.exiting{animation:ldExit .65s ease forwards}
@keyframes ldExit{to{opacity:0;transform:scale(1.03)}}

.ld-hexbg{position:absolute;inset:0;pointer-events:none;
  background-image:
    radial-gradient(ellipse at 50% -10%,rgba(0,245,212,.09) 0%,transparent 55%),
    radial-gradient(ellipse at -5% 100%,rgba(180,74,250,.07) 0%,transparent 45%),
    radial-gradient(ellipse at 105% 20%,rgba(0,170,255,.05) 0%,transparent 40%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='62' height='54'%3E%3Cpath d='M31 2L60 18L60 36L31 52L2 36L2 18Z' fill='none' stroke='rgba(0,245,212,0.038)' stroke-width='1'/%3E%3C/svg%3E");
  background-size:auto,auto,auto,62px 54px}

.ld-title{position:absolute;top:38px;left:50%;transform:translateX(-50%);
  display:flex;flex-direction:column;align-items:center;gap:6px;
  animation:ldTitleFade .9s ease 4.3s both;white-space:nowrap}
@keyframes ldTitleFade{from{opacity:0;transform:translateX(-50%) translateY(-14px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}

.ld-logo-row{display:flex;align-items:center;gap:14px}
.ld-logo{font-family:var(--fh);font-size:26px;font-weight:900;letter-spacing:5px;
  color:var(--cyan);text-shadow:0 0 28px rgba(0,245,212,.55)}
.ld-logo em{color:#b48afa;font-style:normal}
.ld-tag{font-family:var(--fm);font-size:10px;letter-spacing:3px;color:var(--dim)}
.ld-choose{font-family:var(--fm);font-size:9px;letter-spacing:2.5px;
  color:rgba(0,245,212,.4);animation:ldTitleFade .6s ease 5s both}

/* Magician */
.mag-wrap{position:absolute;bottom:0;left:50%;transform:translateX(-50%);
  z-index:6;animation:magSlideUp .9s cubic-bezier(.34,1.56,.64,1) .25s both}
@keyframes magSlideUp{from{transform:translateX(-50%) translateY(90px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}

.mg-hat{animation:hatTip .7s ease 1.1s both;transform-origin:90px 50px}
@keyframes hatTip{0%,100%{transform:rotate(0)}30%{transform:rotate(-9deg) translateX(-3px)}70%{transform:rotate(6deg) translateX(2px)}}

.mg-arm-l{transform-origin:56px 162px;transition:transform .55s cubic-bezier(.34,1.56,.64,1)}
.mg-arm-r{transform-origin:124px 162px;transition:transform .55s cubic-bezier(.34,1.56,.64,1)}
.mg-arms-raised .mg-arm-l{transform:rotate(55deg)}
.mg-arms-raised .mg-arm-r{transform:rotate(-55deg)}

.mg-catchcard{opacity:0;transform-origin:152px 215px;
  transition:opacity .35s ease,transform .35s cubic-bezier(.34,1.56,.64,1);transform:scale(0) rotate(-20deg)}
.mg-catchcard.show{opacity:1;transform:scale(1) rotate(-5deg)}

.mag-flash{position:absolute;inset:0;pointer-events:none;z-index:5;
  background:radial-gradient(circle at 50% 75%,rgba(0,245,212,.55) 0%,rgba(180,74,250,.3) 35%,transparent 70%);
  opacity:0;animation:magFlash .55s ease 2.55s both}
@keyframes magFlash{0%{opacity:0}25%{opacity:1}100%{opacity:0}}

/* Sparkles from hands */
.spark{position:absolute;border-radius:50%;pointer-events:none;opacity:0;
  animation:sparkOut var(--sd,.8s) ease var(--dl,0s) infinite}
@keyframes sparkOut{0%{opacity:0;transform:translate(0,0) scale(0)}20%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.4)}}

/* ══════════ LANDING CARDS ══════════ */
.cards-row{position:relative;z-index:10;display:flex;gap:16px;align-items:flex-end;
  pointer-events:none}
.cards-row.ready{pointer-events:auto}

.lc{width:188px;height:258px;border-radius:18px;
  background:rgba(4,12,30,.92);backdrop-filter:blur(22px);
  border:1.5px solid;position:relative;overflow:hidden;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:7px;font-family:'Poppins',sans-serif;cursor:pointer;
  opacity:0;transform:translateY(500px) translateX(var(--txs,0px)) rotate(var(--rots,0deg));
  transition:box-shadow .3s,transform .32s cubic-bezier(.34,1.56,.64,1),border-color .3s}
.lc.fly{animation:lcFlyIn 1.05s cubic-bezier(.22,1.1,.38,1) var(--dl,0ms) both}
@keyframes lcFlyIn{
  0%{opacity:0;transform:translateY(500px) translateX(var(--txs)) rotate(var(--rots)) scale(.7)}
  32%{opacity:1;transform:translateY(-72px) translateX(calc(var(--txs)*.07)) rotate(calc(var(--rots)*-.18)) scale(1.06)}
  60%{transform:translateY(22px) translateX(0) rotate(3deg) scale(1)}
  78%{transform:translateY(-10px) rotate(-2deg)}
  90%{transform:translateY(5px) rotate(1deg)}
  100%{opacity:1;transform:translateY(0) translateX(0) rotate(0) scale(1)}
}
.lc.interactive:hover{transform:translateY(-15px) scale(1.06)!important;z-index:25}
.lc.interactive:active{transform:translateY(-8px) scale(1.02)!important}
.lc.jlocked{cursor:not-allowed;filter:saturate(.5) brightness(.65);pointer-events:auto!important}
.lc.jlocked:hover{transform:none!important}

.lc-holo{position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(135deg,transparent 20%,rgba(255,255,255,.055) 50%,transparent 80%);
  animation:lcHolo 5s ease-in-out infinite}
@keyframes lcHolo{0%{transform:translateX(-130%) skewX(-8deg)}100%{transform:translateX(220%) skewX(-8deg)}}

.lc-corner{position:absolute;font-family:'Orbitron',sans-serif;font-size:11px;
  font-weight:700;line-height:1.3;display:flex;flex-direction:column;align-items:center}
.lc-tl{top:10px;left:12px}.lc-br{bottom:10px;right:12px;transform:rotate(180deg)}

.lc-icon{font-size:52px;line-height:1;filter:drop-shadow(0 0 16px currentColor)}
.lc-divider{width:52%;height:1px;background:linear-gradient(90deg,transparent,currentColor,transparent);opacity:.3}
.lc-label{font-size:14.5px;font-weight:700;color:#fff;text-align:center;
  line-height:1.3;padding:0 14px;letter-spacing:.01em}
.lc-sub{font-size:10px;font-weight:300;letter-spacing:1.8px;text-transform:uppercase;
  color:var(--dim);text-align:center}

.cs-stamp-wrap{position:absolute;inset:0;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:10px;background:rgba(255,0,60,.04)}
.cs-stamp{font-family:'Orbitron',sans-serif;font-size:11px;font-weight:900;letter-spacing:3px;
  color:rgba(255,0,60,.85);border:2px solid rgba(255,0,60,.45);
  padding:5px 11px;border-radius:5px;transform:rotate(-14deg);
  background:rgba(255,0,60,.1);text-shadow:0 0 10px rgba(255,0,60,.5);
  box-shadow:0 0 14px rgba(255,0,60,.15)}
.cs-lock{font-size:24px;filter:drop-shadow(0 0 10px rgba(255,0,60,.7));animation:lockPulse 2s ease-in-out infinite}
@keyframes lockPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}

/* ══════════ COMINGSOON MODAL ══════════ */
.cs-modal{position:fixed;inset:0;z-index:8000;background:rgba(0,0,0,.7);
  backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center}
.cs-modal-box{background:#050d1e;border:1px solid rgba(0,245,212,.2);border-radius:14px;
  padding:36px 44px;text-align:center;animation:modalIn .3s cubic-bezier(.34,1.56,.64,1)}
@keyframes modalIn{from{opacity:0;transform:scale(.88) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}

/* ══════════ APP SHELL ══════════ */
.app{position:relative;z-index:100;width:100vw;height:100vh;
  display:grid;grid-template-rows:46px 1fr 170px;grid-template-columns:212px 1fr 238px;
  gap:5px;padding:5px;overflow:hidden}

.topbar{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;
  background:rgba(2,8,20,.97);border:1px solid rgba(0,245,212,.11);border-radius:7px;
  padding:0 16px;backdrop-filter:blur(16px);position:relative}
.topbar::after{content:'';position:absolute;bottom:0;left:10%;right:10%;height:1px;
  background:linear-gradient(90deg,transparent,rgba(0,245,212,.3),transparent)}
.tb-logo{display:flex;align-items:center;gap:10px;font-family:var(--fh);font-size:17px;
  font-weight:900;letter-spacing:4px;color:var(--cyan);text-shadow:0 0 20px rgba(0,245,212,.5)}
.tb-logo em{color:var(--violet);font-style:normal}
.tb-posture{display:flex;align-items:center;gap:8px;background:rgba(0,245,212,.04);
  border:1px solid rgba(0,245,212,.15);border-radius:5px;padding:3px 12px}
.tb-posture-lbl{font-family:var(--fm);font-size:9px;color:var(--dim);letter-spacing:1px}
.tb-posture-val{font-family:var(--fh);font-size:13px;font-weight:700;color:#fff;transition:all .4s;
  text-shadow:0 0 10px rgba(0,245,212,.4)}
.tb-posture-val.royal{color:var(--gold);text-shadow:0 0 12px rgba(245,196,0,.5)}
.tb-posture-score{font-family:var(--fm);font-size:12px;color:var(--cyan)}
.tb-right{display:flex;align-items:center;gap:14px}
.tb-stat{display:flex;align-items:center;gap:5px;font-family:var(--fm);font-size:10px;color:var(--dim)}
.tb-dot{width:6px;height:6px;border-radius:50%;animation:tdot 2s ease-in-out infinite}
@keyframes tdot{0%,100%{opacity:1}50%{opacity:.4}}
.tb-time{font-family:var(--fm);font-size:11px;color:var(--dim)}
.btn-sim{background:linear-gradient(135deg,rgba(0,245,212,.08),rgba(180,74,250,.08));
  border:1px solid rgba(0,245,212,.35);border-radius:6px;color:var(--cyan);font-size:10px;
  padding:5px 14px;cursor:pointer;font-family:var(--fh);letter-spacing:1.5px;
  transition:all .25s;font-weight:700;box-shadow:0 0 10px rgba(0,245,212,.08)}
.btn-sim:hover{background:linear-gradient(135deg,rgba(0,245,212,.18),rgba(180,74,250,.15));
  box-shadow:0 0 20px rgba(0,245,212,.25);transform:translateY(-1px);border-color:rgba(0,245,212,.6)}

.panel{background:var(--panel);border:1px solid var(--border);border-radius:var(--r);
  backdrop-filter:blur(12px);position:relative;overflow:hidden}
.panel::before{content:'';position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(135deg,rgba(0,245,212,.022) 0%,transparent 50%)}
.ptitle{font-family:var(--fm);font-size:9px;letter-spacing:2px;color:var(--cyan);
  padding:7px 11px 6px;border-bottom:1px solid rgba(0,245,212,.08);text-transform:uppercase}

.left-col{grid-row:2;grid-column:1;display:flex;flex-direction:column;gap:5px;overflow:hidden}
.inc-ov{padding:9px 11px}
.inc-row{display:flex;justify-content:space-between;align-items:center;padding:2.5px 0;border-bottom:1px solid rgba(0,245,212,.05)}
.inc-k{color:var(--dim);font-size:10px;text-transform:uppercase;letter-spacing:1px;font-family:var(--fm)}
.inc-v{font-family:var(--fm);font-size:11px;color:#fff}
.crit{color:var(--pink);text-shadow:0 0 8px rgba(255,34,119,.5)}
.pill{display:inline-block;padding:1px 6px;border-radius:3px;font-size:8px;font-family:var(--fm);letter-spacing:.5px;border:1px solid}
.pills-row{display:flex;flex-wrap:wrap;gap:3px;padding:5px 0}
.threat-item{display:flex;align-items:center;gap:6px;padding:3.5px 0;border-bottom:1px solid rgba(0,245,212,.04)}
.threat-lvl{font-size:8px;font-family:var(--fm);text-transform:uppercase;margin-left:auto}

.hub{grid-row:2;grid-column:2;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden}
.hub-ring-outer{position:absolute;inset:10px;border-radius:50%;border:1px solid rgba(255,34,119,.18);animation:hspin 18s linear infinite}
.hub-ring-mid{position:absolute;inset:30px;border-radius:50%;border:1px dashed rgba(0,245,212,.15);animation:hspin 10s linear infinite reverse}
.hub-ring-inner{position:absolute;inset:52px;border-radius:50%;border:1px solid rgba(180,74,250,.1);animation:hspin 25s linear infinite}
@keyframes hspin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
.hub-glow{position:absolute;inset:40px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,34,119,.1) 0%,rgba(255,34,119,.03) 50%,transparent 70%);
  animation:hbreathe 4s ease-in-out infinite}
@keyframes hbreathe{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}

.suit-slot{position:absolute;display:flex;flex-direction:column;align-items:center;gap:5px}
.suit-slot.top{top:12px;left:50%;transform:translateX(-50%)}
.suit-slot.left{left:12px;top:50%;transform:translateY(-50%)}
.suit-slot.right{right:12px;top:50%;transform:translateY(-50%)}
.suit-slot.bottom{bottom:12px;left:50%;transform:translateX(-50%)}
.suit-slot-label{font-family:var(--fh);font-size:8px;letter-spacing:2px;color:var(--dim);text-transform:uppercase;transition:color .3s}

.suit-card{width:92px;height:128px;border-radius:10px;position:relative;border:1.5px solid;
  cursor:pointer;overflow:hidden;transition:box-shadow .3s,filter .3s,transform .35s cubic-bezier(.34,1.56,.64,1),border-color .3s;
  background:rgba(3,7,18,.88);backdrop-filter:blur(16px)}
.suit-card:hover{transform:translateY(-10px) scale(1.07);z-index:20}
.suit-card.active{transform:translateY(-12px) scale(1.1)!important;z-index:30}
.suit-card.dimmed{filter:brightness(.35) saturate(.4)}
.suit-card.flipping{animation:cardflip .45s ease-in-out}
@keyframes cardflip{0%{transform:scale(1.06) rotateY(0)}40%{transform:scale(1.06) rotateY(90deg)}60%{transform:scale(1.06) rotateY(-90deg)}100%{transform:scale(1.06) rotateY(0)}}
.card-holo{position:absolute;inset:0;pointer-events:none;z-index:1;
  background:linear-gradient(135deg,transparent 25%,rgba(255,255,255,.05) 50%,transparent 75%);animation:holo 5s ease-in-out infinite}
@keyframes holo{0%{transform:translateX(-120%) skewX(-8deg)}100%{transform:translateX(120%) skewX(-8deg)}}
.card-corner{position:absolute;display:flex;flex-direction:column;align-items:center;font-family:var(--fh);font-weight:900;line-height:1.1;font-size:10px}
.card-corner.tl{top:5px;left:7px}.card-corner.br{bottom:5px;right:7px;transform:rotate(180deg)}
.card-corner-sym{font-size:9px;line-height:1.1}
.card-inner{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px}
.card-rank{font-family:var(--fh);font-size:32px;font-weight:900;line-height:1;text-shadow:0 0 14px currentColor;z-index:2;position:relative}
.card-sym-center{font-size:24px;line-height:1;z-index:2;position:relative;filter:drop-shadow(0 0 5px currentColor)}
.card-name{font-family:var(--fh);font-size:5.5px;letter-spacing:1.5px;z-index:2;position:relative;margin-top:4px;opacity:.75;text-align:center}

.joker-card{position:relative;width:114px;height:158px;border-radius:11px;
  background:linear-gradient(145deg,#0c0008 0%,#200016 45%,#0c0008 100%);
  border:2px solid rgba(255,34,119,.65);
  box-shadow:0 0 30px rgba(255,34,119,.3),0 0 60px rgba(255,34,119,.1),inset 0 0 30px rgba(255,34,119,.05);
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  cursor:pointer;z-index:15;overflow:hidden;transition:transform .25s,box-shadow .25s}
.joker-card:hover{transform:scale(1.07) translateY(-5px);box-shadow:0 0 50px rgba(255,34,119,.5),0 16px 50px rgba(0,0,0,.5)}
.joker-card.glitch{animation:glitch .55s infinite}
@keyframes glitch{0%{transform:translate(0);filter:none}15%{transform:translate(-2px,1px);filter:hue-rotate(20deg)}30%{transform:translate(2px,-1px);filter:brightness(1.3)}45%{transform:translate(-1px,2px);filter:saturate(1.5)}100%{transform:translate(0);filter:none}}
.jc-holo{position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(135deg,transparent 20%,rgba(255,34,119,.08) 40%,transparent 60%,rgba(180,74,250,.06) 80%,transparent);animation:holo 4s ease-in-out infinite}
.jc-sym{font-size:42px;filter:drop-shadow(0 0 14px rgba(255,34,119,.9));z-index:2;line-height:1}
.jc-label{font-family:var(--fh);font-size:9px;letter-spacing:2.5px;color:#ff2277;z-index:2;margin-top:4px}
.jc-pct{font-family:var(--fh);font-size:18px;font-weight:900;color:#fff;text-shadow:0 0 12px rgba(255,34,119,.8);z-index:2;line-height:1;margin-top:2px}
.jc-sub{font-family:var(--fm);font-size:7px;letter-spacing:1px;color:rgba(255,34,119,.6);z-index:2;margin-top:1px}
.tp-label{font-family:var(--fm);font-size:9px;letter-spacing:2px;color:var(--dim);text-transform:uppercase;text-align:center;margin-top:5px}

.right-col{grid-row:2;grid-column:3;display:flex;flex-direction:column;gap:5px;overflow:hidden}
.ja-panel{padding:9px 11px;flex-shrink:0}
.ja-row{display:flex;gap:9px;align-items:flex-start;margin-bottom:8px}
.ja-thumb{width:40px;height:54px;border-radius:6px;flex-shrink:0;background:linear-gradient(135deg,#0c0008,#200016);border:1px solid rgba(255,34,119,.5);display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 0 12px rgba(255,34,119,.2)}
.ja-info{flex:1}
.ja-name{font-family:var(--fh);font-size:10px;font-weight:700;color:#fff;margin-bottom:5px}
.pbar-wrap{margin-bottom:5px}
.pbar-lbl{display:flex;justify-content:space-between;font-size:8px;color:var(--dim);margin-bottom:2px;font-family:var(--fm)}
.ptrack{height:4px;background:rgba(255,255,255,.1);border-radius:2px;overflow:hidden}
.pfill{height:100%;border-radius:2px;transition:width .8s cubic-bezier(.4,0,.2,1)}
.spread{font-size:9px;color:var(--dim);font-family:var(--fm)}
.spread span{color:var(--pink);font-weight:700}
.btn-ir{width:100%;padding:9px;background:linear-gradient(135deg,rgba(255,34,119,.18),rgba(255,34,119,.08));border:1px solid rgba(255,34,119,.5);border-radius:6px;color:var(--pink);font-family:var(--fh);font-size:10px;letter-spacing:2px;cursor:pointer;transition:all .2s;text-shadow:0 0 8px rgba(255,34,119,.5);box-shadow:0 0 15px rgba(255,34,119,.1);margin-top:7px}
.btn-ir:hover{background:linear-gradient(135deg,rgba(255,34,119,.3),rgba(255,34,119,.15));box-shadow:0 0 28px rgba(255,34,119,.3);transform:translateY(-1px)}
.rh-panel{padding:7px 11px;flex-shrink:0}
.mini-cards{display:flex;gap:4px;justify-content:center;margin:7px 0}
.mini-card{width:34px;height:48px;border-radius:5px;border:1px solid;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:all .22s;font-size:9px;background:rgba(3,7,18,.85);overflow:hidden;position:relative}
.mini-card:hover{transform:translateY(-4px) scale(1.08)}
.mini-r{font-family:var(--fh);font-size:10px;font-weight:700}
.mini-s{font-size:15px}
.btn-apply{width:100%;padding:7px;background:rgba(0,245,212,.08);border:1px solid rgba(0,245,212,.28);border-radius:4px;color:var(--cyan);font-family:var(--fh);font-size:8px;letter-spacing:1.5px;cursor:pointer;transition:all .2s}
.btn-apply:hover{background:rgba(0,245,212,.18);box-shadow:0 0 14px rgba(0,245,212,.2)}
.comms-panel{flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0}
.comms-msgs{flex:1;overflow-y:auto;padding:5px 10px;display:flex;flex-direction:column;gap:5px;min-height:0}
.cmsg{background:rgba(0,245,212,.03);border:1px solid rgba(0,245,212,.07);border-radius:4px;padding:5px 7px}
.cmsg-h{display:flex;justify-content:space-between;margin-bottom:1px}
.cmsg-role{font-family:var(--fm);font-size:9px;letter-spacing:.5px}
.cmsg-t{font-size:9px;color:var(--dim)}
.cmsg-txt{font-size:10px;color:var(--text);line-height:1.4}
.comms-in{display:flex;gap:4px;padding:5px 8px;border-top:1px solid rgba(0,245,212,.09)}
.ci-inp{flex:1;background:rgba(0,245,212,.05);border:1px solid rgba(0,245,212,.14);border-radius:3px;color:var(--text);font-family:var(--fm);font-size:10px;padding:4px 7px;outline:none}
.ci-inp:focus{border-color:rgba(0,245,212,.35)}
.ci-btn{background:rgba(0,245,212,.1);border:1px solid rgba(0,245,212,.28);border-radius:3px;color:var(--cyan);font-size:11px;padding:4px 8px;cursor:pointer}
.bottom-row{grid-column:1/-1;display:grid;grid-template-columns:1fr 210px 175px;gap:5px}
.chart-panel{padding:8px 11px}
.chart-legend{display:flex;gap:11px;margin-top:4px}
.cl-item{display:flex;align-items:center;gap:4px;font-size:9px;font-family:var(--fm)}
.cl-dot{width:6px;height:6px;border-radius:50%}
.queue-item{display:flex;align-items:center;gap:8px;padding:4.5px 0;border-bottom:1px solid rgba(0,245,212,.05);cursor:pointer;transition:background .15s}
.queue-item:hover{background:rgba(0,245,212,.03)}
.qi-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.qi-name{font-size:11px;flex:1}.qi-time{font-size:9px;color:var(--dim);font-family:var(--fm)}
.eng-item{margin-bottom:7px}
.eng-h{display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px}

.modal-ov{position:fixed;inset:0;z-index:4000;background:rgba(0,0,0,.7);backdrop-filter:blur(7px);display:flex;align-items:center;justify-content:center}
.modal-card-box{width:520px;max-height:86vh;overflow-y:auto;background:#050a12;border-radius:16px;padding:28px;box-shadow:0 30px 80px rgba(0,0,0,.85);animation:mslide .28s cubic-bezier(.4,0,.2,1)}
@keyframes mslide{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}

.ir-screen{position:fixed;inset:0;z-index:5000;background:#020608;display:flex;flex-direction:column;font-family:var(--fm)}
.ir-scanline{position:absolute;inset:0;pointer-events:none;background-image:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,255,136,.01) 3px,rgba(0,255,136,.01) 4px)}
@keyframes termFade{from{opacity:0;transform:translateX(-3px)}to{opacity:1;transform:none}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}

.sd-overlay{position:fixed;inset:0;z-index:3500;background:rgba(0,0,0,.6);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center}
.sd-panel{width:740px;max-height:88vh;background:rgba(3,10,22,.99);border-radius:13px;display:flex;flex-direction:column;overflow:hidden;position:relative}
.sd-header{display:flex;align-items:flex-start;justify-content:space-between;padding:20px 24px 14px;border-bottom:1px solid rgba(255,255,255,.05)}
.sd-title-group{display:flex;align-items:center;gap:14px}
.sd-sym{font-size:52px;filter:drop-shadow(0 0 18px currentColor);animation:jfloat 4s ease-in-out infinite;line-height:1}
@keyframes jfloat{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-12px) rotate(1deg)}}
.sd-name{font-family:var(--fh);font-size:24px;font-weight:900;letter-spacing:2px;line-height:1}
.sd-sub{font-size:11px;color:var(--dim);font-family:var(--fm);margin-top:3px}
.sd-rank-group{display:flex;flex-direction:column;align-items:flex-end;gap:4px}
.sd-rank-big{font-family:var(--fh);font-size:56px;font-weight:900;line-height:1;filter:drop-shadow(0 0 20px currentColor)}
.sd-rank-lbl{font-family:var(--fm);font-size:9px;color:var(--dim);letter-spacing:1px}
.rank-progress{display:flex;align-items:center;gap:8px;margin-top:4px}
.rank-prog-track{width:100px;height:4px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden}
.sd-body{flex:1;overflow-y:auto;padding:16px 24px;display:flex;flex-direction:column;gap:14px}
.sd-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.sm-card{background:rgba(4,14,28,.9);border:1px solid rgba(255,255,255,.05);border-radius:7px;padding:12px}
.sm-lbl{font-family:var(--fm);font-size:8px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:5px}
.sm-val{font-family:var(--fh);font-size:18px;font-weight:700;color:#fff}
.sm-trend{font-family:var(--fm);font-size:8px;margin-top:4px}
.sd-cols{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
.sd-block{background:rgba(4,14,28,.9);border:1px solid rgba(255,255,255,.05);border-radius:8px;padding:13px}
.sd-block-t{font-family:var(--fm);font-size:8px;letter-spacing:2px;color:var(--dim);text-transform:uppercase;margin-bottom:10px;padding-bottom:5px;border-bottom:1px solid rgba(255,255,255,.04)}
.cap-item{display:flex;align-items:center;gap:7px;padding:4.5px 0;border-bottom:1px solid rgba(255,255,255,.03);font-size:11px}
.cap-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.risk-row{display:flex;align-items:center;gap:7px;padding:6px 7px;border-radius:5px;margin-bottom:3px;font-size:10px}
.risk-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.upg-step{display:flex;gap:8px;align-items:flex-start;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.03)}
.upg-n{width:19px;height:19px;border-radius:3px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:var(--fm);font-size:8px;font-weight:700}
.upg-t{font-size:10px;color:var(--text);line-height:1.4;padding-top:2px}
.ai-block{background:linear-gradient(135deg,rgba(0,245,212,.03),rgba(4,14,28,.97));border:1px solid rgba(0,245,212,.12);border-radius:8px;padding:13px}
.ai-block-h{display:flex;align-items:center;gap:7px;margin-bottom:10px}
.ai-live{display:flex;align-items:center;gap:4px;background:rgba(0,245,212,.1);border:1px solid rgba(0,245,212,.28);border-radius:3px;padding:2px 7px;font-family:var(--fm);font-size:8px;color:var(--cyan)}
.ai-ldot{width:5px;height:5px;border-radius:50%;background:var(--cyan);animation:tdot 1s ease-in-out infinite}
.ai-t{font-family:var(--fh);font-size:10px;font-weight:700;color:#fff;letter-spacing:.5px}
.ai-item{display:flex;align-items:flex-start;gap:7px;padding:7px;border-radius:5px;margin-bottom:4px;background:rgba(0,245,212,.025);border:1px solid rgba(0,245,212,.06);font-size:11px;color:var(--text);cursor:pointer;transition:all .2s}
.ai-item:hover{background:rgba(0,245,212,.07);border-color:rgba(0,245,212,.18)}
.ai-arr{color:var(--cyan);flex-shrink:0;font-family:var(--fm);font-size:10px;padding-top:1px}
.sd-close{position:absolute;top:14px;right:16px;background:transparent;border:1px solid rgba(255,255,255,.1);border-radius:4px;color:var(--dim);width:26px;height:26px;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;transition:all .15s}
.sd-close:hover{border-color:rgba(0,245,212,.4);color:var(--cyan)}

.fade-in{animation:fadein .35s ease forwards}
@keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.slide-in{animation:slidein .3s cubic-bezier(.4,0,.2,1) forwards}
@keyframes slidein{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}
.posture-upgrade{animation:postup .6s ease forwards}
@keyframes postup{0%{transform:scale(1)}30%{transform:scale(1.12);filter:brightness(1.5)}100%{transform:scale(1);filter:brightness(1)}}
`;

// ═══════════════════════════════════════════════════════
// ICON COMPONENT
// ═══════════════════════════════════════════════════════
function CSIcon({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 112" fill="none">
      <defs>
        <filter id="cs-glow"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <path d="M50 4L92 21L92 62Q92 89 50 109Q8 89 8 62L8 21Z" fill="rgba(0,245,212,0.05)" stroke="#00f5d4" strokeWidth="2.2" filter="url(#cs-glow)"/>
      <path d="M50 13L83 27L83 62Q83 83 50 99Q17 83 17 62L17 27Z" fill="rgba(0,245,212,0.02)" stroke="rgba(0,245,212,0.2)" strokeWidth="1"/>
      <line x1="2" y1="59" x2="98" y2="59" stroke="#ff2277" strokeWidth="1.8" opacity="0.75" filter="url(#cs-glow)"/>
      <rect x="25" y="25" width="20" height="28" rx="3" fill="#040e22" stroke="rgba(0,245,212,0.55)" strokeWidth="1.2" transform="rotate(-12,35,39)"/>
      <rect x="36" y="22" width="20" height="28" rx="3" fill="#0a0520" stroke="rgba(180,74,250,0.55)" strokeWidth="1.2"/>
      <rect x="47" y="25" width="20" height="28" rx="3" fill="#040e22" stroke="rgba(0,170,255,0.5)" strokeWidth="1.2" transform="rotate(12,57,39)"/>
      <circle cx="50" cy="79" r="11" fill="rgba(255,34,119,0.1)" stroke="rgba(255,34,119,0.5)" strokeWidth="1.2"/>
      <circle cx="46" cy="77" r="2.5" fill="#ff2277" opacity="0.9"/>
      <circle cx="54" cy="77" r="2.5" fill="#ff2277" opacity="0.9"/>
      <path d="M44 83Q50 85 56 83" stroke="#ff2277" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.7"/>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════
// MAGICIAN SVG
// ═══════════════════════════════════════════════════════
function MagicianSVG({ armPhase, cardVisible }) {
  const raised = armPhase === "throwing";
  return (
    <svg viewBox="0 0 180 300" width={180} height={300} style={{overflow:"visible",display:"block"}}>
      <defs>
        <filter id="mg-glow-teal"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="mg-glow-viol"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <linearGradient id="coatGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#060e22"/><stop offset="100%" stopColor="#040a18"/></linearGradient>
        <radialGradient id="eyeGlow"><stop offset="0%" stopColor="#00f5d4"/><stop offset="100%" stopColor="rgba(0,245,212,0)"/></radialGradient>
      </defs>

      {/* ── TOP HAT ── */}
      <g className="mg-hat">
        {/* Crown shadow */}
        <rect x="55" y="10" width="70" height="62" rx="5" fill="#020810" opacity=".6" transform="translate(3,3)"/>
        {/* Crown */}
        <rect x="55" y="10" width="70" height="62" rx="5" fill="#060e22" stroke="#00f5d4" strokeWidth="1.8" filter="url(#mg-glow-teal)"/>
        {/* Hat texture lines */}
        <line x1="55" y1="32" x2="125" y2="32" stroke="rgba(0,245,212,0.08)" strokeWidth="1"/>
        <line x1="55" y1="50" x2="125" y2="50" stroke="rgba(0,245,212,0.08)" strokeWidth="1"/>
        {/* Violet band */}
        <rect x="55" y="63" width="70" height="11" fill="#2a0866" stroke="#b48afa" strokeWidth="1" filter="url(#mg-glow-viol)"/>
        {/* Band star detail */}
        <text x="90" y="72" textAnchor="middle" fill="#b48afa" fontSize="8" fontFamily="Orbitron" opacity=".8">★ ★ ★</text>
        {/* Brim */}
        <rect x="34" y="73" width="112" height="14" rx="7" fill="#060e22" stroke="#00f5d4" strokeWidth="1.5" filter="url(#mg-glow-teal)"/>
        {/* Brim highlight */}
        <rect x="40" y="74" width="100" height="3" rx="1.5" fill="rgba(0,245,212,0.12)"/>
      </g>

      {/* ── HEAD ── */}
      <circle cx="90" cy="116" r="26" fill="url(#coatGrad)" stroke="rgba(0,245,212,0.2)" strokeWidth="1.5"/>
      {/* Glowing eyes */}
      <ellipse cx="82" cy="112" rx="4" ry="3.5" fill="#00f5d4" opacity=".9" filter="url(#mg-glow-teal)"/>
      <ellipse cx="98" cy="112" rx="4" ry="3.5" fill="#00f5d4" opacity=".9" filter="url(#mg-glow-teal)"/>
      {/* Monocle on right eye */}
      <circle cx="98" cy="112" r="7" fill="none" stroke="rgba(245,196,0,0.55)" strokeWidth="1.2"/>
      <line x1="105" y1="118" x2="109" y2="124" stroke="rgba(245,196,0,0.45)" strokeWidth="1.1"/>
      {/* Smile */}
      <path d="M83,122 Q90,127 97,122" stroke="rgba(0,245,212,0.4)" strokeWidth="1.2" strokeLinecap="round" fill="none"/>

      {/* ── BODY / COAT ── */}
      <path d="M64,142 Q90,134 116,142 L132,238 Q90,250 48,238 Z" fill="url(#coatGrad)" stroke="rgba(0,245,212,0.15)" strokeWidth="1.2"/>
      {/* Lapels */}
      <path d="M90,144 L78,166 L90,178 L102,166 Z" fill="rgba(0,245,212,0.06)" stroke="rgba(0,245,212,0.2)" strokeWidth="1"/>
      {/* Bow tie */}
      <path d="M82,142 L88,148 L82,154 Z" fill="rgba(255,34,119,0.6)"/>
      <path d="M98,142 L92,148 L98,154 Z" fill="rgba(255,34,119,0.6)"/>
      <circle cx="90" cy="148" r="2.5" fill="#ff2277" filter="url(#mg-glow-teal)"/>
      {/* Buttons */}
      {[182,200,218].map((y,i)=><circle key={i} cx="90" cy={y} r="2" fill="rgba(0,245,212,0.3)" stroke="rgba(0,245,212,0.5)" strokeWidth=".8"/>)}
      {/* Pocket square */}
      <path d="M108,188 L118,188 L118,180 L110,180 Z" fill="rgba(180,74,250,0.5)" stroke="rgba(180,74,250,0.7)" strokeWidth=".8"/>
      {/* Coat tails */}
      <path d="M54,238 L44,295 L68,293 L84,252" fill="url(#coatGrad)" stroke="rgba(0,245,212,0.12)" strokeWidth="1.2"/>
      <path d="M126,238 L136,295 L112,293 L96,252" fill="url(#coatGrad)" stroke="rgba(0,245,212,0.12)" strokeWidth="1.2"/>

      {/* ── LEFT ARM ── */}
      <g className="mg-arm-l" style={{transformOrigin:"64px 158px",transform:raised?"rotate(52deg)":"rotate(0deg)",transition:"transform .55s cubic-bezier(.34,1.56,.64,1)"}}>
        {/* Coat sleeve */}
        <path d="M64,158 Q36,184 12,214" stroke="#060e22" strokeWidth="17" strokeLinecap="round" fill="none"/>
        <path d="M64,158 Q36,184 12,214" stroke="rgba(0,245,212,0.14)" strokeWidth="17" strokeLinecap="round" fill="none"/>
        {/* Cuff */}
        <ellipse cx="12" cy="215" rx="10" ry="8" fill="#060e22" stroke="rgba(0,245,212,0.3)" strokeWidth="1.2"/>
        {/* Wand in left hand */}
        <line x1="12" y1="215" x2="-14" y2="240" stroke="#0a1628" strokeWidth="4" strokeLinecap="round"/>
        <line x1="12" y1="215" x2="-14" y2="240" stroke="rgba(0,245,212,0.5)" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="-15" cy="241" r="4" fill="#00f5d4" filter="url(#mg-glow-teal)" opacity=".9"/>
      </g>

      {/* ── RIGHT ARM ── */}
      <g className="mg-arm-r" style={{transformOrigin:"116px 158px",transform:raised?"rotate(-52deg)":"rotate(0deg)",transition:"transform .55s cubic-bezier(.34,1.56,.64,1)"}}>
        {/* Coat sleeve */}
        <path d="M116,158 Q144,184 168,214" stroke="#060e22" strokeWidth="17" strokeLinecap="round" fill="none"/>
        <path d="M116,158 Q144,184 168,214" stroke="rgba(180,74,250,0.14)" strokeWidth="17" strokeLinecap="round" fill="none"/>
        {/* Cuff */}
        <ellipse cx="168" cy="215" rx="10" ry="8" fill="#060e22" stroke="rgba(180,74,250,0.35)" strokeWidth="1.2"/>
        {/* Magic card in right hand */}
        <g className="mg-catchcard" style={{opacity:cardVisible?1:0,transform:cardVisible?"scale(1) rotate(-5deg)":"scale(0) rotate(-20deg)",transformOrigin:"164px 210px",transition:"opacity .4s,transform .4s cubic-bezier(.34,1.56,.64,1)"}}>
          <rect x="156" y="196" width="22" height="30" rx="3.5" fill="#050d28" stroke="#00f5d4" strokeWidth="1.5" filter="url(#mg-glow-teal)"/>
          <text x="167" y="207" textAnchor="middle" fill="#00f5d4" fontSize="7" fontFamily="Orbitron" fontWeight="700">A</text>
          <text x="167" y="217" textAnchor="middle" fill="#00f5d4" fontSize="10">♠</text>
          <text x="167" y="224" textAnchor="middle" fill="rgba(0,245,212,0.5)" fontSize="7" fontFamily="Orbitron">A</text>
        </g>
      </g>

      {/* ── LEGS ── */}
      <path d="M74,248 L68,297" stroke="#050b1c" strokeWidth="15" strokeLinecap="round"/>
      <path d="M74,248 L68,297" stroke="rgba(0,245,212,0.08)" strokeWidth="15" strokeLinecap="round"/>
      <path d="M106,248 L112,297" stroke="#050b1c" strokeWidth="15" strokeLinecap="round"/>
      <path d="M106,248 L112,297" stroke="rgba(0,245,212,0.08)" strokeWidth="15" strokeLinecap="round"/>
      {/* Shoes */}
      <ellipse cx="63" cy="299" rx="16" ry="6" fill="#040a18" stroke="rgba(0,245,212,0.18)" strokeWidth="1"/>
      <ellipse cx="117" cy="299" rx="16" ry="6" fill="#040a18" stroke="rgba(0,245,212,0.18)" strokeWidth="1"/>

      {/* ── SPARKLES when throwing ── */}
      {raised && (
        <>
          {[...Array(6)].map((_,i)=>{
            const angle = (i/6)*360;const dx = Math.cos(angle*Math.PI/180)*35;const dy = Math.sin(angle*Math.PI/180)*35;
            return <circle key={i} cx={90} cy={100} r={2} fill="#00f5d4" opacity="0" style={{animation:`sparkOut .9s ease ${i*120}ms infinite`,"--dx":`${dx}px`,"--dy":`${dy}px`}}/>;
          })}
        </>
      )}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════
// LANDING CARD
// ═══════════════════════════════════════════════════════
const LANDING_CARDS = [
  { label:"Simulate as Guest", sub:"No account needed",  icon:"♠", rank:"A", color:"#00aaff", txs:"270px", rots:"-36deg", delay:"2800ms", action:"guest" },
  { label:"Create an Account", sub:"Join CounterStack",  icon:"♦", rank:"K", color:"#b48afa", txs:"88px",  rots:"-13deg", delay:"3100ms", action:"signup" },
  { label:"Login",             sub:"Welcome back",       icon:"♣", rank:"Q", color:"#00f5d4", txs:"-88px", rots:"13deg",  delay:"3400ms", action:"login"  },
  { label:"COMING SOON",       sub:"The Joker Awaits",   icon:"🃏", rank:"J", color:"#ff2277", txs:"-270px",rots:"36deg",  delay:"3700ms", action:null, isJoker:true },
];

function LandingCard({ cfg, flying, onSelect }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      className={`lc ${flying?"fly":""} ${cfg.isJoker?"jlocked":""} ${!cfg.isJoker&&flying?"interactive":""}`}
      style={{
        "--txs":cfg.txs,"--rots":cfg.rots,"--dl":cfg.delay,
        borderColor:`${cfg.color}${hov&&!cfg.isJoker?"cc":"44"}`,
        boxShadow: hov && !cfg.isJoker
          ? `0 0 28px ${cfg.color}44,0 16px 50px rgba(0,0,0,.6),inset 0 0 20px ${cfg.color}08`
          : `0 0 10px ${cfg.color}22`,
      }}
      onClick={()=>{if(!cfg.isJoker&&flying)onSelect(cfg.action);}}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
    >
      <div className="lc-holo"/>
      {/* Corner marks */}
      <div className="lc-corner lc-tl" style={{color:cfg.color}}>
        <span>{cfg.rank}</span>
        <span style={{fontSize:9}}>{cfg.icon}</span>
      </div>
      <div className="lc-corner lc-br" style={{color:cfg.color}}>
        <span>{cfg.rank}</span>
        <span style={{fontSize:9}}>{cfg.icon}</span>
      </div>

      {/* Card content */}
      {cfg.isJoker ? (
        <div className="cs-stamp-wrap">
          <span className="lc-icon" style={{color:cfg.color}}>{cfg.icon}</span>
          <div className="lc-divider" style={{color:cfg.color}}/>
          <span className="lc-label" style={{color:"rgba(255,255,255,0.6)"}}>Joker Mode</span>
          <span className="lc-sub">{cfg.sub}</span>
          <div className="cs-stamp">COMING SOON</div>
          <span className="cs-lock">🔒</span>
        </div>
      ) : (
        <>
          <span className="lc-icon" style={{color:cfg.color,filter:`drop-shadow(0 0 16px ${cfg.color})`}}>{cfg.icon}</span>
          <div className="lc-divider" style={{color:cfg.color}}/>
          <span className="lc-label">{cfg.label}</span>
          <span className="lc-sub">{cfg.sub}</span>
          {hov && (
            <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:cfg.color,
              padding:"4px 10px",border:`1px solid ${cfg.color}55`,borderRadius:4,
              background:`${cfg.color}11`,animation:"fadein .2s ease",marginTop:4}}>
              ENTER →
            </div>
          )}
        </>
      )}
      {/* Hover radial glow */}
      {hov && !cfg.isJoker && (
        <div style={{position:"absolute",inset:0,borderRadius:17,background:`radial-gradient(circle at 50% 60%,${cfg.color}18 0%,transparent 65%)`,pointerEvents:"none"}}/>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// LANDING SCREEN
// ═══════════════════════════════════════════════════════
function LandingScreen({ onDone }) {
  const [magPhase, setMagPhase] = useState("entering");
  const [cardVis,  setCardVis]  = useState(false);
  const [flying,   setFlying]   = useState(false);
  const [ready,    setReady]    = useState(false);
  const [exiting,  setExiting]  = useState(false);
  const [modal,    setModal]    = useState(null);

  useEffect(()=>{
    const t1 = setTimeout(()=>setMagPhase("catching"),   1400);
    const t2 = setTimeout(()=>setCardVis(true),           1800);
    const t3 = setTimeout(()=>setMagPhase("throwing"),    2300);
    const t4 = setTimeout(()=>setFlying(true),            2650);
    const t5 = setTimeout(()=>setReady(true),             4800);
    return ()=>[t1,t2,t3,t4,t5].forEach(clearTimeout);
  },[]);

  const handleSelect = (action) => {
    if(action === "guest") {
      setExiting(true);
      setTimeout(()=>onDone(), 650);
    } else {
      setModal(action);
    }
  };

  return (
    <div className={`landing ${exiting?"exiting":""}`} style={{position:"fixed",inset:0,zIndex:2000}}>
      <div className="ld-hexbg"/>

      {/* Title */}
      <div className="ld-title" style={{zIndex:20}}>
        <div className="ld-logo-row">
          <CSIcon size={38}/>
          <div className="ld-logo">COUNTER<em>STACK</em></div>
        </div>
        <div className="ld-tag">AI-POWERED CYBERSECURITY POSTURE ENGINE</div>
        <div className="ld-choose">SELECT YOUR PATH TO ENTER</div>
      </div>

      {/* Magic flash */}
      <div className="mag-flash"/>

      {/* Magician */}
      <div className={`mag-wrap ${magPhase==="throwing"?"mg-arms-raised":""}`} style={{zIndex:6}}>
        <MagicianSVG armPhase={magPhase} cardVisible={cardVis}/>
      </div>

      {/* Cards row */}
      <div className={`cards-row ${ready?"ready":""}`} style={{position:"relative",zIndex:10,display:"flex",gap:16,alignItems:"flex-end",pointerEvents:ready?"auto":"none"}}>
        {LANDING_CARDS.map((cfg,i)=>(
          <LandingCard key={i} cfg={cfg} flying={flying} onSelect={handleSelect}/>
        ))}
      </div>

      {/* Coming soon modal */}
      {modal && (
        <div className="cs-modal" onClick={()=>setModal(null)}>
          <div className="cs-modal-box" onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:40,marginBottom:14}}>🔒</div>
            <div style={{fontFamily:"var(--fh)",fontSize:16,color:"var(--cyan)",letterSpacing:2,marginBottom:8}}>
              {modal==="signup"?"CREATE ACCOUNT":"LOGIN"}
            </div>
            <div style={{fontFamily:"var(--fm)",fontSize:12,color:"var(--dim)",letterSpacing:1.5,marginBottom:20}}>
              FEATURE COMING SOON
            </div>
            <p style={{fontSize:13,color:"rgba(200,214,232,0.6)",lineHeight:1.8,marginBottom:22,maxWidth:320,margin:"0 auto 22px"}}>
              Full account management is under development. Use <strong style={{color:"var(--cyan)"}}>Simulate as Guest</strong> to explore the platform now.
            </p>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={()=>{setModal(null);handleSelect("guest");}}
                style={{padding:"10px 24px",background:"rgba(0,245,212,.1)",border:"1px solid rgba(0,245,212,.4)",borderRadius:7,color:"var(--cyan)",fontFamily:"var(--fh)",fontSize:10,letterSpacing:1.5,cursor:"pointer"}}>
                SIMULATE AS GUEST
              </button>
              <button onClick={()=>setModal(null)}
                style={{padding:"10px 20px",background:"transparent",border:"1px solid rgba(255,255,255,.12)",borderRadius:7,color:"var(--dim)",fontFamily:"var(--fm)",fontSize:10,cursor:"pointer"}}>
                BACK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// UTILITY COMPONENTS
// ═══════════════════════════════════════════════════════
function SvgRing({ pct, color, size=100, sw=8 }) {
  const r=(size-sw)/2,circ=2*Math.PI*r,off=circ-(pct/100)*circ;
  return (
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={sw}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        style={{transition:"stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)",filter:`drop-shadow(0 0 5px ${color})`}}/>
    </svg>
  );
}
function MiniBar({ value, color, label }) {
  return (
    <div style={{marginBottom:11}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
        <span style={{fontSize:10,color:"rgba(255,255,255,.4)",fontFamily:"'Courier New',monospace"}}>{label}</span>
        <span style={{fontSize:10,color,fontFamily:"'Courier New',monospace",fontWeight:700}}>{value}%</span>
      </div>
      <div style={{height:4,background:"rgba(255,255,255,.07)",borderRadius:2,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${value}%`,background:`linear-gradient(90deg,${color}cc,${color})`,borderRadius:2,boxShadow:`0 0 8px ${color}88`,transition:"width 1.2s ease"}}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// POSTURE CHART
// ═══════════════════════════════════════════════════════
function PostureChart({ ranks }) {
  const W=500,H=90,pad=8;
  const series=Object.entries(SUITS).map(([k,cfg])=>({color:cfg.color,pts:[...HISTORY[k].slice(0,11),ranks[k]]}));
  const toD=pts=>pts.map((v,i)=>{
    const x=pad+(i/(pts.length-1))*(W-2*pad);const y=pad+((13-v)/12)*(H-2*pad);
    return `${i===0?"M":"L"}${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:H-10}} preserveAspectRatio="none">
      {[.25,.5,.75].map(p=><line key={p} x1={pad} y1={p*H} x2={W-pad} y2={p*H} stroke="rgba(0,245,212,.05)" strokeWidth="1"/>)}
      {series.map(({color,pts})=><path key={color} d={toD(pts)} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" style={{filter:`drop-shadow(0 0 3px ${color})`}}/>)}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════
// SUIT CARD
// ═══════════════════════════════════════════════════════
function SuitCard({ suitKey, cfg, rank, active, dimmed, onClick, flipping }) {
  const [hov,setHov]=useState(false);
  const color=cfg.color,rn=RANK_NAMES[rank];
  return (
    <div
      className={`suit-card ${active?"active":""} ${dimmed?"dimmed":""} ${flipping?"flipping":""}`}
      style={{
        borderColor:`${color}${active||hov?"cc":"44"}`,
        background:`linear-gradient(145deg,${cfg.dark}ee 0%,rgba(4,12,26,.92) 100%)`,
        boxShadow:active?`0 0 32px ${color}55,0 0 64px ${color}22,inset 0 0 24px ${color}08`:hov?`0 0 20px ${color}44,0 8px 30px rgba(0,0,0,.5)`:undefined,
        color,
      }}
      onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
    >
      <div className="card-holo"/>
      <div className="card-corner tl" style={{color}}><span>{rn}</span><span className="card-corner-sym">{cfg.sym}</span></div>
      <div className="card-corner br" style={{color}}><span>{rn}</span><span className="card-corner-sym">{cfg.sym}</span></div>
      <div className="card-inner">
        <div className="card-rank" style={{color}}>{rn}</div>
        <div className="card-sym-center" style={{color}}>{cfg.sym}</div>
        <div className="card-name" style={{color:`${color}88`}}>{cfg.name}</div>
      </div>
      {hov&&<div style={{position:"absolute",inset:0,borderRadius:9,background:`radial-gradient(circle at 50% 60%,${color}18 0%,transparent 65%)`,pointerEvents:"none"}}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SUIT DASHBOARD
// ═══════════════════════════════════════════════════════
function SuitDashboard({ suitKey, cfg, rank, onClose, allRanks }) {
  const data=SUIT_DATA[suitKey],color=cfg.color,pct=Math.round((rank/13)*100);
  const [done,setDone]=useState([]);
  const sevColor={high:"#ff2277",medium:"#ff9f1c",low:"#00f5d4"};
  const toggle=i=>setDone(p=>p.includes(i)?p.filter(x=>x!==i):[...p,i]);
  const allDone=done.length===data.nextLevel.steps.length;
  return (
    <div className="sd-overlay" onClick={onClose}>
      <div className="sd-panel slide-in" style={{border:`1px solid ${color}33`}} onClick={e=>e.stopPropagation()}>
        <button className="sd-close" onClick={onClose}>✕</button>
        <div className="sd-header">
          <div className="sd-title-group">
            <span className="sd-sym" style={{color}}>{cfg.sym}</span>
            <div><div className="sd-name" style={{color}}>{cfg.name}</div><div className="sd-sub">{cfg.sub}</div></div>
          </div>
          <div className="sd-rank-group">
            <div className="sd-rank-big" style={{color}}>{RANK_NAMES[rank]}</div>
            <div className="sd-rank-lbl">{RANK_FULL[rank]} — Rank {rank}/13</div>
            <div className="rank-progress">
              <div className="rank-prog-track">
                <div className="pfill" style={{width:`${pct}%`,background:`linear-gradient(90deg,${color},${color}88)`,boxShadow:`0 0 5px ${color}66`}}/>
              </div>
              <span style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--dim)"}}>{pct}%</span>
            </div>
            <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--dim)"}}>Next: Rank {Math.min(rank+1,13)} ({RANK_NAMES[Math.min(rank+1,13)]})</div>
          </div>
        </div>
        <div className="sd-body">
          <div className="sd-metrics">
            {data.metrics.map(m=>(
              <div key={m.k} className="sm-card" style={{borderColor:`${color}18`}}>
                <div className="sm-lbl">{m.k}</div>
                <div className="sm-val" style={{color}}>{m.v}</div>
                <div className="sm-trend" style={{color:m.trend>0?"var(--cyan)":m.trend<0?"var(--pink)":"var(--dim)"}}>{m.trend>0?"▲":m.trend<0?"▼":"─"} {Math.abs(m.trend)}%</div>
              </div>
            ))}
          </div>
          {/* Telemetry */}
          <div style={{background:`${color}0a`,border:`1px solid ${color}22`,borderRadius:10,padding:14}}>
            <div style={{fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,color:`${color}88`,marginBottom:10,textTransform:"uppercase"}}>Telemetry Signals</div>
            {data.telemetry.map((t,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:7,padding:"6px 9px",background:"rgba(255,255,255,.025)",borderRadius:7,border:"1px solid rgba(255,255,255,.04)"}}>
                <span style={{fontSize:9,color:t.ok?"#00f5d4":"#fbbf24",marginTop:2,flexShrink:0}}>{t.ok?"●":"▲"}</span>
                <span style={{fontFamily:"var(--fm)",fontSize:10,color:t.ok?"rgba(255,255,255,.7)":"rgba(251,191,36,.9)",lineHeight:1.5}}>{t.text}</span>
              </div>
            ))}
          </div>
          {/* AI recs */}
          <div className="ai-block" style={{borderColor:`${color}22`}}>
            <div className="ai-block-h"><div className="ai-live"><div className="ai-ldot"/>AI ANALYSIS LIVE</div><div className="ai-t" style={{color}}>Recommendations</div></div>
            {data.aiRecs.map((r,i)=><div key={i} className="ai-item" style={{borderColor:`${color}10`}}><span className="ai-arr" style={{color}}>▶</span>{r}</div>)}
          </div>
          {/* 3 columns */}
          <div className="sd-cols">
            <div className="sd-block" style={{borderColor:`${color}18`}}>
              <div className="sd-block-t" style={{color:`${color}88`}}>Capabilities</div>
              {data.capabilities.map(c=><div key={c} className="cap-item"><div className="cap-dot" style={{background:color,boxShadow:`0 0 4px ${color}`}}/>{c}</div>)}
            </div>
            <div className="sd-block" style={{borderColor:`${color}18`}}>
              <div className="sd-block-t" style={{color:`${color}88`}}>Risk Exposure</div>
              {data.risks.map(r=>(
                <div key={r.n} className="risk-row" style={{background:`${sevColor[r.lvl]}0a`,border:`1px solid ${sevColor[r.lvl]}22`}}>
                  <div className="risk-dot" style={{background:sevColor[r.lvl]}}/><span style={{flex:1,fontSize:10}}>{r.n}</span>
                  <span style={{fontSize:8,fontFamily:"var(--fm)",color:sevColor[r.lvl],textTransform:"uppercase"}}>{r.lvl}</span>
                </div>
              ))}
            </div>
            <div className="sd-block" style={{borderColor:`${color}18`}}>
              <div className="sd-block-t" style={{color:`${color}88`}}>Path → {data.nextLevel.target}</div>
              {data.nextLevel.steps.map((step,i)=>(
                <div key={i} onClick={()=>toggle(i)} className="upg-step" style={{cursor:"pointer"}}>
                  <div className="upg-n" style={{background:`${color}18`,border:`1px solid ${color}30`,color}}>{done.includes(i)?"✓":i+1}</div>
                  <div className="upg-t" style={{color:done.includes(i)?"rgba(255,255,255,.3)":"var(--text)",textDecoration:done.includes(i)?"line-through":"none",transition:"all .2s"}}>{step}</div>
                </div>
              ))}
              {allDone&&<div style={{marginTop:10,padding:"8px 10px",background:`${color}22`,border:`1px solid ${color}55`,borderRadius:6,textAlign:"center",color,fontFamily:"var(--fh)",fontSize:9,letterSpacing:1,boxShadow:`0 0 12px ${color}33`}}>✓ READY TO LEVEL UP</div>}
            </div>
          </div>
          <div className="sd-block" style={{borderColor:`${color}18`}}>
            <div className="sd-block-t" style={{color:`${color}88`}}>Posture History</div>
            <PostureChart ranks={allRanks}/>
            <div style={{display:"flex",gap:12,marginTop:6}}>
              {Object.entries(SUITS).map(([k,c])=><div key={k} style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:c.color,fontFamily:"var(--fm)"}}><span style={{fontSize:12}}>{c.sym}</span>{c.name}</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// INCIDENT ROOM
// ═══════════════════════════════════════════════════════
function IncidentRoom({ ranks, posture, threatPressure, onClose }) {
  const [logs,setLogs]=useState(BASE_LOGS);
  const [intel,setIntel]=useState(67);
  const [patch,setPatch]=useState({total:38,cve1:40,cve2:14,cve3:4});
  const termRef=useRef(null);const idxRef=useRef(0);
  useEffect(()=>{
    const t=setInterval(()=>{
      const i=idxRef.current%ROLLING_LOGS.length;idxRef.current++;
      const now=new Date();const ts=[now.getHours(),now.getMinutes(),now.getSeconds()].map(n=>String(n).padStart(2,"0")).join(":");
      setLogs(p=>[...p.slice(-48),{id:Date.now(),t:ts,...ROLLING_LOGS[i]}]);
      setIntel(p=>Math.min(99,p+(Math.random()>.55?1:0)));
      setPatch(p=>({total:Math.min(96,p.total+Math.floor(Math.random()*3+1)),cve1:Math.min(99,p.cve1+Math.floor(Math.random()*4+1)),cve2:Math.min(99,p.cve2+Math.floor(Math.random()*3)),cve3:Math.min(99,p.cve3+Math.floor(Math.random()*2))}));
    },2200);
    return()=>clearInterval(t);
  },[]);
  useEffect(()=>{if(termRef.current)termRef.current.scrollTop=termRef.current.scrollHeight;},[logs]);
  return (
    <div className="ir-screen">
      <div className="ir-scanline"/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 20px",borderBottom:"1px solid rgba(0,245,212,.12)",background:"rgba(0,0,0,.65)",zIndex:2,backdropFilter:"blur(10px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <span style={{fontSize:9,fontWeight:700,letterSpacing:1.5,background:"rgba(255,34,119,.15)",border:"1px solid rgba(255,34,119,.3)",padding:"3px 10px",borderRadius:4,color:"#ff2277"}}>⬤ LIVE</span>
          <span style={{color:"#00f5d4",fontWeight:900,fontSize:15,letterSpacing:3,fontFamily:"var(--fh)"}}>INCIDENT ROOM</span>
          <span style={{color:"rgba(255,255,255,.3)",fontSize:11,fontFamily:"var(--fm)"}}>/ {INCIDENT.cve} / Zero-Day Exploit</span>
          <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,34,119,.1)",border:"1px solid rgba(255,34,119,.25)",borderRadius:4,padding:"2px 9px"}}>
            <span style={{width:5,height:5,borderRadius:"50%",background:"#ff2277",display:"inline-block"}}/>
            <span style={{color:"#ff2277",fontSize:9,fontFamily:"var(--fm)",letterSpacing:1}}>Posture: {posture.hand} — Score {posture.score}/100</span>
          </div>
        </div>
        <button onClick={onClose} style={{background:"rgba(255,34,119,.12)",border:"1px solid rgba(255,34,119,.3)",borderRadius:6,color:"#ff2277",fontFamily:"var(--fm)",fontSize:10,padding:"6px 16px",cursor:"pointer",letterSpacing:1.5}}>✕ CLOSE ROOM</button>
      </div>
      <div style={{display:"flex",flex:1,overflow:"hidden",zIndex:2}}>
        <div style={{flex:1.5,display:"flex",flexDirection:"column",borderRight:"1px solid rgba(0,245,212,.08)",padding:16}}>
          <div style={{color:"rgba(0,245,212,.45)",fontSize:9,letterSpacing:2.5,marginBottom:10,fontFamily:"var(--fm)"}}>▶ AI JOKER TERMINAL — LIVE THREAT ANALYSIS</div>
          <div ref={termRef} style={{flex:1,overflow:"auto",fontSize:11,lineHeight:2,fontFamily:"'Courier New',monospace"}}>
            {logs.map(log=>(
              <div key={log.id} style={{display:"flex",gap:12,animation:"termFade .4s ease"}}>
                <span style={{color:"rgba(255,255,255,.18)",flexShrink:0,width:64}}>{log.t}</span>
                <span style={{flexShrink:0,width:70,color:log.tag==="JOKER"?"#f5c400":"#00f5d4",fontWeight:700}}>[{log.tag}]</span>
                <span style={{color:log.tag==="JOKER"?"rgba(245,196,0,.85)":"rgba(0,245,212,.8)"}}>{log.msg}</span>
              </div>
            ))}
            <span style={{color:"#00f5d4",animation:"blink 1s step-end infinite"}}>█</span>
          </div>
        </div>
        <div style={{width:360,display:"flex",flexDirection:"column",gap:12,padding:16,overflow:"auto"}}>
          <div style={{background:"rgba(245,196,0,.04)",border:"1px solid rgba(245,196,0,.15)",borderRadius:12,padding:16,display:"flex",alignItems:"center",gap:18}}>
            <div style={{position:"relative",flexShrink:0}}>
              <SvgRing pct={intel} color="#f5c400" size={92} sw={7}/>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{color:"#f5c400",fontSize:18,fontWeight:900,fontFamily:"var(--fh)",textShadow:"0 0 14px #f5c400"}}>{intel}%</span>
              </div>
            </div>
            <div>
              <div style={{color:"#f5c400",fontSize:10,fontWeight:900,letterSpacing:1.5,marginBottom:6,fontFamily:"var(--fh)"}}>JOKER INTELLIGENCE</div>
              <div style={{color:"rgba(255,255,255,.4)",fontSize:10,fontFamily:"var(--fm)",lineHeight:1.8}}>AI agent actively<br/>learning from live<br/>telemetry feed</div>
            </div>
          </div>
          <div style={{background:"rgba(0,245,212,.04)",border:"1px solid rgba(0,245,212,.15)",borderRadius:12,padding:16}}>
            <div style={{color:"#00f5d4",fontSize:9,letterSpacing:2.5,marginBottom:12,fontFamily:"var(--fm)"}}>THREAT NEUTRALIZATION</div>
            <div style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{color:"rgba(255,255,255,.45)",fontSize:10,fontFamily:"var(--fm)"}}>Master Progress</span>
                <span style={{color:"#00f5d4",fontSize:12,fontWeight:900,fontFamily:"var(--fh)"}}>{patch.total}%</span>
              </div>
              <div style={{height:8,background:"rgba(255,255,255,.07)",borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${patch.total}%`,background:"linear-gradient(90deg,#00f5d4,#0080ff)",borderRadius:4,boxShadow:"0 0 12px #00f5d488",transition:"width 1.2s ease"}}/>
              </div>
            </div>
            <MiniBar value={patch.cve1} color="#00f5d4" label="CVE-2026-1337 (Primary)"/>
            <MiniBar value={patch.cve2} color="#f5c400" label="CVE-2026-1338 (Secondary)"/>
            <MiniBar value={patch.cve3} color="#b48afa" label="CVE-2026-1339 (Tertiary)"/>
          </div>
          <div style={{background:"rgba(0,170,255,.03)",border:"1px solid rgba(0,170,255,.12)",borderRadius:10,padding:14}}>
            <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--blue)",marginBottom:10,textTransform:"uppercase"}}>Pillar Response Levels</div>
            {Object.entries(SUITS).map(([k,cfg])=>(
              <div key={k} style={{display:"flex",alignItems:"center",gap:10,padding:"5px 0",borderBottom:"1px solid rgba(0,245,212,.05)"}}>
                <span style={{color:cfg.color,fontSize:15,width:22}}>{cfg.sym}</span>
                <span style={{fontFamily:"var(--fb)",fontSize:12,fontWeight:600,width:78,color:"var(--text)"}}>{cfg.name}</span>
                <div style={{flex:1}} className="ptrack">
                  <div className="pfill" style={{width:`${(ranks[k]/13)*100}%`,background:`linear-gradient(90deg,${cfg.color},${cfg.color}88)`}}/>
                </div>
                <span style={{fontFamily:"var(--fh)",fontSize:13,fontWeight:900,color:cfg.color,width:26,textAlign:"right"}}>{RANK_NAMES[ranks[k]]}</span>
              </div>
            ))}
          </div>
          <div style={{background:"rgba(180,74,250,.03)",border:"1px solid rgba(180,74,250,.12)",borderRadius:10,padding:14}}>
            <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--violet)",marginBottom:10,textTransform:"uppercase"}}>AI Recommended Actions</div>
            {INCIDENT.recs.map((r,i)=>(
              <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:8,padding:"7px 9px",background:"rgba(0,0,0,.3)",borderRadius:7,border:"1px solid rgba(255,255,255,.035)"}}>
                <span style={{flexShrink:0,marginTop:1,fontSize:9,fontWeight:900,padding:"2px 7px",borderRadius:3,fontFamily:"var(--fm)",color:r.p==="P0"?"#ff2277":"#f5c400",background:r.p==="P0"?"rgba(255,34,119,.15)":"rgba(245,196,0,.1)"}}>{r.p}</span>
                <span style={{fontFamily:"var(--fm)",fontSize:10,color:"rgba(255,255,255,.7)",lineHeight:1.6}}>{r.action}</span>
              </div>
            ))}
          </div>
          <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,padding:13,fontSize:10,color:"rgba(255,255,255,.4)",fontFamily:"var(--fm)",lineHeight:1.8}}>
            <span style={{color:"#f5c400"}}>🃏 Joker Insight: </span>
            Patching CVE-2026-1337 will upgrade Diamond from{" "}
            <span style={{color:"#b48afa"}}>Seven → Eight</span>{" "}and shift posture from{" "}
            <span style={{color:"#fbbf24"}}>{posture.hand} → next tier</span>.
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════
export default function CounterStack() {
  const [screen,        setScreen]        = useState("landing");
  const [ranks,         setRanks]         = useState(INIT_RANKS);
  const [prevHand,      setPrevHand]      = useState(null);
  const [postureAnim,   setPostureAnim]   = useState(false);
  const [activeSuit,    setActiveSuit]    = useState(null);
  const [flippingSuits, setFlippingSuits] = useState({});
  const [showIR,        setShowIR]        = useState(false);
  const [comms,         setComms]         = useState(COMMS_INIT);
  const [commInput,     setCommInput]     = useState("");
  const [applyingRecs,  setApplyingRecs]  = useState(false);
  const [time,          setTime]          = useState(()=>new Date().toLocaleTimeString("en-US",{hour12:false}));

  useEffect(()=>{const t=setInterval(()=>setTime(new Date().toLocaleTimeString("en-US",{hour12:false})),1000);return()=>clearInterval(t);},[]);

  const posture=computePosture(ranks);
  const avgRank=Object.values(ranks).reduce((a,b)=>a+b,0)/4;
  const threatPressure=Math.max(18,Math.round(92-(avgRank-5)*6));
  const [animPressure,setAnimPressure]=useState(threatPressure);
  useEffect(()=>{const d=threatPressure-animPressure;if(Math.abs(d)<.4){setAnimPressure(threatPressure);return;}const t=setTimeout(()=>setAnimPressure(p=>p+d*.12),40);return()=>clearTimeout(t);},[threatPressure,animPressure]);
  useEffect(()=>{if(prevHand&&prevHand!==posture.hand){setPostureAnim(true);setTimeout(()=>setPostureAnim(false),700);}setPrevHand(posture.hand);},[posture.hand]);

  const changeRank=useCallback((suit,newRank)=>{
    if(ranks[suit]===newRank)return;
    setFlippingSuits(p=>({...p,[suit]:true}));
    setTimeout(()=>setFlippingSuits(p=>({...p,[suit]:false})),500);
    setRanks(p=>({...p,[suit]:newRank}));
  },[ranks]);

  const handleApplyAI=()=>{
    setApplyingRecs(true);
    AI_RECS.forEach(({suit,rank},i)=>setTimeout(()=>changeRank(suit,rank),i*260));
    setTimeout(()=>{setApplyingRecs(false);setComms(p=>[...p,{role:"AI",msg:"AI recommendations applied. Recalculating posture...",time:new Date().toLocaleTimeString("en-US",{hour12:false})}]);},1200);
  };
  const sendComm=()=>{if(!commInput.trim())return;setComms(p=>[...p,{role:"You",msg:commInput,time:"Now"}]);setCommInput("");};

  const TAG_COLORS={"External":"#00aaff","Cloud":"#b48afa","Priv Esc":"#ff2277","RCE":"#ff9f1c"};

  return (
    <>
      <style>{CSS}</style>
      <div className="noise"/><div className="scanlines"/><div className="gridbg"/><div className="ambience"/>

      {screen === "landing" && <LandingScreen onDone={()=>setScreen("dashboard")}/>}

      {screen === "dashboard" && (
        <div className="app fade-in">
          {/* TOP BAR */}
          <div className="topbar">
            <div className="tb-logo">
              <CSIcon size={28}/>
              COUNTER<em>STACK</em>
            </div>
            <div className="tb-posture">
              <span className="tb-posture-lbl">POSTURE</span>
              <span className={`tb-posture-val ${posture.royal?"royal":""} ${postureAnim?"posture-upgrade":""}`}>{posture.hand}</span>
              <span className="tb-posture-score">{posture.score}</span>
            </div>
            <div className="tb-right">
              <div className="tb-stat"><div className="tb-dot" style={{background:"#00f5d4"}}/>SOC ONLINE</div>
              <div className="tb-stat"><div className="tb-dot" style={{background:"var(--pink)",animationDelay:".5s"}}/><span style={{color:"var(--pink)"}}>1 CRITICAL ACTIVE</span></div>
              <span className="tb-time">{time}</span>
              <button className="btn-sim" onClick={()=>{}}>⬡ SIMULATE / TABLETOP</button>
              <button className="btn-sim" style={{borderColor:"rgba(255,34,119,.4)",color:"var(--pink)"}} onClick={()=>setShowIR(true)}>⬡ INCIDENT ROOM</button>
            </div>
          </div>

          {/* LEFT */}
          <div className="left-col">
            <div className="panel" style={{flexShrink:0}}>
              <div className="ptitle">Incident Overview</div>
              <div className="inc-ov">
                {[["Type","Zero-Day"],["Severity","Critical","crit"],["Entry","API Gateway"],["Time","14:23:07"]].map(([k,v,cls])=>(
                  <div className="inc-row" key={k}><span className="inc-k">{k}</span><span className={`inc-v ${cls==="crit"?"crit":""}`}>{v}</span></div>
                ))}
                <div className="pills-row">
                  {["External","Cloud","Priv Esc","RCE"].map(t=>(
                    <span key={t} className="pill" style={{color:TAG_COLORS[t]||"#fff",borderColor:TAG_COLORS[t]||"#fff",background:`${TAG_COLORS[t]||"#fff"}11`}}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="panel" style={{flex:1,overflow:"hidden"}}>
              <div className="ptitle">Threats — Joker</div>
              <div style={{padding:"7px 11px",overflow:"auto",height:"calc(100% - 28px)"}}>
                {JOKER_THREATS.map(t=>(
                  <div key={t.n} className="threat-item">
                    <span style={{fontSize:10,color:t.lvl==="critical"?"var(--pink)":t.lvl==="high"?"#ff9f1c":"#f7df1e"}}>⚠</span>
                    <span style={{fontSize:11,flex:1,color:t.lvl==="critical"?"var(--pink)":"var(--text)"}}>{t.n}</span>
                    <span className="threat-lvl" style={{color:t.lvl==="critical"?"var(--pink)":t.lvl==="high"?"#ff9f1c":"#f7df1e"}}>{t.lvl}</span>
                  </div>
                ))}
                <div style={{marginTop:10,display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:"rgba(0,245,212,.08)",border:"1px solid rgba(0,245,212,.2)",borderRadius:5}}>
                  <div className="ai-ldot"/><span style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--cyan)",letterSpacing:1}}>AI SCAN IN PROGRESS</span>
                </div>
              </div>
            </div>
          </div>

          {/* HUB */}
          <div className="hub panel">
            <div className="hub-ring-outer"/><div className="hub-ring-mid"/><div className="hub-ring-inner"/><div className="hub-glow"/>
            {Object.entries(SUITS).map(([k,cfg])=>(
              <div key={k} className={`suit-slot ${cfg.pos}`}>
                {(cfg.pos==="top"||cfg.pos==="left")&&<div className="suit-slot-label" style={{color:activeSuit===k?cfg.color:undefined}}>{cfg.name}</div>}
                <SuitCard suitKey={k} cfg={cfg} rank={ranks[k]} active={activeSuit===k} dimmed={activeSuit!==null&&activeSuit!==k} flipping={!!flippingSuits[k]} onClick={()=>setActiveSuit(activeSuit===k?null:k)}/>
                {(cfg.pos==="bottom"||cfg.pos==="right")&&<div className="suit-slot-label" style={{color:activeSuit===k?cfg.color:undefined}}>{cfg.name}</div>}
              </div>
            ))}
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",zIndex:15}}>
              <div className={`joker-card ${animPressure>80?"glitch":""}`} onClick={()=>setShowIR(true)}>
                <div className="jc-holo"/>
                <div style={{position:"absolute",top:7,left:9,fontFamily:"var(--fh)",fontSize:10,fontWeight:900,color:"#ff2277",lineHeight:1.2,textShadow:"0 0 6px #ff2277"}}>J<br/><span style={{fontSize:9}}>★</span></div>
                <div style={{position:"relative",marginBottom:4}}>
                  <SvgRing pct={Math.round(animPressure)} color="#ff2277" size={72} sw={5}/>
                  <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <span style={{fontSize:18,filter:"drop-shadow(0 0 8px rgba(255,34,119,.9))"}}>🃏</span>
                  </div>
                </div>
                <span className="jc-label">JOKER</span>
                <span className="jc-pct">{Math.round(animPressure)}%</span>
                <span className="jc-sub">THREAT PRESSURE</span>
              </div>
              <div className="tp-label">Click to open Incident Room</div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="right-col">
            <div className="panel" style={{flexShrink:0}}>
              <div className="ptitle">Joker Analysis</div>
              <div className="ja-panel">
                <div className="ja-row">
                  <div className="ja-thumb">🃏</div>
                  <div className="ja-info">
                    <div className="ja-name">Zero-Day Exploit</div>
                    <div className="pbar-wrap">
                      <div className="pbar-lbl"><span>IMPACT</span><span>{Math.round(animPressure)}%</span></div>
                      <div className="ptrack"><div className="pfill" style={{width:`${animPressure}%`,background:"linear-gradient(90deg,#ff2277,#b5179e)",boxShadow:"0 0 6px rgba(255,34,119,.5)"}}/></div>
                    </div>
                    <div className="spread">Spread Risk: <span>{animPressure>70?"High":animPressure>50?"Medium":"Low"}</span></div>
                    <div className="pbar-wrap" style={{marginTop:5}}>
                      <div className="pbar-lbl"><span>CONFIDENCE</span><span>92%</span></div>
                      <div className="ptrack"><div className="pfill" style={{width:"92%",background:"linear-gradient(90deg,#b48afa,#7c3aed)"}}/></div>
                    </div>
                  </div>
                </div>
                <button className="btn-ir" onClick={()=>setShowIR(true)}>⬡ OPEN INCIDENT ROOM</button>
              </div>
            </div>
            <div className="panel" style={{flexShrink:0}}>
              <div className="ptitle">AI Recommended Hand</div>
              <div className="rh-panel">
                <div className="mini-cards">
                  {AI_RECS.map(({suit,rank})=>{
                    const cfg=SUITS[suit];
                    return (
                      <div key={suit} className="mini-card" style={{background:`${cfg.dark}cc`,borderColor:`${cfg.color}66`,color:cfg.color,boxShadow:`0 0 8px ${cfg.color}20`}} onClick={()=>changeRank(suit,rank)} title={`Apply ${RANK_NAMES[rank]} to ${cfg.name}`}>
                        <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,transparent 30%,rgba(255,255,255,.05) 50%,transparent 70%)",pointerEvents:"none"}}/>
                        <span className="mini-r">{RANK_NAMES[rank]}</span><span className="mini-s">{cfg.sym}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--dim)",textAlign:"center",marginBottom:5}}>Target: <span style={{color:"var(--cyan)"}}>FULL HOUSE</span></div>
                <button className="btn-apply" onClick={handleApplyAI} disabled={applyingRecs}>{applyingRecs?"APPLYING...":"▶ APPLY SUGGESTIONS"}</button>
              </div>
            </div>
            <div className="panel comms-panel">
              <div className="ptitle">Communication</div>
              <div className="comms-msgs">
                {comms.map((m,i)=>(
                  <div key={i} className="cmsg">
                    <div className="cmsg-h"><span className="cmsg-role" style={{color:roleColor[m.role]||"var(--dim)"}}>{m.role}</span><span className="cmsg-t">{m.time}</span></div>
                    <div className="cmsg-txt">{m.msg}</div>
                  </div>
                ))}
              </div>
              <div className="comms-in">
                <input className="ci-inp" placeholder="Send message..." value={commInput} onChange={e=>setCommInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendComm()}/>
                <button className="ci-btn" onClick={sendComm}>→</button>
              </div>
            </div>
          </div>

          {/* BOTTOM */}
          <div className="bottom-row">
            <div className="panel chart-panel">
              <div className="ptitle">Posture History</div>
              <PostureChart ranks={ranks}/>
              <div className="chart-legend">
                {Object.entries(SUITS).map(([k,cfg])=>(
                  <div key={k} className="cl-item" style={{color:cfg.color}}>
                    <div className="cl-dot" style={{background:cfg.color}}/>{cfg.name} — {RANK_NAMES[ranks[k]]}
                  </div>
                ))}
              </div>
            </div>
            <div className="panel" style={{padding:"7px 11px"}}>
              <div className="ptitle" style={{padding:"0 0 5px",marginBottom:6}}>Incident Queue</div>
              {MOCK_INCIDENTS.map(inc=>(
                <div key={inc.id} className="queue-item">
                  <div className="qi-dot" style={{background:SEV_COLOR[inc.sev],boxShadow:`0 0 4px ${SEV_COLOR[inc.sev]}`}}/>
                  <span className="qi-name">{inc.name}</span>
                  <span className="pill" style={{color:STAT_COLOR[inc.status],borderColor:`${STAT_COLOR[inc.status]}44`,background:`${STAT_COLOR[inc.status]}11`,fontSize:8}}>{inc.status}</span>
                  <span className="qi-time">{inc.time}</span>
                </div>
              ))}
            </div>
            <div className="panel" style={{padding:"7px 11px"}}>
              <div className="ptitle" style={{padding:"0 0 5px",marginBottom:6}}>Engineer Status</div>
              {MOCK_ENGINEERS.map(e=>(
                <div key={e.name} className="eng-item">
                  <div className="eng-h"><span style={{fontSize:10}}>{e.name}</span><span style={{color:"var(--dim)",fontFamily:"var(--fm)",fontSize:9}}>{e.pct}%</span></div>
                  <div className="ptrack"><div className="pfill" style={{width:`${e.pct}%`,background:`linear-gradient(90deg,${e.color},${e.color}88)`,boxShadow:`0 0 4px ${e.color}55`}}/></div>
                </div>
              ))}
              <div style={{marginTop:10,padding:"8px",background:"rgba(0,245,212,.03)",border:"1px solid rgba(0,245,212,.1)",borderRadius:6}}>
                <div style={{fontFamily:"var(--fm)",fontSize:8,letterSpacing:1.5,color:"rgba(0,245,212,.5)",marginBottom:4}}>STACK POSTURE</div>
                <div style={{fontFamily:"var(--fh)",fontSize:14,fontWeight:900,color:posture.royal?"var(--gold)":"#fff"}}>{posture.hand}</div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
                  <span style={{fontSize:9,color:"var(--dim)",fontFamily:"var(--fm)"}}>Score</span>
                  <span style={{fontFamily:"var(--fh)",fontSize:11,fontWeight:700,color:"var(--cyan)"}}>{posture.score}/100</span>
                </div>
              </div>
            </div>
          </div>

          {activeSuit && (
            <SuitDashboard suitKey={activeSuit} cfg={SUITS[activeSuit]} rank={ranks[activeSuit]} allRanks={ranks} onClose={()=>setActiveSuit(null)}/>
          )}
          {showIR && <IncidentRoom ranks={ranks} posture={posture} threatPressure={animPressure} onClose={()=>setShowIR(false)}/>}
        </div>
      )}
    </>
  );
}
