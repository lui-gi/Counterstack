import type { IncidentRoomProps } from '../../interfaces/IncidentRoomProps.interface';

const ANALYSIS_ROWS: { key: 'geminiExposure' | 'geminiControls' | 'geminiVerdict'; label: string }[] = [
  { key: 'geminiExposure', label: 'Exposure' },
  { key: 'geminiControls', label: 'Controls' },
  { key: 'geminiVerdict',  label: 'Verdict'  },
];

export default function IncidentRoom({ posture, activeCve, geminiThreatPct, geminiSummary, geminiExposure, geminiControls, geminiVerdict, geminiAnalyzing, geminiAttackVectors, geminiRemediationSteps, onClose }: IncidentRoomProps) {
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

        {/* CVE Details */}
        {activeCve && (
          <div style={{background:"rgba(247,37,133,.06)",border:"1px solid rgba(247,37,133,.2)",
            borderRadius:6,padding:12,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontFamily:"var(--fm)",fontSize:14,color:"var(--cyan)",marginBottom:2}}>{activeCve.cveId}</div>
                <div style={{fontFamily:"var(--fh)",fontSize:15,fontWeight:700,color:"#fff"}}>{activeCve.name}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:8}}>
              <div style={{fontSize:12,color:"var(--dim)"}}>CVSS: <span style={{color:"var(--pink)",fontWeight:700}}>{activeCve.cvssScore}</span></div>
              <div style={{fontSize:12,color:"var(--dim)"}}>Vendor: <span style={{color:"var(--text)"}}>{activeCve.affectedVendor}</span></div>
              <div style={{fontSize:12,color:"var(--dim)"}}>Product: <span style={{color:"var(--text)"}}>{activeCve.affectedProduct}</span></div>
              {activeCve.dueDate && <div style={{fontSize:12,color:"var(--dim)"}}>CISA Due: <span style={{color:"#ff9f1c"}}>{activeCve.dueDate}</span></div>}
            </div>
          </div>
        )}

        {/* Magician Analysis */}
        {geminiAnalyzing ? (
          <div style={{background:"rgba(0,212,255,.06)",border:"1px solid rgba(0,212,255,.2)",
            borderRadius:6,padding:14,marginBottom:14}}>
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
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16}}>🔮</span>
                <span style={{fontFamily:"var(--fm)",fontSize:12,color:"var(--cyan)",letterSpacing:2}}>THE MAGICIAN'S ASSESSMENT</span>
              </div>
              <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                <span style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--dim)",letterSpacing:1.5,textTransform:"uppercase"}}>Threat Level</span>
                <span style={{fontFamily:"var(--fh)",fontSize:20,fontWeight:900,color:"var(--pink)"}}>{geminiThreatPct}%</span>
              </div>
            </div>
            <div style={{borderTop:"1px solid rgba(0,212,255,.12)",paddingTop:10,display:"flex",flexDirection:"column",gap:12}}>
              {geminiSummary && (
                <div style={{fontSize:14,color:"var(--text)",lineHeight:1.6,paddingBottom:4,borderBottom:"1px solid rgba(0,212,255,.08)"}}>
                  {geminiSummary}
                </div>
              )}
              {ANALYSIS_ROWS.map(({key, label})=>(
                <div key={key} style={key === 'geminiVerdict' ? {
                  borderLeft:"2px solid var(--pink)",
                  paddingLeft:10,
                } : undefined}>
                  <div style={{fontFamily:"var(--fm)",fontSize:11,letterSpacing:1.5,color:"var(--dim)",textTransform:"uppercase",marginBottom:4}}>{label}</div>
                  <div style={{
                    fontSize:14,
                    color: key === 'geminiVerdict' ? '#fff' : "var(--text)",
                    lineHeight:1.6,
                  }}>{analysisValues[key]}</div>
                </div>
              ))}
            </div>
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

        {/* Threat Containment Checklist */}
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
                <div key={idx} className="action-item" style={{color:"var(--text)",display:"flex",alignItems:"flex-start",gap:8}}>
                  <span style={{flexShrink:0,marginTop:1}}>○</span><span>{step}</span>
                </div>
              ))
            )}
          </>
        )}

      </div>
    </div>
  );
}
