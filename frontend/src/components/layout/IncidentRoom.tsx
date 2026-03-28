import type { IncidentRoomProps } from '../../interfaces/IncidentRoomProps.interface';
import JokerCardSVG from '../JokerCardSVG';

const ANALYSIS_ROWS: { key: 'geminiExposure' | 'geminiControls' | 'geminiVerdict'; label: string }[] = [
  { key: 'geminiExposure', label: 'Exposure' },
  { key: 'geminiControls', label: 'Controls' },
  { key: 'geminiVerdict',  label: 'Verdict'  },
];

const rowLabel = (text: string) => (
  <div style={{fontFamily:"var(--fm)",fontSize:11,letterSpacing:1.5,color:"var(--dim)",textTransform:"uppercase",marginBottom:5}}>
    {text}
  </div>
);

const skeletonBar = (width = '85%') => (
  <div style={{height:13,borderRadius:3,background:"rgba(255,255,255,.06)",width,animation:"tdot 1.4s ease-in-out infinite"}}/>
);

export default function IncidentRoom({ posture, activeCve, geminiThreatPct, geminiSummary, geminiExposure, geminiControls, geminiVerdict, geminiAnalyzing, geminiAttackVectors, geminiRemediationSteps, onClose }: IncidentRoomProps) {
  const incidentTitle = activeCve ? `${activeCve.cveId} — ${activeCve.name}` : "ZERO-DAY API";
  const hasAnalysis = !!(geminiExposure || geminiControls || geminiVerdict);
  const analysisValues: Record<string, string> = { geminiExposure: geminiExposure ?? '', geminiControls: geminiControls ?? '', geminiVerdict: geminiVerdict ?? '' };

  return (
    <div className="ir-overlay" onClick={onClose}>

      {/* Floating Joker card — left of panel */}
      <div className="sd-floating-card" onClick={e=>e.stopPropagation()}>
        <div className="sd-panel-card" style={{borderRadius:13,overflow:'hidden'}}>
          <JokerCardSVG style={{width:132,height:186,borderRadius:13}} />
        </div>
      </div>

      <div className="ir-panel" onClick={e=>e.stopPropagation()}>

        {/* Sticky header */}
        <div className="modal-h" style={{marginBottom:18}}>
          <div className="modal-t" style={{fontSize: activeCve ? 14 : 16}}>⬡ INCIDENT ROOM — {incidentTitle}</div>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>

        {/* CVE Details */}
        {activeCve && (
          <div style={{background:"rgba(247,37,133,.06)",border:"1px solid rgba(247,37,133,.2)",
            borderRadius:6,padding:18,marginBottom:16}}>
            <div style={{marginBottom:12}}>
              <div style={{fontFamily:"var(--fm)",fontSize:13,color:"var(--cyan)",marginBottom:3}}>{activeCve.cveId}</div>
              <div style={{fontFamily:"var(--fh)",fontSize:16,fontWeight:700,color:"#fff",lineHeight:1.3}}>{activeCve.name}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 24px"}}>
              <div style={{fontSize:12,color:"var(--dim)"}}>CVSS <span style={{color:"var(--pink)",fontWeight:700,fontSize:14}}>{activeCve.cvssScore}</span></div>
              <div style={{fontSize:12,color:"var(--dim)"}}>Vendor: <span style={{color:"var(--text)"}}>{activeCve.affectedVendor}</span></div>
              <div style={{fontSize:12,color:"var(--dim)"}}>Product: <span style={{color:"var(--text)"}}>{activeCve.affectedProduct}</span></div>
              {activeCve.dueDate && (
                <div style={{fontSize:12,color:"var(--dim)"}}>CISA Due: <span style={{color:"#ff9f1c"}}>{activeCve.dueDate}</span></div>
              )}
            </div>
          </div>
        )}

        {/* Magician Analysis */}
        {geminiAnalyzing ? (
          <div style={{background:"rgba(0,212,255,.06)",border:"1px solid rgba(0,212,255,.2)",
            borderRadius:6,padding:18,marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16}}>🔮</span>
                <span style={{fontFamily:"var(--fm)",fontSize:12,color:"var(--cyan)",letterSpacing:2}}>THE MAGICIAN'S ASSESSMENT</span>
              </div>
              <div className="ai-scan" style={{margin:0}}>
                <div className="ai-ldot" style={{width:5,height:5,borderRadius:"50%",background:"var(--green)",animation:"tdot 1s ease-in-out infinite"}}/>
                <span style={{fontSize:11}}>ANALYZING...</span>
              </div>
            </div>
            <div style={{borderTop:"1px solid rgba(0,212,255,.12)",paddingTop:12,display:"flex",flexDirection:"column",gap:16}}>
              {/* Summary skeleton */}
              <div>
                {skeletonBar('100%')}
                <div style={{marginTop:5}}>{skeletonBar('65%')}</div>
              </div>
              {ANALYSIS_ROWS.map(({label})=>(
                <div key={label}>
                  {rowLabel(label)}
                  {skeletonBar()}
                </div>
              ))}
            </div>
          </div>
        ) : hasAnalysis ? (
          <div style={{background:"rgba(0,212,255,.06)",border:"1px solid rgba(0,212,255,.2)",
            borderRadius:6,padding:18,marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16}}>🔮</span>
                <span style={{fontFamily:"var(--fm)",fontSize:12,color:"var(--cyan)",letterSpacing:2}}>THE MAGICIAN'S ASSESSMENT</span>
              </div>
              <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                <span style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--dim)",letterSpacing:1.5,textTransform:"uppercase"}}>Threat Level</span>
                <span style={{fontFamily:"var(--fh)",fontSize:20,fontWeight:900,color:"var(--pink)"}}>{geminiThreatPct}%</span>
              </div>
            </div>
            <div style={{borderTop:"1px solid rgba(0,212,255,.12)",paddingTop:12,display:"flex",flexDirection:"column",gap:16}}>
              {geminiSummary && (
                <div style={{fontSize:14,color:"var(--text)",lineHeight:1.7,paddingBottom:12,borderBottom:"1px solid rgba(0,212,255,.08)"}}>
                  {geminiSummary}
                </div>
              )}
              {ANALYSIS_ROWS.map(({key, label})=>(
                <div key={key} style={key === 'geminiVerdict' ? {
                  borderLeft:"2px solid var(--pink)",
                  paddingLeft:12,
                } : undefined}>
                  {rowLabel(label)}
                  <div style={{
                    fontSize:14,
                    color: key === 'geminiVerdict' ? '#fff' : "var(--text)",
                    lineHeight:1.7,
                  }}>{analysisValues[key]}</div>
                </div>
              ))}
              {geminiAttackVectors && geminiAttackVectors.length > 0 && (
                <div style={{borderTop:"1px solid rgba(0,212,255,.12)",paddingTop:12}}>
                  {rowLabel('Attack Surface')}
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:2}}>
                    {geminiAttackVectors.map(v=>(
                      <span key={v} className="pill" style={{color:"var(--pink)",
                        borderColor:"currentColor",background:"rgba(255,255,255,.04)",padding:"3px 10px",fontSize:12}}>{v}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",
            borderRadius:6,padding:18,textAlign:"center",marginBottom:16}}>
            <div style={{fontSize:14,color:"var(--dim)"}}>
              Import an organization profile to enable AI threat analysis
            </div>
          </div>
        )}

        {/* Threat Containment Checklist */}
        {(geminiAnalyzing || (geminiRemediationSteps && geminiRemediationSteps.length > 0)) && (
          <div style={{marginTop:4}}>
            <div className="modal-sect-t">Threat Containment Checklist</div>
            {geminiAnalyzing ? (
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
                {[1,2,3].map(i=>(
                  <div key={i} className="action-item" style={{color:"var(--dim)",opacity:0.4}}>
                    <span style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--cyan)",flexShrink:0,minWidth:20}}>0{i}</span>
                    <span style={{background:"rgba(255,255,255,.06)",borderRadius:3,minWidth:180,display:"inline-block"}}>&nbsp;</span>
                  </div>
                ))}
              </div>
            ) : (
              geminiRemediationSteps!.map((step, idx)=>(
                <div key={idx} className="action-item" style={{color:"var(--text)",display:"flex",alignItems:"flex-start",gap:10}}>
                  <span style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--cyan)",flexShrink:0,minWidth:20,marginTop:1}}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span>{step}</span>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}

