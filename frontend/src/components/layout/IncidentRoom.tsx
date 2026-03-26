import { SUITS, MOCK_INCIDENTS, RANK_NAMES } from '../../data/gameData';
import type { SuitConfig } from '../../interfaces/SuitConfig.interface';
import type { MockIncident } from '../../interfaces/MockIncident.interface';
import type { IncidentRoomProps } from '../../interfaces/IncidentRoomProps.interface';

// Map CWE IDs to human-readable attack surface tags
const CWE_TAG_MAP: Record<string, { label: string; color: string }> = {
  'CWE-77': { label: 'Command Injection', color: '#ff9f1c' },
  'CWE-78': { label: 'OS Command Injection', color: '#ff9f1c' },
  'CWE-79': { label: 'XSS', color: 'var(--violet)' },
  'CWE-89': { label: 'SQL Injection', color: '#ff9f1c' },
  'CWE-94': { label: 'Code Injection', color: '#ff9f1c' },
  'CWE-119': { label: 'Buffer Overflow', color: 'var(--pink)' },
  'CWE-120': { label: 'Buffer Overflow', color: 'var(--pink)' },
  'CWE-125': { label: 'Out-of-Bounds Read', color: 'var(--pink)' },
  'CWE-200': { label: 'Info Disclosure', color: 'var(--cyan)' },
  'CWE-269': { label: 'Priv Esc', color: 'var(--pink)' },
  'CWE-284': { label: 'Access Control', color: 'var(--violet)' },
  'CWE-287': { label: 'Auth Bypass', color: 'var(--pink)' },
  'CWE-288': { label: 'Auth Bypass', color: 'var(--pink)' },
  'CWE-306': { label: 'No Auth', color: 'var(--pink)' },
  'CWE-352': { label: 'CSRF', color: 'var(--violet)' },
  'CWE-400': { label: 'Resource Exhaustion', color: '#ff9f1c' },
  'CWE-416': { label: 'Use After Free', color: 'var(--pink)' },
  'CWE-434': { label: 'File Upload', color: '#ff9f1c' },
  'CWE-502': { label: 'Deserialization', color: '#ff9f1c' },
  'CWE-611': { label: 'XXE', color: '#ff9f1c' },
  'CWE-787': { label: 'Out-of-Bounds Write', color: 'var(--pink)' },
  'CWE-917': { label: 'Expression Injection', color: '#ff9f1c' },
  'CWE-918': { label: 'SSRF', color: 'var(--violet)' },
};

// Derive attack surface tags from CVE description and CWEs
function deriveAttackSurface(cve: { description?: string; cwes?: string[] } | null | undefined): { label: string; color: string }[] {
  const tags: { label: string; color: string }[] = [];
  if (!cve) return [{ label: 'Unknown', color: 'var(--dim)' }];

  // Add tags from CWEs
  if (cve.cwes && cve.cwes.length > 0) {
    for (const cwe of cve.cwes) {
      const mapped = CWE_TAG_MAP[cwe];
      if (mapped && !tags.some(t => t.label === mapped.label)) {
        tags.push(mapped);
      }
    }
  }

  // Derive tags from description keywords
  const desc = (cve.description || '').toLowerCase();
  if (desc.includes('remote code execution') || desc.includes('rce')) {
    if (!tags.some(t => t.label === 'RCE')) tags.push({ label: 'RCE', color: '#ff9f1c' });
  }
  if (desc.includes('privilege escalation')) {
    if (!tags.some(t => t.label === 'Priv Esc')) tags.push({ label: 'Priv Esc', color: 'var(--pink)' });
  }
  if (desc.includes('unauthenticated') || desc.includes('without authentication')) {
    if (!tags.some(t => t.label === 'No Auth')) tags.push({ label: 'No Auth', color: 'var(--pink)' });
  }
  if (desc.includes('lateral movement')) {
    if (!tags.some(t => t.label === 'Lateral Move')) tags.push({ label: 'Lateral Move', color: 'var(--violet)' });
  }
  if (desc.includes('external') || desc.includes('internet-facing') || desc.includes('publicly accessible')) {
    if (!tags.some(t => t.label === 'External')) tags.push({ label: 'External', color: 'var(--cyan)' });
  }
  if (desc.includes('cloud') || desc.includes('aws') || desc.includes('azure') || desc.includes('gcp')) {
    if (!tags.some(t => t.label === 'Cloud')) tags.push({ label: 'Cloud', color: 'var(--violet)' });
  }

  return tags.length > 0 ? tags.slice(0, 5) : [{ label: 'Exploit', color: 'var(--pink)' }];
}

// Parse requiredAction into checklist items
function parseRequiredAction(action: string | undefined): { text: string; done: boolean }[] {
  if (!action) {
    return [
      { text: 'Review vendor advisories', done: false },
      { text: 'Apply patches or mitigations', done: false },
      { text: 'Notify security team', done: false },
    ];
  }

  // Split by common delimiters and create checklist
  const items: { text: string; done: boolean }[] = [];

  // Add main action
  items.push({ text: action, done: false });

  // Add contextual follow-up items based on action content
  const actionLower = action.toLowerCase();
  if (actionLower.includes('patch') || actionLower.includes('update')) {
    items.push({ text: 'Verify patch deployment across all affected systems', done: false });
  }
  if (actionLower.includes('discontinue')) {
    items.push({ text: 'Identify alternative solutions', done: false });
  }
  items.push({ text: 'Document remediation actions taken', done: false });
  items.push({ text: 'Notify CISO of remediation status', done: false });

  return items.slice(0, 5);
}

export default function IncidentRoom({ ranks, posture, threatPressure, activeCve, geminiThreatPct, geminiReasoning, geminiAnalyzing, onClose }: IncidentRoomProps) {
  const displayThreat = geminiThreatPct ?? activeCve?.threatPct ?? threatPressure;
  const incidentTitle = activeCve ? `${activeCve.cveId} — ${activeCve.name}` : "ZERO-DAY API";

  return (
    <div className="modal-ov" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <div className="modal-h">
          <div className="modal-t" style={{fontSize: activeCve ? 14 : 16}}>⬡ INCIDENT ROOM — {incidentTitle}</div>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>

        {/* CVE Details Section */}
        {activeCve && (
          <div style={{background:"rgba(247,37,133,.06)",border:"1px solid rgba(247,37,133,.2)",
            borderRadius:6,padding:12,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div>
                <div style={{fontFamily:"var(--fm)",fontSize:14,color:"var(--cyan)",marginBottom:2}}>{activeCve.cveId}</div>
                <div style={{fontFamily:"var(--fh)",fontSize:15,fontWeight:700,color:"#fff"}}>{activeCve.name}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"var(--fh)",fontSize:22,fontWeight:900,color:"var(--pink)"}}>{geminiThreatPct ?? activeCve.threatPct}%</div>
                <div style={{fontFamily:"var(--fm)",fontSize:12,color:"var(--dim)"}}>THREAT LEVEL</div>
              </div>
            </div>
            <div style={{fontSize:14,color:"var(--text)",lineHeight:1.5,marginBottom:10}}>{activeCve.description}</div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <div style={{fontSize:12,color:"var(--dim)"}}>CVSS: <span style={{color:"var(--pink)",fontWeight:700}}>{activeCve.cvssScore}</span></div>
              <div style={{fontSize:12,color:"var(--dim)"}}>Vendor: <span style={{color:"var(--text)"}}>{activeCve.affectedVendor}</span></div>
              <div style={{fontSize:12,color:"var(--dim)"}}>Product: <span style={{color:"var(--text)"}}>{activeCve.affectedProduct}</span></div>
              {activeCve.dueDate && <div style={{fontSize:12,color:"var(--dim)"}}>CISA Due: <span style={{color:"#ff9f1c"}}>{activeCve.dueDate}</span></div>}
            </div>
          </div>
        )}

        <div className="modal-grid">
          {[
            ["Threat Pressure",`${Math.round(displayThreat)}%`],
            ["Stack Posture",posture.hand],
            ["Posture Score",`${posture.score}/100`],
            ["Active Incidents",MOCK_INCIDENTS.filter((i: MockIncident)=>i.status==="Active"||i.status==="Investigating").length],
          ].map(([l,v])=>(
            <div key={l} className="modal-card">
              <div className="mc-l">{l}</div>
              <div className="mc-v" style={{color:l==="Threat Pressure"?"var(--pink)":l==="Stack Posture"?posture.royal?"var(--gold)":"var(--cyan)":"#fff"}}>{v}</div>
            </div>
          ))}
        </div>

        <div className="modal-sect-t">Attack Surface</div>
        <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
          {deriveAttackSurface(activeCve).map(t=>(
            <span key={t.label} className="pill" style={{color:t.color,
              borderColor:"currentColor",background:"rgba(255,255,255,.04)",padding:"3px 10px",fontSize:12}}>{t.label}</span>
          ))}
        </div>

        <div className="modal-sect-t">Containment Checklist</div>
        {parseRequiredAction(activeCve?.requiredAction).map((item, idx)=>(
          <div key={idx} className="action-item" style={{color:item.done?"var(--green)":"var(--text)"}}>
            <span>{item.done?"✓":"○"}</span>{item.text}
          </div>
        ))}

        <div className="modal-sect-t">Pillar Response Levels</div>
        {(Object.entries(SUITS) as [string, SuitConfig][]).map(([k,cfg])=>(
          <div key={k} style={{display:"flex",alignItems:"center",gap:10,padding:"5px 0",
            borderBottom:"1px solid rgba(0,212,255,.05)"}}>
            <span style={{color:cfg.color,fontSize:15,width:22}}>{cfg.sym}</span>
            <span style={{fontFamily:"var(--fb)",fontSize:14,fontWeight:600,width:76}}>{cfg.name}</span>
            <div style={{flex:1}} className="ptrack">
              <div className="pfill" style={{width:`${(ranks[k]/13)*100}%`,
                background:`linear-gradient(90deg,${cfg.color},${cfg.color}88)`}}/>
            </div>
            <span style={{fontFamily:"var(--fh)",fontSize:14,fontWeight:900,color:cfg.color,width:26,textAlign:"right"}}>
              {RANK_NAMES[ranks[k]]}
            </span>
          </div>
        ))}

        {/* Magician Analysis Section */}
        <div className="modal-sect-t" style={{marginTop:14}}>Magician Analysis</div>
        {geminiAnalyzing ? (
          <div style={{background:"rgba(0,212,255,.06)",border:"1px solid rgba(0,212,255,.2)",
            borderRadius:6,padding:14}}>
            <div className="ai-scan">
              <div className="ai-ldot" style={{width:5,height:5,borderRadius:"50%",background:"var(--cyan)",animation:"tdot 1s ease-in-out infinite"}}/>
              THE MAGICIAN IS ANALYZING THREAT AGAINST YOUR ORGANIZATION...
            </div>
          </div>
        ) : geminiReasoning ? (
          <div style={{background:"rgba(0,212,255,.06)",border:"1px solid rgba(0,212,255,.2)",
            borderRadius:6,padding:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <span style={{fontSize:18}}>🔮</span>
              <div>
                <div style={{fontFamily:"var(--fh)",fontSize:15,fontWeight:700,color:"var(--cyan)"}}>
                  Organization Threat Level: {geminiThreatPct}%
                </div>
                <div style={{fontFamily:"var(--fm)",fontSize:12,color:"var(--dim)",letterSpacing:1}}>
                  THE MAGICIAN'S ASSESSMENT
                </div>
              </div>
            </div>
            <div style={{fontSize:14,color:"var(--text)",lineHeight:1.6,whiteSpace:"pre-wrap"}}>
              {geminiReasoning}
            </div>
          </div>
        ) : (
          <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",
            borderRadius:6,padding:14,textAlign:"center"}}>
            <div style={{fontSize:14,color:"var(--dim)"}}>
              Import an organization profile to enable AI threat analysis
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
