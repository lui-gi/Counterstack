import { useEffect } from 'react';
import { SUITS, SUIT_DATA, RANK_NAMES, RANK_FULL } from '../data/gameData';
import SuitCard from './SuitCard';
import type { SuitConfig } from '../interfaces/SuitConfig.interface';
import type { SuitMetric } from '../interfaces/SuitMetric.interface';
import type { SuitRisk } from '../interfaces/SuitRisk.interface';
import type { SuitDashboardProps } from '../interfaces/SuitDashboardProps.interface';
import PostureChart from './PostureChart';

function deriveMetrics(suitKey: string, profile: Record<string, unknown>): SuitMetric[] | null {
  const nist = profile.nistCsf as Record<string, unknown> | undefined;
  if (!nist) return null;

  const identify = nist.identify as Record<string, unknown> | undefined;
  const protect  = nist.protect  as Record<string, unknown> | undefined;
  const detect   = nist.detect   as Record<string, unknown> | undefined;
  const respond  = nist.respond  as Record<string, unknown> | undefined;
  const recover  = nist.recover  as Record<string, unknown> | undefined;

  if (suitKey === 'clover') {
    if (!identify || !protect) return null;
    return [
      {
        k: 'Patch Cadence',
        v: protect.patchCadenceDays != null ? `${protect.patchCadenceDays}d` : '—',
        raw: typeof protect.patchCadenceDays === 'number' ? Math.max(0, 100 - protect.patchCadenceDays * 3) : 0,
        trend: 0,
      },
      {
        k: 'Asset Inventory',
        v: identify.assetInventoryComplete ? 'Complete' : 'Incomplete',
        raw: identify.assetInventoryComplete ? 100 : 40,
        trend: 0,
      },
      {
        k: 'Risk Assessment',
        v: identify.riskAssessmentAgeMonths != null ? `${identify.riskAssessmentAgeMonths}mo ago` : '—',
        raw: typeof identify.riskAssessmentAgeMonths === 'number' ? Math.max(0, 100 - identify.riskAssessmentAgeMonths * 5) : 0,
        trend: 0,
      },
      {
        k: 'Critical Assets Docs',
        v: identify.criticalAssetsDocumented ? 'Yes' : 'No',
        raw: identify.criticalAssetsDocumented ? 100 : 20,
        trend: 0,
      },
    ];
  }

  if (suitKey === 'spade') {
    if (!detect || !respond) return null;
    return [
      {
        k: 'Mean Time to Detect',
        v: detect.meanTimeToDetectHours != null ? `${detect.meanTimeToDetectHours}h` : '—',
        raw: typeof detect.meanTimeToDetectHours === 'number' ? Math.max(0, 100 - detect.meanTimeToDetectHours * 4) : 0,
        trend: 0,
      },
      {
        k: 'EDR Coverage',
        v: detect.edrCoveragePercent != null ? `${detect.edrCoveragePercent}%` : '—',
        raw: typeof detect.edrCoveragePercent === 'number' ? detect.edrCoveragePercent : 0,
        trend: 0,
      },
      {
        k: 'SIEM Active',
        v: detect.siemActive ? 'Yes' : 'No',
        raw: detect.siemActive ? 100 : 0,
        trend: 0,
      },
      {
        k: 'Mean Time to Respond',
        v: respond.meanTimeToRespondHours != null ? `${respond.meanTimeToRespondHours}h` : '—',
        raw: typeof respond.meanTimeToRespondHours === 'number' ? Math.max(0, 100 - respond.meanTimeToRespondHours * 10) : 0,
        trend: 0,
      },
    ];
  }

  if (suitKey === 'diamond') {
    if (!protect) return null;
    return [
      {
        k: 'MFA Adoption',
        v: protect.mfaAdoptionPercent != null ? `${protect.mfaAdoptionPercent}%` : '—',
        raw: typeof protect.mfaAdoptionPercent === 'number' ? protect.mfaAdoptionPercent : 0,
        trend: 0,
      },
      {
        k: 'Zero Trust Maturity',
        v: typeof protect.zeroTrustMaturity === 'string' ? protect.zeroTrustMaturity : '—',
        raw: protect.zeroTrustMaturity === 'full' ? 100 : protect.zeroTrustMaturity === 'in-progress' ? 50 : 10,
        trend: 0,
      },
      {
        k: 'Encryption at Rest',
        v: protect.encryptionAtRest ? 'Enabled' : 'Disabled',
        raw: protect.encryptionAtRest ? 100 : 0,
        trend: 0,
      },
      {
        k: 'Patch Cadence',
        v: protect.patchCadenceDays != null ? `${protect.patchCadenceDays}d` : '—',
        raw: typeof protect.patchCadenceDays === 'number' ? Math.max(0, 100 - protect.patchCadenceDays * 3) : 0,
        trend: 0,
      },
    ];
  }

  if (suitKey === 'heart') {
    if (!recover) return null;
    return [
      {
        k: 'RTO',
        v: recover.rtoHours != null ? `${recover.rtoHours}h` : '—',
        raw: typeof recover.rtoHours === 'number' ? Math.max(0, 100 - recover.rtoHours * 8) : 0,
        trend: 0,
      },
      {
        k: 'RPO',
        v: recover.rpoHours != null ? `${recover.rpoHours}h` : '—',
        raw: typeof recover.rpoHours === 'number' ? Math.max(0, 100 - recover.rpoHours * 10) : 0,
        trend: 0,
      },
      {
        k: 'Backup Frequency',
        v: recover.backupFrequencyHours != null ? `every ${recover.backupFrequencyHours}h` : '—',
        raw: typeof recover.backupFrequencyHours === 'number' ? Math.max(0, 100 - recover.backupFrequencyHours * 2) : 0,
        trend: 0,
      },
      {
        k: 'Last DR Test',
        v: recover.lastDrTestDays != null ? `${recover.lastDrTestDays}d ago` : '—',
        raw: typeof recover.lastDrTestDays === 'number' ? Math.max(0, 100 - recover.lastDrTestDays * 2) : 0,
        trend: 0,
      },
    ];
  }

  return null;
}

// ── Risk derivation (C + H) ────────────────────────────────────────────────

type RiskLevel = 'high' | 'medium' | 'low';

function classifyText(text: string): RiskLevel {
  const t = text.toLowerCase();
  if (/critical|unpatched|exploit|breach|no .*plan|not tested|not enforced/.test(t)) return 'high';
  if (/missing|gap|exposed|incomplete|not .*implement|stale|old/.test(t)) return 'medium';
  return 'low';
}

function textToSuit(text: string): string {
  const t = text.toLowerCase();
  if (/patch|cve|vuln|scan|asset|inventory/.test(t)) return 'clover';
  if (/detect|siem|edr|alert|soc|hunt|incident|respond|lateral|exfil/.test(t)) return 'spade';
  if (/mfa|password|access|privilege|account|key|token|encrypt|firewall|trust/.test(t)) return 'diamond';
  if (/backup|recover|dr |restore|rto|rpo|continuity|ransomware/.test(t)) return 'heart';
  return 'clover';
}

interface Incident {
  date?: string;
  type?: string;
  impact?: string;
  resolved?: boolean;
  notes?: string;
}

function deriveRisks(suitKey: string, profile: Record<string, unknown>): SuitRisk[] | null {
  const nist = profile.nistCsf as Record<string, unknown> | undefined;
  if (!nist) return null;

  const identify = nist.identify as Record<string, unknown> | undefined;
  const protect  = nist.protect  as Record<string, unknown> | undefined;
  const detect   = nist.detect   as Record<string, unknown> | undefined;
  const respond  = nist.respond  as Record<string, unknown> | undefined;
  const recover  = nist.recover  as Record<string, unknown> | undefined;

  const anomalies: SuitRisk[] = [];

  if (suitKey === 'clover' && identify && protect) {
    if (!identify.assetInventoryComplete)
      anomalies.push({ n: 'Asset inventory incomplete', lvl: 'high' });
    if (typeof identify.riskAssessmentAgeMonths === 'number') {
      const age = identify.riskAssessmentAgeMonths;
      if (age > 18) anomalies.push({ n: `Risk assessment ${age}mo old (>18mo)`, lvl: 'high' });
      else if (age > 12) anomalies.push({ n: `Risk assessment ${age}mo old`, lvl: 'medium' });
    }
    if (!identify.criticalAssetsDocumented)
      anomalies.push({ n: 'Critical assets undocumented', lvl: 'medium' });
    if (typeof protect.patchCadenceDays === 'number') {
      const d = protect.patchCadenceDays;
      if (d > 30) anomalies.push({ n: `Patch cadence: ${d}d (>30d target)`, lvl: 'high' });
      else if (d > 14) anomalies.push({ n: `Patch cadence: ${d}d`, lvl: 'medium' });
    }
  }

  if (suitKey === 'spade' && detect && respond) {
    if (!detect.siemActive)
      anomalies.push({ n: 'No SIEM deployed', lvl: 'high' });
    if (typeof detect.edrCoveragePercent === 'number') {
      const edr = detect.edrCoveragePercent;
      if (edr < 60) anomalies.push({ n: `EDR coverage at ${edr}%`, lvl: 'high' });
      else if (edr < 80) anomalies.push({ n: `EDR coverage at ${edr}%`, lvl: 'medium' });
    }
    if (typeof detect.meanTimeToDetectHours === 'number') {
      const mttd = detect.meanTimeToDetectHours;
      if (mttd > 24) anomalies.push({ n: `MTTD: ${mttd}h (>24h)`, lvl: 'high' });
      else if (mttd > 8) anomalies.push({ n: `MTTD: ${mttd}h`, lvl: 'medium' });
    }
    if (!respond.irPlanExists)
      anomalies.push({ n: 'No IR plan exists', lvl: 'high' });
    else if (typeof respond.irPlanAgeMonths === 'number' && respond.irPlanAgeMonths > 18)
      anomalies.push({ n: `IR plan ${respond.irPlanAgeMonths}mo old`, lvl: 'medium' });
  }

  if (suitKey === 'diamond' && protect) {
    if (typeof protect.mfaAdoptionPercent === 'number') {
      const mfa = protect.mfaAdoptionPercent;
      if (mfa < 70) anomalies.push({ n: `MFA adoption at ${mfa}%`, lvl: 'high' });
      else if (mfa < 95) anomalies.push({ n: `MFA adoption at ${mfa}% (<95%)`, lvl: 'medium' });
    }
    if (!protect.encryptionAtRest)
      anomalies.push({ n: 'Encryption at rest not enabled', lvl: 'high' });
    if (protect.zeroTrustMaturity === 'none' || protect.zeroTrustMaturity === 'not-started')
      anomalies.push({ n: 'Zero trust not implemented', lvl: 'medium' });
    if (typeof protect.patchCadenceDays === 'number' && protect.patchCadenceDays > 30)
      anomalies.push({ n: `Patch cadence: ${protect.patchCadenceDays}d (>30d target)`, lvl: 'high' });
  }

  if (suitKey === 'heart' && recover) {
    if (!recover.backupsTested)
      anomalies.push({ n: 'Backups not tested', lvl: 'high' });
    if (typeof recover.lastDrTestDays === 'number') {
      const dr = recover.lastDrTestDays;
      if (dr > 180) anomalies.push({ n: `DR untested for ${dr} days`, lvl: 'high' });
      else if (dr > 90) anomalies.push({ n: `Last DR test: ${dr} days ago`, lvl: 'medium' });
    }
    if (typeof recover.rtoHours === 'number' && recover.rtoHours > 24)
      anomalies.push({ n: `RTO target: ${recover.rtoHours}h (>24h)`, lvl: 'high' });
    if (typeof recover.backupFrequencyHours === 'number' && recover.backupFrequencyHours > 48)
      anomalies.push({ n: `Backup frequency: every ${recover.backupFrequencyHours}h`, lvl: 'medium' });
  }

  // openRisks — keyword-match to this suit (C)
  const openRisks = profile.openRisks;
  if (Array.isArray(openRisks)) {
    for (const r of openRisks) {
      if (typeof r === 'string' && textToSuit(r) === suitKey) {
        anomalies.push({ n: r, lvl: classifyText(r) });
      }
    }
  }

  // recent_incidents — unresolved, keyword-matched to this suit (H)
  const incidents = profile.recent_incidents;
  if (Array.isArray(incidents)) {
    for (const inc of incidents as Incident[]) {
      if (inc.resolved) continue;
      const text = `${inc.type ?? ''} ${inc.impact ?? ''}`;
      if (textToSuit(text) === suitKey) {
        const label = inc.type ? `Open incident: ${inc.type}` : 'Open incident';
        anomalies.push({ n: label, lvl: 'high' });
      }
    }
  }

  return anomalies.length > 0 ? anomalies : [];
}

export default function SuitDashboard({ suitKey, cfg, rank, onClose, allRanks, aiAnalysis, onRequestAnalysis, hasOrgProfile, orgProfile }: SuitDashboardProps) {
  const data = SUIT_DATA[suitKey];
  const color = cfg.color;
  const pct = Math.round((rank/13)*100);
  const sevColor = { high:"#f72585", medium:"#ff9f1c", low:"#39d353" };

  const derivedMetrics = orgProfile ? deriveMetrics(suitKey, orgProfile) : null;
  const displayMetrics = derivedMetrics ?? data.metrics;
  const metricsFromProfile = !!derivedMetrics;

  const derivedRisks = orgProfile ? deriveRisks(suitKey, orgProfile) : null;
  const displayRisks = (derivedRisks && derivedRisks.length > 0) ? derivedRisks : data.risks;

  // Trigger Gemini analysis when panel opens (lazy loading)
  useEffect(() => {
    if (hasOrgProfile && !aiAnalysis && onRequestAnalysis) {
      onRequestAnalysis();
    }
  }, [hasOrgProfile, aiAnalysis, onRequestAnalysis]);

  // Use Gemini recommendations if available, otherwise fall back to static
  const displayRecs = aiAnalysis?.recommendations?.length ? aiAnalysis.recommendations : data.aiRecs;
  const isAiLoading = aiAnalysis?.loading ?? false;
  const hasAiRecs = !!(aiAnalysis?.recommendations?.length);
  const topAction = displayRecs[0];
  const restRecs = displayRecs.slice(1);

  return (
    <div className="sd-overlay" onClick={onClose}>

      {/* Floating card — left of panel */}
      <div className="sd-floating-card" onClick={e=>e.stopPropagation()}>
        <div className="sd-panel-card">
          <SuitCard
            suitKey={suitKey}
            cfg={cfg}
            rank={rank}
            active={false}
            dimmed={false}
            flipping={false}
            onClick={()=>{}}
          />
        </div>
      </div>

      <div className="sd-panel slide-in" style={{border:`1px solid ${color}33`}} onClick={e=>e.stopPropagation()}>
        <button className="sd-close" onClick={onClose}>✕</button>

        {/* Header */}
        <div className="sd-header">
          <div className="sd-title-group">
            <span className="sd-sym" style={{color}}>{cfg.sym}</span>
            <div>
              <div className="sd-name" style={{color}}>{cfg.name}</div>
              <div className="sd-sub">{cfg.sub}</div>
            </div>
          </div>
          <div className="sd-rank-group">
            <div className="sd-rank-big" style={{color}}>{RANK_NAMES[rank]}</div>
            <div className="sd-rank-lbl">{RANK_FULL[rank]} — Rank {rank}/13</div>
            <div className="rank-progress">
              <div className="rank-prog-track">
                <div className="pfill" style={{width:`${pct}%`,background:`linear-gradient(90deg,${color},${color}88)`,boxShadow:`0 0 5px ${color}66`}}/>
              </div>
              <span style={{fontFamily:"var(--fm)",fontSize:12,color:"var(--dim)"}}>{pct}%</span>
            </div>
            <div style={{fontFamily:"var(--fm)",fontSize:12,color:"var(--dim)"}}>
              Next: Rank {Math.min(rank+1,13)} ({RANK_NAMES[Math.min(rank+1,13)]})
            </div>
          </div>
        </div>

        <div className="sd-body">
          {/* Metrics */}
          <div className="sd-metrics">
            {displayMetrics.map((m: SuitMetric)=>(
              <div key={m.k} className="sm-card" style={{borderColor:`${color}18`}}>
                <div className="sm-lbl">{m.k}</div>
                <div className="sm-val" style={{color}}>{m.v}</div>
                {!metricsFromProfile && (
                  <div className="sm-trend" style={{color:m.trend>0?"var(--green)":m.trend<0?"var(--pink)":"var(--dim)"}}>
                    {m.trend>0?"▲":m.trend<0?"▼":"─"} {Math.abs(m.trend)}% vs prev week
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* AI Recommendations */}
          <div className="ai-block" style={{borderColor:`${color}22`}}>
            <div className="ai-block-h">
              <div className="ai-live">
                <div className="ai-ldot" style={isAiLoading ? {animation:"tdot 1s ease-in-out infinite"} : undefined}/>
                {isAiLoading ? "THE MAGICIAN ANALYZING..." : hasAiRecs ? "THE MAGICIAN LIVE" : "AI ANALYSIS"}
              </div>
              <div className="ai-t" style={{color}}>Recommendations — {cfg.name}</div>
            </div>
            {isAiLoading ? (
              <div style={{padding:"12px",textAlign:"center",color:"var(--dim)",fontSize:14}}>
                Analyzing your organization profile...
              </div>
            ) : (
              <>
                {/* Top action — elevated (F) */}
                {topAction && (
                  <div style={{margin:"6px 0 4px",padding:"10px 12px",background:`${color}12`,border:`1px solid ${color}44`,borderRadius:6,display:"flex",alignItems:"flex-start",gap:8}}>
                    <span style={{color,fontFamily:"var(--fm)",fontSize:11,fontWeight:700,whiteSpace:"nowrap",marginTop:1}}>▶ TOP</span>
                    <span style={{fontSize:14,color:"var(--fg)",fontWeight:500}}>{topAction}</span>
                  </div>
                )}
                {restRecs.map((r: string, i: number) => (
                  <div key={i} className="ai-item" style={{borderColor:`${color}10`}}>
                    <span className="ai-arr" style={{color}}>▶</span>{r}
                  </div>
                ))}
              </>
            )}
            {aiAnalysis?.reasoning && (
              <div style={{marginTop:8,padding:"8px 10px",background:"rgba(0,212,255,.05)",borderRadius:4,fontSize:13,color:"var(--cyan)",fontStyle:"italic"}}>
                🔮 {aiAnalysis.reasoning}
              </div>
            )}
          </div>

          {/* 3 columns */}
          <div className="sd-cols">
            <div className="sd-block" style={{borderColor:`${color}18`}}>
              <div className="sd-block-t" style={{color:`${color}88`}}>Capabilities</div>
              {data.capabilities.map((c: string)=>(
                <div key={c} className="cap-item">
                  <div className="cap-dot" style={{background:color,boxShadow:`0 0 4px ${color}`}}/>
                  {c}
                </div>
              ))}
            </div>
            <div className="sd-block" style={{borderColor:`${color}18`}}>
              <div className="sd-block-t" style={{color:`${color}88`}}>Risk Exposure</div>
              {displayRisks.length === 0 ? (
                <div style={{fontSize:13,color:"var(--green)",padding:"6px 0"}}>✓ No anomalies detected</div>
              ) : (
                displayRisks.map((r: SuitRisk)=>(
                  <div key={r.n} className="risk-row" style={{background:`${sevColor[r.lvl as keyof typeof sevColor]}0a`,border:`1px solid ${sevColor[r.lvl as keyof typeof sevColor]}22`}}>
                    <div className="risk-dot" style={{background:sevColor[r.lvl as keyof typeof sevColor]}}/>
                    <span style={{flex:1,fontSize:13}}>{r.n}</span>
                    <span style={{fontSize:12,fontFamily:"var(--fm)",color:sevColor[r.lvl as keyof typeof sevColor],textTransform:"uppercase"}}>{r.lvl}</span>
                  </div>
                ))
              )}
            </div>
            <div className="sd-block" style={{borderColor:`${color}18`}}>
              <div className="sd-block-t" style={{color:`${color}88`}}>Upgrade Path → {RANK_NAMES[Math.min(rank+2,13)]}</div>
              {data.upgrade.map((u: string,i: number)=>(
                <div key={i} className="upg-step">
                  <div className="upg-n" style={{background:`${color}18`,border:`1px solid ${color}30`,color}}>{i+1}</div>
                  <div className="upg-t">{u}</div>
                </div>
              ))}
            </div>
          </div>

          {/* History */}
          <div className="sd-block" style={{borderColor:`${color}18`}}>
            <div className="sd-block-t" style={{color:`${color}88`}}>Posture History — All Pillars</div>
            <PostureChart ranks={allRanks}/>
            <div style={{display:"flex",gap:12,marginTop:6}}>
              {(Object.entries(SUITS) as [string, SuitConfig][]).map(([k,c])=>(
                <div key={k} style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:c.color,fontFamily:"var(--fm)"}}>
                  <span style={{fontSize:14}}>{c.sym}</span>{c.name}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
