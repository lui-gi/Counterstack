import { useState, useEffect, useCallback, useMemo } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShuffle, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import '../styles/counterstack.css';
import { SUITS, INIT_RANKS, RANK_NAMES } from '../data/gameData';
import { computePosture, computeOptimalHand } from '../engine/computePosture';
import { fetchCisaKevData } from '../data/cisaKev';
import { scoreAllCves, shuffleCve, DEFAULT_ORG_PROFILE } from '../engine/cveScorer';
import { analyzeCveThreat, analyzeSuitDomain } from '../services/geminiPosture';
import type { ScoredCve } from '../interfaces/ScoredCve.interface';
import type { SuitAnalysisCache } from '../interfaces/SuitDashboardProps.interface';
import FiveYearPlan from '../components/layout/FiveYearPlan';
import SuitCard from '../components/SuitCard';
import SuitDashboard from '../components/SuitDashboard';
import Onboarding from '../components/layout/Onboarding';
import IncidentRoom from '../components/layout/IncidentRoom';
import PostureExplainer from '../components/layout/PostureExplainer';
import MagicianReading from '../components/layout/MagicianReading';
import IntegrationsPanel from '../components/layout/IntegrationsPanel';
import AnalyzeIntro from '../components/layout/AnalyzeIntro';
import CardArt from '../components/CardArt';
import { MOCK_SPLUNK_DATA, MOCK_CROWDSTRIKE_DATA } from '../data/integrationMockData';

import type { SOCDashboardProps } from '../interfaces/SOCDashboardProps.interface';
import JokerCardSVG from '../components/JokerCardSVG';

// Map CWE IDs to human-readable attack surface tags

function extractOrgSummary(profile: Record<string, unknown>) {
  const keys = Object.keys(profile);

  const NIST_FUNCTIONS = ['identify', 'protect', 'detect', 'respond', 'recover'];
  const detectedFunctions = NIST_FUNCTIONS.filter(fn =>
    keys.some(k => k.toLowerCase().includes(fn))
  );

  function countLeaves(obj: unknown, depth = 0): number {
    if (depth > 5 || typeof obj !== 'object' || obj === null) return 1;
    const vals = Object.values(obj as Record<string, unknown>);
    if (vals.length === 0) return 1;
    return vals.reduce((sum: number, v) => sum + countLeaves(v, depth + 1), 0);
  }

  return {
    totalSections: keys.length,
    detectedFunctions,
    controlsCount: Math.min(countLeaves(profile), 9999),
  };
}


// Tier display info
const TIER_INFO: Record<string, { name: string; icon: string; color: string }> = {
  'dealers': { name: "Dealer's House", icon: '🎲', color: 'var(--cyan)' },
  'underground': { name: 'Underground Table', icon: '🎰', color: 'var(--gold)' },
  'convention': { name: 'Convention Floor', icon: '🏛️', color: 'var(--pink)' },
};

export default function SOCDashboard({ onboarded, onOnboarded, mode, onModeChange, orgProfile, accountData }: SOCDashboardProps) {
  const [ranks, setRanks] = useState(INIT_RANKS);
  const [prevPostureHand, setPrevPostureHand] = useState<string | null>(null);
  const [postureAnimate, setPostureAnimate] = useState(false);
  const [activeSuit, setActiveSuit] = useState<string | null>(null);
  const [flippingSuits, _setFlippingSuits] = useState<Record<string, boolean>>({});
  const [showIR, setShowIR] = useState(false);
  const [showPostureExplainer, setShowPostureExplainer] = useState(false);
  const [showMagicianReading, setShowMagicianReading] = useState(false);
  const [selectedHandCards, setSelectedHandCards] = useState<string[]>([]);
  const [showFiveYearPlan, setShowFiveYearPlan] = useState(false);
  const [showAnalyzeIntro, setShowAnalyzeIntro] = useState(false);

  function toggleHandCard(key: string) {
    setSelectedHandCards(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }
  const [time, setTime] = useState(new Date().toLocaleTimeString("en-US",{hour12:false}));

  // CVE/Joker state
  const [cveList, setCveList] = useState<ScoredCve[]>([]);
  const [activeCve, setActiveCve] = useState<ScoredCve | null>(null);
  const [cveLoading, setCveLoading] = useState(true);
  const [jokerFlipped, setJokerFlipped] = useState(false);
  const [cveSearchInput, setCveSearchInput] = useState('');
  const [showCveInput, setShowCveInput] = useState(false);

  // Gemini threat analysis state
  const [geminiThreatPct, setGeminiThreatPct] = useState<number | null>(null);
  const [geminiExposure, setGeminiExposure] = useState<string>('');
  const [geminiControls, setGeminiControls] = useState<string>('');
  const [geminiVerdict, setGeminiVerdict] = useState<string>('');
  const [geminiAnalyzing, setGeminiAnalyzing] = useState(false);
  const [geminiAttackVectors, setGeminiAttackVectors] = useState<string[]>([]);
  const [geminiRemediationSteps, setGeminiRemediationSteps] = useState<string[]>([]);

  // Gemini suit analysis cache (lazy loaded per suit)
  const [suitAnalysisCache, setSuitAnalysisCache] = useState<Record<string, SuitAnalysisCache>>({});
  const [hoveredPort, setHoveredPort] = useState<string|null>(null);
  const [jiraUnresolved, setJiraUnresolved] = useState(24);
  const [jiraInProgress, setJiraInProgress] = useState(11);
  const [portPcts, setPortPcts] = useState([31,19,16,12,10,7,5]);
  const [updatedPortIdxs, setUpdatedPortIdxs] = useState<number[]>([]);

  useEffect(()=>{
    const id = setInterval(()=>{
      const events = ["new_ticket","less_in_progress","more_in_progress","less_unresolved"];
      const ev = events[Math.floor(Math.random()*events.length)];
      if(ev==="new_ticket")         setJiraUnresolved(n=>n+1);
      if(ev==="less_in_progress")   setJiraInProgress(n=>Math.max(0,n-1));
      if(ev==="more_in_progress")   setJiraInProgress(n=>n+1);
      if(ev==="less_unresolved")    setJiraUnresolved(n=>Math.max(0,n-1));
    },30000);
    return ()=>clearInterval(id);
  },[]);

  useEffect(()=>{
    const id = setInterval(()=>{
      const len=7;
      const a=Math.floor(Math.random()*len);
      let b=Math.floor(Math.random()*(len-1));
      if(b>=a) b++;
      setPortPcts(prev=>{
        const next=[...prev];
        const delta=Math.floor(Math.random()*4)+1;
        next[a]=Math.max(1,next[a]-delta);
        next[b]=next[b]+delta;
        const total=next.reduce((s,v)=>s+v,0);
        const norm=next.map(v=>Math.max(1,Math.round(v/total*100)));
        const diff=100-norm.reduce((s,v)=>s+v,0);
        norm[0]+=diff;
        return norm;
      });
      setUpdatedPortIdxs([a,b]);
      setTimeout(()=>setUpdatedPortIdxs([]),3000);
    },10000);
    return ()=>clearInterval(id);
  },[]);


  // Fetch live CISA KEV data on mount
  useEffect(() => {
    let mounted = true;
    setCveLoading(true);

    fetchCisaKevData(50).then((kevData) => {
      if (!mounted) return;
      const scored = scoreAllCves(kevData, DEFAULT_ORG_PROFILE);
      setCveList(scored);
      if (scored.length > 0) {
        setActiveCve(scored[0]);
      }
      setCveLoading(false);
    });

    return () => { mounted = false; };
  }, []);

  // Call Gemini to analyze CVE threat when activeCve changes (only if orgProfile exists)
  useEffect(() => {
    if (!activeCve || !orgProfile) {
      setGeminiThreatPct(null);
      setGeminiExposure('');
      setGeminiControls('');
      setGeminiVerdict('');
      setGeminiAttackVectors([]);
      setGeminiRemediationSteps([]);
      return;
    }

    let mounted = true;
    setGeminiAnalyzing(true);

    analyzeCveThreat(
      {
        cveId: activeCve.cveId,
        name: activeCve.name,
        description: activeCve.description,
        cvssScore: activeCve.cvssScore,
        affectedVendor: activeCve.affectedVendor,
        affectedProduct: activeCve.affectedProduct,
      },
      orgProfile
    )
      .then((result) => {
        if (!mounted) return;
        setGeminiThreatPct(result.threatPct);
        setGeminiExposure(result.exposure ?? '');
        setGeminiControls(result.controls ?? '');
        setGeminiVerdict(result.verdict ?? '');
        setGeminiAttackVectors(result.attackVectors ?? []);
        setGeminiRemediationSteps(result.remediationSteps ?? []);
      })
      .catch((err) => {
        console.error('Gemini CVE analysis failed:', err);
        if (mounted) {
          setGeminiThreatPct(null);
          setGeminiExposure('');
          setGeminiControls('');
          setGeminiVerdict('');
          setGeminiAttackVectors([]);
          setGeminiRemediationSteps([]);
        }
      })
      .finally(() => {
        if (mounted) setGeminiAnalyzing(false);
      });

    return () => { mounted = false; };
  }, [activeCve, orgProfile]);

  // Shuffle handler
  const handleShuffleCve = useCallback(() => {
    const randomCve = shuffleCve(cveList);
    if (randomCve) {
      setActiveCve(randomCve);
      // Clear suit analysis cache when CVE changes so recommendations refresh
      setSuitAnalysisCache({});
    }
  }, [cveList]);

  // Request Gemini analysis for a specific suit (lazy loading)
  const handleRequestSuitAnalysis = useCallback((suitKey: string) => {
    if (!orgProfile || suitAnalysisCache[suitKey]) return;

    // Set loading state
    setSuitAnalysisCache(prev => ({
      ...prev,
      [suitKey]: { recommendations: [], reasoning: '', loading: true }
    }));

    const suitCfg = SUITS[suitKey];
    analyzeSuitDomain(
      {
        suitKey: suitKey as 'clover' | 'spade' | 'diamond' | 'heart',
        suitName: suitCfg.name,
        currentRank: ranks[suitKey],
        activeCve: activeCve ? {
          cveId: activeCve.cveId,
          name: activeCve.name,
          description: activeCve.description,
          cvssScore: activeCve.cvssScore,
          affectedVendor: activeCve.affectedVendor,
          affectedProduct: activeCve.affectedProduct,
        } : null,
      },
      orgProfile
    )
      .then((result) => {
        setSuitAnalysisCache(prev => ({
          ...prev,
          [suitKey]: {
            recommendations: result.recommendations,
            reasoning: result.reasoning,
            loading: false
          }
        }));
      })
      .catch((err) => {
        console.error(`Suit analysis failed for ${suitKey}:`, err);
        setSuitAnalysisCache(prev => ({
          ...prev,
          [suitKey]: { recommendations: [], reasoning: '', loading: false }
        }));
      });
  }, [orgProfile, suitAnalysisCache, ranks, activeCve]);


  useEffect(()=>{
    const t = setInterval(()=>setTime(new Date().toLocaleTimeString("en-US",{hour12:false})),1000);
    return ()=>clearInterval(t);
  },[]);

  const cveSearchResults = useMemo(() =>
    cveSearchInput.trim().length < 2
      ? []
      : cveList.filter(c =>
          c.cveId.toLowerCase().includes(cveSearchInput.toLowerCase()) ||
          c.name.toLowerCase().includes(cveSearchInput.toLowerCase())
        ).slice(0, 8),
    [cveSearchInput, cveList]
  );

  const posture = computePosture(ranks);
  const optimalHand = computeOptimalHand(ranks);
  const avgRank = Object.values(ranks).reduce((a,b)=>a+b,0)/4;
  const threatPressure = Math.max(18, Math.round(92 - (avgRank-5)*6));
  const [animPressure, setAnimPressure] = useState(threatPressure);

  useEffect(()=>{
    const d = threatPressure - animPressure;
    if(Math.abs(d)<.4){ setAnimPressure(threatPressure); return; }
    const t = setTimeout(()=>setAnimPressure(p=>p+d*.12), 40);
    return ()=>clearTimeout(t);
  },[threatPressure, animPressure]);

  useEffect(()=>{
    if(prevPostureHand && prevPostureHand!==posture.hand){
      setPostureAnimate(true);
      setTimeout(()=>setPostureAnimate(false), 700);
    }
    setPrevPostureHand(posture.hand);
  },[posture.hand]);

  // Click outside to collapse Joker
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (jokerFlipped && !(e.target as Element).closest('.joker-container')) {
        setJokerFlipped(false);
        setShowCveInput(false);
        setCveSearchInput('');
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [jokerFlipped]);


  const handleOnboard = (initialRanks: Record<string, number>, profile?: Record<string, unknown>, account?: import('../interfaces').AccountData) => {
    setRanks(initialRanks);
    if (profile) setShowAnalyzeIntro(true);
    onOnboarded(initialRanks, profile, account);
  };


  return (
    <>
      <div className="noise"/><div className="scanlines"/><div className="gridbg"/><div className="ambience"/>

      {!onboarded && <Onboarding onDone={handleOnboard}/>}

      {onboarded && (
        <div className="app fade-in">

          {/* ── TOP BAR ── */}
          <div className="topbar" style={{display:'grid',gridTemplateColumns:'1fr auto 1fr'}}>
            {/* Left: logo + tier + posture (analyze mode) OR mode toggle (simulate mode) */}
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              {mode === 'simulation' ? (
                <div id="tour-mode-toggle" className="tb-mode-toggle">
                  <button
                    className={`tb-mode-btn ${mode === 'soc' ? 'active' : ''}`}
                    onClick={() => onModeChange('soc')}
                  >● ANALYZE</button>
                  <button
                    className={`tb-mode-btn ${mode === 'simulation' ? 'active' : ''}`}
                    onClick={() => onModeChange('simulation')}
                  >○ SIMULATE</button>
                </div>
              ) : (
                <>
                  <img src="/counterstack.ico" alt="CounterStack" style={{width:'24px',height:'24px'}} />
                  {accountData?.tier && TIER_INFO[accountData.tier] && (
                    <span style={{
                      display:'flex',alignItems:'center',gap:5,
                      fontSize:11,fontFamily:'var(--fm)',letterSpacing:'.5px',
                      padding:'3px 8px',borderRadius:4,
                      background:`${TIER_INFO[accountData.tier].color}15`,
                      border:`1px solid ${TIER_INFO[accountData.tier].color}35`,
                      color:TIER_INFO[accountData.tier].color
                    }}>
                      <span>{TIER_INFO[accountData.tier].icon}</span>
                      {TIER_INFO[accountData.tier].name}
                    </span>
                  )}
                  <div style={{width:'1px',height:20,background:'rgba(180,79,255,0.2)'}}/>
                  <div className="tb-posture clickable" onClick={() => setShowPostureExplainer(true)}>
                    <span className="tb-posture-lbl">POSTURE</span>
                    <span className={`tb-posture-val ${posture.royal?"royal":""} ${postureAnimate?"posture-upgrade":""}`}>
                      {posture.hand}
                    </span>
                    <span className="tb-posture-score">{posture.score}</span>
                  </div>
                </>
              )}
            </div>

            {/* Center: SOC/SIMULATION toggle (analyze mode only) */}
            {mode === 'soc' && (
              <div id="tour-mode-toggle" className="tb-mode-toggle" style={{alignSelf:'center'}}>
                <button
                  className={`tb-mode-btn ${mode === 'soc' ? 'active' : ''}`}
                  onClick={() => onModeChange('soc')}
                >● ANALYZE</button>
                <button
                  className={`tb-mode-btn ${mode === 'simulation' ? 'active' : ''}`}
                  onClick={() => onModeChange('simulation')}
                >○ SIMULATE</button>
              </div>
            )}
            {mode === 'simulation' && <div />}

            {/* Right: stats + time + incident room */}
            <div className="tb-right" style={{justifyContent:'flex-end'}}>
              {mode === 'soc' && (
                <div className="tb-stat">
                  <div className="tb-dot" style={{background:"#39d353"}}/>SOC ONLINE
                </div>
              )}
              <div className="tb-stat">
                <div className="tb-dot" style={{background:"var(--pink)",animationDelay:".5s"}}/>
                <span style={{color:"var(--pink)"}}>1 CRITICAL ACTIVE</span>
              </div>
              <span className="tb-time">{time}</span>
              <button className="tb-btn" onClick={()=>setShowIR(true)}>⬡ THREAT ANALYSIS</button>
            </div>
          </div>

          {/* ── LEFT ── */}
          <div id="tour-integrations" className="left-col">
            {/* Connected Integrations (Convention Floor only) */}
            {accountData?.tier === 'convention' && accountData.integrations.length > 0 && (
              <IntegrationsPanel
                integrations={accountData.integrations}
                splunkData={accountData.integrations.includes('splunk') ? MOCK_SPLUNK_DATA : undefined}
                crowdstrikeData={accountData.integrations.includes('crowdstrike') ? MOCK_CROWDSTRIKE_DATA : undefined}
              />
            )}
          </div>

          {/* ── CENTER HUB ── */}
          <div id="tour-hub" className="hub panel">
            <div className="hub-ring-outer"/>
            <div className="hub-ring-mid"/>
            <div className="hub-ring-inner"/>
            <div className="hub-glow"/>

            {/* 4 suit slots */}
            {Object.entries(SUITS).map(([k,cfg])=>(
              <div key={k} className={`suit-slot ${cfg.pos}`}>
                {(cfg.pos==="top"||cfg.pos==="left"||cfg.pos==="right") && (
                  <div className="suit-slot-label" style={{color:activeSuit===k?cfg.color:undefined}}>{cfg.name}</div>
                )}
                <SuitCard
                  suitKey={k} cfg={cfg} rank={ranks[k]}
                  active={activeSuit===k}
                  dimmed={activeSuit!==null&&activeSuit!==k}
                  flipping={!!flippingSuits[k]}
                  onClick={()=>setActiveSuit(activeSuit===k?null:k)}
                />
                {cfg.pos==="bottom" && (
                  <div className="suit-slot-label" style={{color:activeSuit===k?cfg.color:undefined}}>{cfg.name}</div>
                )}
              </div>
            ))}

            {/* Joker center */}
            <div id="tour-joker" className={`joker-container${jokerFlipped ? ' expanded' : ''}`}>
              {/* Horizontal row: left-btn | card | right-btn */}
              <div className="joker-row">
                {/* Left button — SHUFFLE */}
                <button
                  className={`joker-side-btn joker-side-btn--left${jokerFlipped ? ' visible' : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleShuffleCve(); }}
                  disabled={cveLoading || cveList.length === 0}
                >
                  <FontAwesomeIcon icon={faShuffle} />
                  <span>SHUFFLE</span>
                </button>

                {/* The card itself */}
                <div
                  className={`joker-card-wrapper ${(geminiThreatPct ?? activeCve?.threatPct ?? animPressure) > 80 ? 'glitch' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setJokerFlipped(prev => !prev);
                    if (jokerFlipped) {
                      setShowCveInput(false);
                      setCveSearchInput('');
                    }
                  }}
                >
                  <div className={`joker-card-inner${jokerFlipped ? ' expanded' : ''} ${geminiAnalyzing ? 'analyzing' : ''}`}>
                    <div className="joker-face joker-face-front">
                      <JokerCardSVG style={{position:'absolute',inset:0,width:'100%',height:'100%',zIndex:0}}/>
                      <div className="jc-holo" style={{zIndex:1}}/>
                    </div>
                  </div>
                </div>

                {/* Right button — SELECT */}
                <button
                  className={`joker-side-btn joker-side-btn--right${jokerFlipped ? ' visible' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setShowCveInput(prev => !prev); }}
                >
                  <FontAwesomeIcon icon={faMagnifyingGlass} />
                  <span>SELECT</span>
                </button>

                {/* Search dropdown — absolutely positioned below card */}
                {showCveInput && (
                  <div className="cve-search-wrap">
                    <input
                      type="text"
                      className="cve-search-input"
                      placeholder="Search by name or CVE ID…"
                      value={cveSearchInput}
                      onChange={(e) => setCveSearchInput(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                    {cveSearchResults.length > 0 && (
                      <ul className="cve-search-results">
                        {cveSearchResults.map(c => (
                          <li
                            key={c.cveId}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCve(c);
                              setShowCveInput(false);
                              setCveSearchInput('');
                            }}
                          >
                            <span className="cve-result-id">{c.cveId}</span>
                            <span className="cve-result-name">{c.name}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {(() => {
                const tv = geminiThreatPct ?? activeCve?.threatPct ?? Math.round(animPressure);
                const t = tv / 100;
                // Color: lavender-white → neon red
                const cr = Math.round(255);
                const cg = Math.round(255 - 200 * t);
                const cb = Math.round(255 - 220 * t);
                const color = `rgb(${cr},${cg},${cb})`;
                const glow = t > 0.4 ? `0 0 ${Math.round(4 + 10 * t)}px rgba(210,${Math.round(60 - 40*t)},${Math.round(60 - 40*t)},${(0.25 + 0.4*t).toFixed(2)}),0 1px 4px rgba(0,0,0,0.8)` : '0 1px 4px rgba(0,0,0,0.8)';
                const dur = tv >= 80 ? 0.45 : tv >= 60 ? 1.0 : tv >= 35 ? 2.2 : null;
                return (
                  <div className="tp-label" style={{
                    color,
                    textShadow: glow,
                    animation: dur ? `threatFlash ${dur}s ease-in-out infinite` : 'none',
                  }}>
                    Threat Level: {geminiAnalyzing ? "..." : `${tv}%`}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="right-col">
            {/* Joker Analysis */}
            <div className="panel" style={{flexShrink:0}}>
              <div className="ptitle">Joker Analysis {orgProfile && <span style={{fontSize:12,color:"var(--cyan)",marginLeft:4}}>AI</span>}</div>
              <div className="ja-panel">
                <div className="ja-name">{activeCve?.cveId || "No CVE Selected"}</div>
                <div className="ja-subname">{activeCve?.name || ""}</div>
                <div className="pbar-wrap">
                  <div className="pbar-lbl">
                    <span>{orgProfile ? "ORG THREAT" : "THREAT"}</span>
                    <span>{geminiAnalyzing ? "..." : `${geminiThreatPct ?? activeCve?.threatPct ?? 0}%`}</span>
                  </div>
                  <div className="ptrack"><div className="pfill" style={{width:`${geminiThreatPct ?? activeCve?.threatPct ?? 0}%`,background:"linear-gradient(90deg,#f72585,#b5179e)",boxShadow:"0 0 6px rgba(247,37,133,.5)"}}/></div>
                </div>
                <div className="spread">CVSS: <span>{activeCve?.cvssScore ?? "N/A"}</span> | Risk: <span>{(geminiThreatPct ?? activeCve?.threatPct ?? 0) > 70 ? "High" : (geminiThreatPct ?? activeCve?.threatPct ?? 0) > 50 ? "Medium" : "Low"}</span></div>
                <div className="ja-vendor">{activeCve?.affectedVendor} — {activeCve?.affectedProduct}</div>
                {geminiReasoning && (
                  <div style={{marginTop:6,display:"flex",alignItems:"center",gap:6,fontSize:12,color:"var(--cyan)"}}>
                    <span>🔮</span>
                    <span style={{opacity:.7}}>AI analysis ready — open Threat Analysis for details</span>
                  </div>
                )}
                <button className="btn-ir" onClick={()=>setShowIR(true)}>⬡ OPEN THREAT ANALYSIS</button>
              </div>
            </div>

            {/* Magician's Reading */}
            <div id="tour-magician" className="panel" style={{flexShrink:0}}>
              <div className="ptitle" style={{display:'flex',alignItems:'center',gap:6}}><img src="/magician-icon.png" style={{height:16,objectFit:'contain',flexShrink:0}} />Magician's Reading</div>
              {!orgProfile ? (
                <div style={{padding:'14px 12px',textAlign:'center'}}>
                  <div style={{fontSize:12,color:'rgba(205,217,229,0.22)',fontFamily:'var(--fm)',letterSpacing:'.5px',lineHeight:1.6,fontStyle:'italic'}}>
                    <span style={{display:'inline-flex',alignItems:'center',gap:4}}><img src="/magician-icon.png" style={{height:12,objectFit:'contain',flexShrink:0}} />Magician is missing Organization info</span>
                  </div>
                </div>
              ) : (()=>{
                const { totalSections, detectedFunctions, controlsCount } = extractOrgSummary(orgProfile);
                return (
                  <div className="cve-quick-panel">
                    {accountData?.orgName && (
                      <div className="cve-quick-row">
                        <span className="cve-quick-label">Org</span>
                        <span className="cve-quick-val">{accountData.orgName}</span>
                      </div>
                    )}
                    {accountData?.industry && (
                      <div className="cve-quick-row">
                        <span className="cve-quick-label">Industry</span>
                        <span className="cve-quick-val">{accountData.industry}</span>
                      </div>
                    )}
                    {accountData?.employeeCount && (
                      <div className="cve-quick-row">
                        <span className="cve-quick-label">Size</span>
                        <span className="cve-quick-val">{accountData.employeeCount}</span>
                      </div>
                    )}
                    {accountData?.infraType && (
                      <div className="cve-quick-row">
                        <span className="cve-quick-label">Infra</span>
                        <span className="cve-quick-val">{accountData.infraType}</span>
                      </div>
                    )}
                    <div className="cve-quick-row">
                      <span className="cve-quick-label">Sections</span>
                      <span className="cve-quick-val">{totalSections}</span>
                    </div>
                    <div className="cve-quick-row">
                      <span className="cve-quick-label">Controls</span>
                      <span className="cve-quick-val">{controlsCount}</span>
                    </div>
                    {detectedFunctions.length > 0 && (
                      <div className="cve-tags-row">
                        {detectedFunctions.map(fn => (
                          <span key={fn} className="cve-tag" style={{color:'var(--cyan)',borderColor:'rgba(0,212,255,0.35)'}}>
                            {fn.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    )}
                    <button className="btn-ir" style={{marginTop:10,width:'100%'}}
                      onClick={() => setShowMagicianReading(true)}>
                      VIEW MAGICIAN'S FULL READING
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Jira Ticketing */}
            <div className="panel" style={{padding:"10px 12px"}}>
              <div className="ptitle" style={{marginBottom:10}}>Jira Ticketing</div>
              <div style={{display:"flex",gap:8}}>
                <div style={{flex:1,padding:"10px 8px",background:"rgba(255,107,107,.06)",border:"1px solid rgba(255,107,107,.2)",borderRadius:6,textAlign:"center"}}>
                  <div style={{fontFamily:"var(--fh)",fontSize:28,fontWeight:900,color:"#ff6b6b",lineHeight:1,textShadow:"0 0 12px rgba(255,107,107,.5)"}}>{jiraUnresolved}</div>
                  <div style={{fontFamily:"var(--fm)",fontSize:10,letterSpacing:1.2,color:"rgba(255,107,107,.7)",marginTop:4}}>UNRESOLVED</div>
                </div>
                <div style={{flex:1,padding:"10px 8px",background:"rgba(255,159,67,.06)",border:"1px solid rgba(255,159,67,.2)",borderRadius:6,textAlign:"center"}}>
                  <div style={{fontFamily:"var(--fh)",fontSize:28,fontWeight:900,color:"#ff9f43",lineHeight:1,textShadow:"0 0 12px rgba(255,159,67,.5)"}}>{jiraInProgress}</div>
                  <div style={{fontFamily:"var(--fm)",fontSize:10,letterSpacing:1.2,color:"rgba(255,159,67,.7)",marginTop:4}}>IN PROGRESS</div>
                </div>
              </div>
            </div>

          </div>

          {/* ── BOTTOM ── */}
          <div className="bottom-row">
            {/* Azure Defender */}
            <div className="panel" style={{padding:"7px 11px"}}>
              <div className="ptitle" style={{padding:"0 0 5px",marginBottom:6}}>Azure Defender</div>
              {(()=>{
                const ports=[
                  {port:"HTTPS",label:"HTTPS (443)",pct:portPcts[0],color:"#00d4ff"},
                  {port:"HTTP",label:"HTTP (80)",pct:portPcts[1],color:"#a259ff"},
                  {port:"Ethernet/IP",label:"Ethernet/IP (44818)",pct:portPcts[2],color:"#4ecb71"},
                  {port:"ISO Transport",label:"ISO Transport (102)",pct:portPcts[3],color:"#ffd700"},
                  {port:"BACnet",label:"BACnet (47808)",pct:portPcts[4],color:"#ff9f43"},
                  {port:"Telnet",label:"Telnet (23)",pct:portPcts[5],color:"#ff6b6b"},
                  {port:"Other",label:"Other",pct:portPcts[6],color:"#888"},
                ];
                let offset=0;
                const r=34,cx=50,cy=50,circ=2*Math.PI*r;
                const hovered=ports.find(p=>p.port===hoveredPort)||null;
                return(
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                    <div style={{fontSize:11,fontFamily:"var(--fm)",letterSpacing:1.2,color:"rgba(0,212,255,.5)",alignSelf:"flex-start"}}>TRAFFIC BY PORT</div>
                    <svg width={110} height={110} viewBox="0 0 100 100" style={{overflow:"visible"}}>
                      {ports.map(p=>{
                        const dash=circ*(p.pct/100);
                        const gap=circ-dash;
                        const isHov=hoveredPort===p.port;
                        const el=(
                          <circle key={p.port}
                            cx={cx} cy={cy} r={r}
                            fill="none"
                            stroke={p.color}
                            strokeWidth={isHov?16:13}
                            strokeDasharray={`${dash} ${gap}`}
                            strokeDashoffset={-offset}
                            style={{transform:"rotate(-90deg)",transformOrigin:"50% 50%",filter:`drop-shadow(0 0 ${isHov?6:3}px ${p.color}${isHov?"cc":"88"})`,cursor:"pointer",transition:"stroke-width .15s,filter .15s"}}
                            onMouseEnter={()=>setHoveredPort(p.port)}
                            onMouseLeave={()=>setHoveredPort(null)}
                          />
                        );
                        offset+=dash;
                        return el;
                      })}
                      <circle cx={cx} cy={cy} r={26} fill="rgba(0,0,0,.6)"/>
                      {hovered?(
                        <>
                          <text x={cx} y={cy-5} textAnchor="middle" fill={hovered.color} fontSize={8} fontFamily="var(--fh)" fontWeight={700}>{hovered.port}</text>
                          <text x={cx} y={cy+7} textAnchor="middle" fill="#fff" fontSize={11} fontFamily="var(--fh)" fontWeight={900}>{hovered.pct}%</text>
                        </>
                      ):(
                        <>
                          <text x={cx} y={cy-4} textAnchor="middle" fill="#fff" fontSize={9} fontFamily="var(--fh)" fontWeight={700}>PORTS</text>
                          <text x={cx} y={cy+7} textAnchor="middle" fill="rgba(0,212,255,.7)" fontSize={7} fontFamily="var(--fm)">{ports.length} types</text>
                        </>
                      )}
                    </svg>
                    <div style={{display:"flex",flexDirection:"column",gap:3,width:"100%"}}>
                      {ports.map((p,i)=>(
                        <div key={p.port}
                          style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer",opacity:hoveredPort&&hoveredPort!==p.port?.5:1,transition:"opacity .15s"}}
                          onMouseEnter={()=>setHoveredPort(p.port)}
                          onMouseLeave={()=>setHoveredPort(null)}
                        >
                          <div style={{width:6,height:6,borderRadius:"50%",background:p.color,flexShrink:0,boxShadow:`0 0 4px ${p.color}`}}/>
                          <span style={{fontFamily:"var(--fm)",fontSize:11,color:"rgba(255,255,255,.7)",flex:1}}>{p.label}</span>
                          <span style={{fontFamily:"var(--fh)",fontSize:11,fontWeight:700,color:p.color}}>{p.pct}%</span>
                          {updatedPortIdxs.includes(i)&&<div style={{width:6,height:6,borderRadius:"50%",background:"#ff4444",flexShrink:0,boxShadow:"0 0 5px #ff4444"}}/>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Hand Tray */}
            {(()=>{
              const CARD_H = 92, CARD_W = Math.round(CARD_H * 5 / 7); // ~65px
              const suitEntries = Object.entries(SUITS) as [string, typeof SUITS[keyof typeof SUITS]][];
              const TIER_LADDER = [
                { label: 'HC', tier: 0 },
                { label: '1P', tier: 1 },
                { label: '2P', tier: 2 },
                { label: '3K', tier: 3 },
                { label: 'ST', tier: 4 },
                { label: '4K', tier: 6 },
                { label: 'RF', tier: 7 },
              ];
              const currentTierIdx = TIER_LADDER.findIndex(t => t.tier === posture.tier);
              return (
                <div id="tour-hand-tray" className="panel" style={{ padding: "10px 12px" }}>
                  <div className="ptitle" style={{ marginBottom: 8 }}>Hand</div>
                  {/* Content area: tier ladder absolutely on left, cards truly centered, DEAL HAND on right */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: CARD_H }}>
                    {/* Vertical tier ladder — left side */}
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
                      {TIER_LADDER.map((t, idx) => {
                        const isReached = idx <= currentTierIdx;
                        const isCurrent = idx === currentTierIdx;
                        return (
                          <div key={t.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <div style={{
                                width: isCurrent ? 9 : 6,
                                height: isCurrent ? 9 : 6,
                                borderRadius: '50%',
                                background: isReached ? 'var(--cyan)' : 'transparent',
                                border: isReached ? '1.5px solid var(--cyan)' : '1.5px solid rgba(205,217,229,.2)',
                                boxShadow: isCurrent ? '0 0 7px var(--cyan), 0 0 3px var(--cyan)' : 'none',
                                transition: 'all .2s',
                                flexShrink: 0,
                              }} />
                              <span style={{
                                fontFamily: 'var(--fm)', fontSize: 8, letterSpacing: 0.5,
                                color: isReached ? 'var(--cyan)' : 'rgba(205,217,229,.25)',
                                fontWeight: isCurrent ? 900 : 600,
                                lineHeight: 1,
                              }}>{t.label}</span>
                            </div>
                            {idx < TIER_LADDER.length - 1 && (
                              <div style={{
                                width: 1, height: 8, marginLeft: -14,
                                background: idx < currentTierIdx ? 'var(--cyan)' : 'rgba(205,217,229,.12)',
                                flexShrink: 0,
                              }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Cards centered across full panel width */}
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {suitEntries.map(([k, cfg]) => {
                        const isSelected = selectedHandCards.includes(k);
                        const targetRank = optimalHand.targetRanks[k];
                        const label = RANK_NAMES[targetRank];
                        return (
                          <div
                            key={k}
                            onClick={() => toggleHandCard(k)}
                            style={{
                              width: CARD_W, height: CARD_H,
                              cursor: 'pointer',
                              borderRadius: 8,
                              border: isSelected ? `1.5px solid ${cfg.color}99` : '1px dashed rgba(205,217,229,.14)',
                              background: isSelected ? `${cfg.color}18` : 'rgba(205,217,229,.025)',
                              boxShadow: isSelected ? `0 0 14px ${cfg.color}44, inset 0 0 8px ${cfg.color}0c` : 'none',
                              display: 'flex', flexDirection: 'column',
                              alignItems: 'center', justifyContent: 'space-between',
                              padding: '5px 3px',
                              transition: 'border .15s, background .15s, box-shadow .15s',
                              flexShrink: 0,
                            }}
                          >
                            {isSelected ? (
                              <>
                                <div style={{ fontSize: 10, fontFamily: 'var(--fh)', fontWeight: 900, color: cfg.color, lineHeight: 1, alignSelf: 'flex-start', paddingLeft: 1 }}>
                                  {label}
                                </div>
                                <div style={{ fontSize: 20, lineHeight: 1 }}>{cfg.sym}</div>
                                <div style={{ fontSize: 10, fontFamily: 'var(--fh)', fontWeight: 900, color: cfg.color, lineHeight: 1, alignSelf: 'flex-end', paddingRight: 1, transform: 'rotate(180deg)' }}>
                                  {label}
                                </div>
                              </>
                            ) : (
                              <div style={{ fontSize: 15, color: 'rgba(205,217,229,.10)', margin: 'auto' }}>+</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* DEAL HAND button — right side */}
                    {selectedHandCards.length > 0 && (
                      <>
                        {/* Arrow pointing toward DEAL HAND button */}
                        <div style={{
                          position: 'absolute',
                          right: 74,
                          top: '50%', transform: 'translateY(-50%)',
                          display: 'flex', alignItems: 'center',
                          pointerEvents: 'none',
                        }}>
                          <div style={{ width: 18, height: 1, background: 'rgba(0,212,255,.4)' }} />
                          <div style={{
                            width: 0, height: 0,
                            borderTop: '4px solid transparent',
                            borderBottom: '4px solid transparent',
                            borderLeft: '5px solid rgba(0,212,255,.5)',
                          }} />
                        </div>
                        <button
                          onClick={() => setShowFiveYearPlan(true)}
                          style={{
                            position: 'absolute', right: 0,
                            padding: '6px 22px',
                            background: 'rgba(0,212,255,.06)',
                            border: '1px solid rgba(0,212,255,.35)',
                            borderRadius: 5, cursor: 'pointer',
                            fontFamily: 'var(--fm)', fontSize: 10,
                            letterSpacing: 1.5, color: 'var(--cyan)',
                            fontWeight: 700, whiteSpace: 'nowrap',
                          }}
                        >
                          DEAL<br/>HAND
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Magician's Hand */}
            <div id="tour-magicians-hand" className="panel" style={{padding:"8px 10px", display:'flex', flexDirection:'column', gap:6, overflow:'hidden'}}>
              <div className="ptitle" style={{marginBottom:0, padding:'0 0 4px',display:'flex',alignItems:'center',gap:6}}><img src="/magician-icon.png" style={{height:16,objectFit:'contain',flexShrink:0}} />Magician's Hand</div>
              <div style={{fontFamily:"var(--fm)",fontSize:8,letterSpacing:1.5,color:"var(--dim)"}}>OPTIMAL TARGET HAND</div>
              <div style={{display:"flex",gap:4,justifyContent:"center", overflow:'hidden', padding:'2px 0 4px'}}>
                {(Object.entries(SUITS) as [string,typeof SUITS[keyof typeof SUITS]][]).map(([k,cfg])=>{
                  const targetRank = optimalHand.targetRanks[k];
                  const currentRank = ranks[k];
                  const diff = targetRank - currentRank;
                  const isSelected = selectedHandCards.includes(k);
                  return(
                    <div key={k}
                      onClick={() => toggleHandCard(k)}
                      className={`suit-card ${isSelected ? 'active' : ''}`}
                      style={{
                        width: 'auto', flex: 1, height: 62,
                        borderColor: `${cfg.color}${isSelected ? 'bb' : '44'}`,
                        background: '#050a10',
                        boxShadow: isSelected
                          ? `0 0 18px ${cfg.color}55, 0 0 36px ${cfg.color}22, inset 0 0 14px ${cfg.color}08`
                          : `0 0 8px ${cfg.color}22`,
                        color: cfg.color,
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{position:'absolute',inset:0,zIndex:0}}>
                        <CardArt suitKey={k} color={cfg.color} rank={targetRank} />
                      </div>
                      <div className="card-holo" style={{zIndex:1}} />
                      {diff > 0 && (
                        <div style={{
                          position:'absolute', bottom:2, right:3, zIndex:2,
                          fontSize:7, fontFamily:'var(--fm)', color:'#39d353',
                          textShadow:'0 0 6px #39d35388',
                          background:'rgba(0,0,0,0.65)', borderRadius:2, padding:'1px 2px',
                        }}>+{diff}</div>
                      )}
                      {diff === 0 && !optimalHand.isAlreadyOptimal && (
                        <div style={{
                          position:'absolute', bottom:2, right:3, zIndex:2,
                          fontSize:7, fontFamily:'var(--fm)', color:'var(--dim)',
                          background:'rgba(0,0,0,0.65)', borderRadius:2, padding:'1px 2px',
                        }}>✓</div>
                      )}
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => setSelectedHandCards(Object.keys(SUITS))}
                style={{
                  width: '100%', padding: '5px 8px',
                  background: 'rgba(0,212,255,.06)',
                  border: '1px solid rgba(0,212,255,.35)',
                  borderRadius: 5, cursor: 'pointer',
                  fontFamily: 'var(--fm)', fontSize: 11,
                  letterSpacing: 2, color: 'var(--cyan)',
                  fontWeight: 700, flexShrink: 0,
                }}
              >
                APPLY HAND
              </button>
            </div>

          </div>

          {/* ── SUIT DASHBOARD OVERLAY ── */}
          {activeSuit && (
            <SuitDashboard
              suitKey={activeSuit}
              cfg={SUITS[activeSuit]}
              rank={ranks[activeSuit]}
              allRanks={ranks}
              onClose={()=>setActiveSuit(null)}
              aiAnalysis={suitAnalysisCache[activeSuit] || null}
              onRequestAnalysis={() => handleRequestSuitAnalysis(activeSuit)}
              hasOrgProfile={!!orgProfile}
              orgProfile={orgProfile}
            />
          )}

          {/* ── ANALYZE INTRO ── */}
          {showAnalyzeIntro && (
            <AnalyzeIntro
              onClose={() => setShowAnalyzeIntro(false)}
              accountData={accountData}
            />
          )}

          {/* ── INCIDENT ROOM ── */}
          {showIR && (
            <IncidentRoom
              ranks={ranks}
              posture={posture}
              threatPressure={animPressure}
              activeCve={activeCve}
              geminiThreatPct={geminiThreatPct}
              geminiExposure={geminiExposure}
              geminiControls={geminiControls}
              geminiVerdict={geminiVerdict}
              geminiAnalyzing={geminiAnalyzing}
              geminiAttackVectors={geminiAttackVectors}
              geminiRemediationSteps={geminiRemediationSteps}
              onClose={()=>setShowIR(false)}
            />
          )}

          {/* ── POSTURE EXPLAINER ── */}
          {showPostureExplainer && (
            <PostureExplainer
              ranks={ranks}
              posture={posture}
              onClose={() => setShowPostureExplainer(false)}
            />
          )}

          {/* ── MAGICIAN'S FULL READING ── */}
          {showMagicianReading && orgProfile && (
            <MagicianReading
              orgProfile={orgProfile}
              ranks={ranks}
              accountData={accountData}
              posture={posture}
              onClose={() => setShowMagicianReading(false)}
            />
          )}

          {/* ── 5-YEAR ROADMAP ── */}
          {showFiveYearPlan && (
            <FiveYearPlan
              ranks={ranks}
              targetRanks={optimalHand.targetRanks}
              posture={posture}
              targetHand={optimalHand.targetHand}
              targetScore={optimalHand.targetScore}
              accountData={accountData}
              onClose={() => setShowFiveYearPlan(false)}
            />
          )}
        </div>
      )}
    </>
  );
}
