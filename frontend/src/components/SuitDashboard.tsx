import { useEffect } from 'react';
import { SUITS, SUIT_DATA, RANK_NAMES, RANK_FULL } from '../data/gameData';
import type { SuitConfig } from '../interfaces/SuitConfig.interface';
import type { SuitMetric } from '../interfaces/SuitMetric.interface';
import type { SuitRisk } from '../interfaces/SuitRisk.interface';
import type { SuitDashboardProps } from '../interfaces/SuitDashboardProps.interface';
import PostureChart from './PostureChart';

export default function SuitDashboard({ suitKey, cfg, rank, onClose, allRanks, aiAnalysis, onRequestAnalysis, hasOrgProfile }: SuitDashboardProps) {
  const data = SUIT_DATA[suitKey];
  const color = cfg.color;
  const pct = Math.round((rank/13)*100);
  const sevColor = { high:"#f72585", medium:"#ff9f1c", low:"#39d353" };

  // Trigger Gemini analysis when panel opens (lazy loading)
  useEffect(() => {
    if (hasOrgProfile && !aiAnalysis && onRequestAnalysis) {
      onRequestAnalysis();
    }
  }, [hasOrgProfile, aiAnalysis, onRequestAnalysis]);

  // Use Gemini recommendations if available, otherwise fall back to static
  const displayRecs = aiAnalysis?.recommendations?.length ? aiAnalysis.recommendations : data.aiRecs;
  const isAiLoading = aiAnalysis?.loading ?? false;
  const hasAiRecs = aiAnalysis?.recommendations?.length ? true : false;

  return (
    <div className="sd-overlay" onClick={onClose}>
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
            {data.metrics.map((m: SuitMetric)=>(
              <div key={m.k} className="sm-card" style={{borderColor:`${color}18`}}>
                <div className="sm-lbl">{m.k}</div>
                <div className="sm-val" style={{color}}>{m.v}</div>
                <div className="sm-trend" style={{color:m.trend>0?"var(--green)":m.trend<0?"var(--pink)":"var(--dim)"}}>
                  {m.trend>0?"▲":m.trend<0?"▼":"─"} {Math.abs(m.trend)}% vs prev week
                </div>
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
              displayRecs.map((r: string,i: number)=>(
                <div key={i} className="ai-item" style={{borderColor:`${color}10`}}>
                  <span className="ai-arr" style={{color}}>▶</span>{r}
                </div>
              ))
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
              {data.risks.map((r: SuitRisk)=>(
                <div key={r.n} className="risk-row" style={{background:`${sevColor[r.lvl as keyof typeof sevColor]}0a`,border:`1px solid ${sevColor[r.lvl as keyof typeof sevColor]}22`}}>
                  <div className="risk-dot" style={{background:sevColor[r.lvl as keyof typeof sevColor]}}/>
                  <span style={{flex:1,fontSize:13}}>{r.n}</span>
                  <span style={{fontSize:12,fontFamily:"var(--fm)",color:sevColor[r.lvl as keyof typeof sevColor],textTransform:"uppercase"}}>{r.lvl}</span>
                </div>
              ))}
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
