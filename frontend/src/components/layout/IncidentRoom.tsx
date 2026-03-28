import { SUITS, RANK_NAMES } from '../../data/gameData';
import type { SuitConfig } from '../../interfaces/SuitConfig.interface';
import type { IncidentRoomProps } from '../../interfaces/IncidentRoomProps.interface';

const ANALYSIS_ROWS: { key: 'geminiExposure' | 'geminiControls' | 'geminiVerdict'; label: string }[] = [
  { key: 'geminiExposure', label: 'Exposure' },
  { key: 'geminiControls', label: 'Controls' },
  { key: 'geminiVerdict',  label: 'Verdict'  },
];

export default function IncidentRoom({ ranks, posture, activeCve, geminiThreatPct, geminiExposure, geminiControls, geminiVerdict, geminiAnalyzing, geminiAttackVectors, geminiRemediationSteps, onClose }: IncidentRoomProps) {
  const incidentTitle = activeCve ? `${activeCve.cveId} — ${activeCve.name}` : "ZERO-DAY API";
  const hasAnalysis = !!(geminiExposure || geminiControls || geminiVerdict);
  const analysisValues: Record<string, string> = { geminiExposure: geminiExposure ?? '', geminiControls: geminiControls ?? '', geminiVerdict: geminiVerdict ?? '' };

  return (
    <div className="modal-ov" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <div className="modal-h">
          <div className="modal-t" style={{fontSize: activeCve ? 14 : 16}}>⬡ INCIDENT ROOM — {incidentTitle}</div>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>

        {/* Magician Analysis — top of modal */}
        {geminiAnalyzing ? (
          <div style={{background:"rgba(0,212,255,.06)",border:"1px solid rgba(0,212,255,.2)",
            borderRadius:6,padding:14,marginBottom:14}}>
            {/* Header row */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16}}>🔮</span>
                <span style={{fontFamily:"var(--fm)",fontSize:12,color:"var(--cyan)",letterSpacing:2}}>THE MAGICIAN'S ASSESSMENT</span>
              </div>
              <div className="ai-scan" style={{margin:0}}>
                <div className="ai-ldot" style={{width:5,height:5,borderRadius:"50%",background:"var(--green)",animation:"tdot 1s ease-in-out infinite"}}/>
                <span style={{fontSize:11}}>ANALYZING...</span>
              </div>
            </div>
            {/* Skeleton rows */}
            <div style={{borderTop:"1px solid rgba(0,212,255,.12)",paddingTop:10,display:"flex",flexDirection:"column",gap:12}}>
              {ANALYSIS_ROWS.map(({label})=>(
                <div key={label}>
                  <div style={{fontFamily:"var(--fm)",fontSize:11,letterSpacing:1.5,color:"var(--dim)",textTransform:"uppercase",marginBottom:4}}>{label}</div>
                  <div style={{height:13,borderRadius:3,background:"rgba(255,255,255,.06)",width:"85%",animation:"tdot 1.4s ease-in-out infinite"}}/>
                </div>
              ))}
            </div>
          </div>
        ) : hasAnalysis ? (
          <div style={{background:"rgba(0,212,255,.06)",border:"1px solid rgba(0,212,255,.2)",
            borderRadius:6,padding:14,marginBottom:14}}>
            {/* Header row */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16}}>🔮</span>
                <span style={{fontFamily:"var(--fm)",fontSize:12,color:"var(--cyan)",letterSpacing:2}}>THE MAGICIAN'S ASSESSMENT</span>
              </div>
              <div style={{fontFamily:"var(--fh)",fontSize:20,fontWeight:900,color:"var(--pink)"}}>{geminiThreatPct}%</div>
            </div>
            {/* Labeled analysis rows */}
            <div style={{borderTop:"1px solid rgba(0,212,255,.12)",paddingTop:10,display:"flex",flexDirection:"column",gap:12}}>
              {ANALYSIS_ROWS.map(({key, label})=>(
                <div key={key}>
                  <div style={{fontFamily:"var(--fm)",fontSize:11,letterSpacing:1.5,color:"var(--dim)",textTransform:"uppercase",marginBottom:4}}>{label}</div>
                  <div style={{fontSize:14,color:"var(--text)",lineHeight:1.6}}>{analysisValues[key]}</div>
                </div>
              ))}
            </div>
            {/* Attack vector pills */}
            {geminiAttackVectors && geminiAttackVectors.length > 0 && (
              <div style={{borderTop:"1px solid rgba(0,212,255,.12)",marginTop:12,paddingTop:10,display:"flex",gap:5,flexWrap:"wrap"}}>
                {geminiAttackVectors.map(v=>(
                  <span key={v} className="pill" style={{color:"var(--pink)",
                    borderColor:"currentColor",background:"rgba(255,255,255,.04)",padding:"3px 10px",fontSize:12}}>{v}</span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",
            borderRadius:6,padding:14,textAlign:"center",marginBottom:14}}>
            <div style={{fontSize:14,color:"var(--dim)"}}>
              Import an organization profile to enable AI threat analysis
            </div>
          </div>
        )}

        {/* Threat Containment Checklist — AI-generated */}
        {(geminiAnalyzing || (geminiRemediationSteps && geminiRemediationSteps.length > 0)) && (
          <>
            <div className="modal-sect-t">Threat Containment Checklist</div>
            {geminiAnalyzing ? (
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
                {[1,2,3].map(i=>(
                  <div key={i} className="action-item" style={{color:"var(--dim)",opacity:0.4}}>
                    <span>○</span><span style={{background:"rgba(255,255,255,.06)",borderRadius:3,minWidth:180,display:"inline-block"}}>&nbsp;</span>
                  </div>
                ))}
              </div>
            ) : (
              geminiRemediationSteps!.map((step, idx)=>(
                <div key={idx} className="action-item" style={{color:"var(--text)"}}>
                  <span>○</span>{step}
                </div>
              ))
            )}
          </>
        )}

        {/* CVE Details */}
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

        {/* Compact posture stats */}
        <div style={{display:"flex",gap:16,alignItems:"center",padding:"8px 0",marginBottom:12,borderBottom:"1px solid rgba(0,212,255,.08)"}}>
          <div style={{fontSize:12,color:"var(--dim)"}}>Stack Posture: <span style={{color:posture.royal?"var(--gold)":"var(--cyan)",fontWeight:700}}>{posture.hand}</span></div>
          <div style={{fontSize:12,color:"var(--dim)"}}>Score: <span style={{color:"#fff",fontWeight:700}}>{posture.score}/100</span></div>
        </div>

        {/* Pillar Response Levels */}
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
      </div>
    </div>
  );
}
