import { useState, useEffect, useCallback, useMemo } from 'react';
import { SuitCard } from '../components/SuitCard';
import { SuitDashboard } from '../components/SuitDashboard';
import { JokerCardSVG } from '../components/JokerCardSVG';
import { Onboarding } from '../components/layout/Onboarding';
import { IncidentRoom } from '../components/layout/IncidentRoom';
import { MagicianReading } from '../components/layout/MagicianReading';
import { FiveYearPlan } from '../components/layout/FiveYearPlan';
import { PostureExplainer } from '../components/layout/PostureExplainer';
import { AnalyzeIntro } from '../components/layout/AnalyzeIntro';
import { AlertsFeed } from '../components/layout/AlertsFeed';
import { IntegrationsPanel } from '../components/layout/IntegrationsPanel';
import { computePosture, computeOptimalHand } from '../engine/computePosture';
import { fetchCisaKevData } from '../data/cisaKev';
import { analyzeCveThreat, analyzeSuitDomain, analyzeMagicianReading } from '../services/geminiPosture';
import { SUITS } from '../data/gameData';
import type { SOCDashboardProps } from '../interfaces/SOCDashboardProps.interface';
import type { ScoredCve } from '../interfaces/ScoredCve.interface';
import type { AiAnalysis } from '../interfaces/SuitDashboardProps.interface';
import '../styles/counterstack.css';

export function SOCDashboard({
  onboarded,
  onOnboarded,
  orgProfile,
  accountData,
  initialRanks,
  onModeChange,
  isTutorial,
}: SOCDashboardProps) {
  // Core state
  const [ranks, setRanks] = useState(initialRanks);
  const [prevPostureHand, setPrevPostureHand] = useState<string | null>(null);
  const [postureAnimate, setPostureAnimate] = useState(false);
  const [activeSuit, setActiveSuit] = useState<string | null>(null);
  const [flippingSuits, setFlippingSuits] = useState<Record<string, boolean>>({});

  // Panel visibility
  const [showIR, setShowIR] = useState(false);
  const [showPostureExplainer, setShowPostureExplainer] = useState(false);
  const [showMagicianReading, setShowMagicianReading] = useState(false);
  const [showFiveYearPlan, setShowFiveYearPlan] = useState(false);
  const [showAnalyzeIntro, setShowAnalyzeIntro] = useState(false);

  // CVE state
  const [cveList, setCveList] = useState<ScoredCve[]>([]);
  const [activeCve, setActiveCve] = useState<ScoredCve | null>(null);
  const [cveLoading, setCveLoading] = useState(true);
  const [jokerFlipped, setJokerFlipped] = useState(false);
  const [cveSearchInput, setCveSearchInput] = useState('');
  const [showCveInput, setShowCveInput] = useState(false);

  // Gemini state
  const [geminiThreatPct, setGeminiThreatPct] = useState<number | null>(null);
  const [geminiReasoning, setGeminiReasoning] = useState('');
  const [geminiAnalyzing, setGeminiAnalyzing] = useState(false);
  const [suitAnalysisCache, setSuitAnalysisCache] = useState<Record<string, AiAnalysis>>({});

  // Magician reading state
  const [magicianSummary, setMagicianSummary] = useState('');
  const [magicianStrengths, setMagicianStrengths] = useState<string[]>([]);
  const [magicianWeaknesses, setMagicianWeaknesses] = useState<string[]>([]);
  const [magicianLoading, setMagicianLoading] = useState(false);

  // Mock live data
  const [time, setTime] = useState('');
  const [jiraUnresolved, setJiraUnresolved] = useState(24);
  const [jiraInProgress, setJiraInProgress] = useState(11);
  const [portPcts, setPortPcts] = useState([42, 18, 12, 8, 7, 7, 6]);

  // Sync ranks when initialRanks changes
  useEffect(() => {
    setRanks(initialRanks);
  }, [initialRanks]);

  // Show analyze intro after onboarding
  useEffect(() => {
    if (onboarded && orgProfile) setShowAnalyzeIntro(true);
  }, [onboarded, orgProfile]);

  // Clock tick
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toTimeString().split(' ')[0]);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Jira mock updates
  useEffect(() => {
    const id = setInterval(() => {
      setJiraUnresolved(v => v + Math.floor(Math.random() * 3) - 1);
      setJiraInProgress(v => Math.max(0, v + Math.floor(Math.random() * 3) - 1));
    }, 30000);
    return () => clearInterval(id);
  }, []);

  // Port percentages update
  useEffect(() => {
    const id = setInterval(() => {
      setPortPcts(prev => {
        const next = [...prev];
        const i = Math.floor(Math.random() * next.length);
        const j = (i + 1 + Math.floor(Math.random() * (next.length - 1))) % next.length;
        const delta = Math.floor(Math.random() * 4) + 1;
        next[i] = Math.max(1, next[i] - delta);
        next[j] = Math.min(40, next[j] + delta);
        return next;
      });
    }, 10000);
    return () => clearInterval(id);
  }, []);

  // CISA KEV fetch on mount
  useEffect(() => {
    setCveLoading(true);
    fetchCisaKevData(50)
      .then(cves => {
        setCveList(cves);
        if (cves.length > 0) setActiveCve(cves[0]);
      })
      .finally(() => setCveLoading(false));
  }, []);

  // Gemini CVE threat analysis
  useEffect(() => {
    if (!activeCve || !orgProfile) {
      setGeminiThreatPct(null);
      setGeminiReasoning('');
      return;
    }
    setGeminiAnalyzing(true);
    analyzeCveThreat(activeCve, orgProfile)
      .then(result => {
        setGeminiThreatPct(result.threatPct);
        setGeminiReasoning(result.reasoning);
      })
      .catch(() => {
        setGeminiThreatPct(activeCve.threatScore);
        setGeminiReasoning('');
      })
      .finally(() => setGeminiAnalyzing(false));
    // Clear suit cache when active CVE changes
    setSuitAnalysisCache({});
  }, [activeCve?.cveId, orgProfile]);

  // Posture upgrade detection
  const posture = computePosture(ranks);
  const optimalHand = computeOptimalHand(ranks);
  const avgRank = Object.values(ranks).reduce((a, b) => a + b, 0) / 4;
  const threatPressure = Math.max(18, 92 - (avgRank - 5) * 6);

  useEffect(() => {
    if (prevPostureHand && prevPostureHand !== posture.hand) {
      setPostureAnimate(true);
      setTimeout(() => setPostureAnimate(false), 1000);
    }
    setPrevPostureHand(posture.hand);
  }, [posture.hand]);

  // CVE search results (memoized)
  const cveSearchResults = useMemo(() => {
    if (!cveSearchInput.trim()) return cveList.slice(0, 8);
    const q = cveSearchInput.toLowerCase();
    return cveList
      .filter(c => c.cveId.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [cveSearchInput, cveList]);

  // Handlers
  const handleSuitClick = useCallback((suitKey: string) => {
    setFlippingSuits(prev => ({ ...prev, [suitKey]: true }));
    setTimeout(() => {
      setActiveSuit(prev => prev === suitKey ? null : suitKey);
      setFlippingSuits(prev => ({ ...prev, [suitKey]: false }));
      setShowMagicianReading(false);
      setShowFiveYearPlan(false);
      setShowPostureExplainer(false);
      setShowAnalyzeIntro(false);
    }, 150);
  }, []);

  const handleRequestSuitAnalysis = useCallback((suitKey: string) => {
    if (!orgProfile || suitAnalysisCache[suitKey]?.recommendations?.length) return;
    setSuitAnalysisCache(prev => ({
      ...prev,
      [suitKey]: { loading: true, recommendations: [], reasoning: '' } satisfies AiAnalysis,
    }));
    const cfg = SUITS[suitKey];
    analyzeSuitDomain(
      { suitKey, suitName: cfg.name, currentRank: ranks[suitKey], activeCve },
      orgProfile
    )
      .then(result => {
        setSuitAnalysisCache(prev => ({
          ...prev,
          [suitKey]: { loading: false, recommendations: result.recommendations, reasoning: result.reasoning } satisfies AiAnalysis,
        }));
      })
      .catch(() => {
        setSuitAnalysisCache(prev => ({
          ...prev,
          [suitKey]: { loading: false, recommendations: [], reasoning: 'Analysis unavailable' } satisfies AiAnalysis,
        }));
      });
  }, [orgProfile, ranks, activeCve, suitAnalysisCache]);

  const handleMagicianRequest = useCallback(() => {
    if (!orgProfile) return;
    setMagicianLoading(true);
    analyzeMagicianReading(orgProfile, ranks)
      .then(result => {
        setMagicianSummary(result.summary);
        setMagicianStrengths(result.strengths);
        setMagicianWeaknesses(result.weaknesses);
      })
      .catch(() => {})
      .finally(() => setMagicianLoading(false));
  }, [orgProfile, ranks]);

  const threatPct = geminiThreatPct ?? activeCve?.threatScore ?? 50;
  const threatColor = threatPct > 80 ? '#f72585' : threatPct > 60 ? '#ff9f1c' : threatPct > 40 ? '#ffd700' : '#a78bfa';

  const TIER_LABELS: Record<string, string> = {
    dealers: "DEALER'S HOUSE",
    underground: 'UNDERGROUND TABLE',
    convention: 'CONVENTION FLOOR',
  };
  const TIER_COLORS: Record<string, string> = {
    dealers: '#6b7280',
    underground: '#ffd700',
    convention: '#00d4ff',
  };

  return (
    <>
      {/* Background effects */}
      <div className="gridbg" />
      <div className="scanlines" />
      <div className="noise" />

      {/* Onboarding overlay */}
      {!onboarded && (
        <Onboarding onDone={onOnboarded} />
      )}

      <div className="app" style={{ opacity: onboarded ? 1 : 0.3, transition: 'opacity 0.3s' }}>
        {/* TOP BAR */}
        <div className="topbar">
          {/* Left: logo + posture */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontFamily: 'var(--fh)', fontSize: 14, color: '#00d4ff', letterSpacing: '0.15em' }}>
              ⬡ COUNTERSTACK
            </div>
            {accountData && (
              <div style={{
                fontSize: 9, fontFamily: 'var(--fh)',
                color: TIER_COLORS[accountData.tier] || '#6b7280',
                border: `1px solid ${TIER_COLORS[accountData.tier] || '#6b7280'}44`,
                borderRadius: 3, padding: '1px 5px', letterSpacing: '0.08em',
              }}>
                {TIER_LABELS[accountData.tier]}
              </div>
            )}
            <button
              onClick={() => { setShowPostureExplainer(true); setActiveSuit(null); setShowMagicianReading(false); setShowFiveYearPlan(false); setShowAnalyzeIntro(false); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span style={{ fontSize: 9, color: 'var(--dim)', letterSpacing: '0.08em' }}>POSTURE</span>
              <span
                style={{
                  fontFamily: 'var(--fh)', fontSize: 12, color: '#ffd700',
                  ...(postureAnimate ? { animation: 'posture-upgrade 1s ease' } : {}),
                }}
              >
                {posture.hand}
              </span>
              <span style={{ fontFamily: 'var(--fh)', fontSize: 11, color: '#00d4ff' }}>
                {posture.score}/100
              </span>
            </button>
          </div>

          {/* Center: mode toggle */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {(['soc', 'simulation'] as const).map(m => (
              <button
                key={m}
                onClick={() => onModeChange(m)}
                style={{
                  fontFamily: 'var(--fh)', fontSize: 10, letterSpacing: '0.1em',
                  padding: '4px 14px', borderRadius: 4, cursor: 'pointer',
                  background: m === 'soc' ? '#00d4ff22' : 'none',
                  border: `1px solid ${m === 'soc' ? '#00d4ff66' : 'rgba(255,255,255,0.12)'}`,
                  color: m === 'soc' ? '#00d4ff' : 'var(--dim)',
                }}
              >
                {m === 'soc' ? '◉ ANALYZE' : '○ SIMULATE'}
              </button>
            ))}
          </div>

          {/* Right: status + clock + IR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#39d353', display: 'inline-block' }} />
              <span style={{ color: '#39d353', fontFamily: 'var(--fh)', fontSize: 9 }}>SOC ONLINE</span>
            </div>
            <div style={{ fontSize: 9, color: '#ff9f1c', animation: 'threatFlash 2s infinite' }}>1 CRITICAL ACTIVE</div>
            <div style={{ fontFamily: 'var(--fh)', fontSize: 11, color: 'var(--dim)', letterSpacing: '0.08em' }}>{time}</div>
            <button
              onClick={() => setShowIR(true)}
              style={{
                background: '#f7258511', border: '1px solid #f7258533',
                color: '#f72585', fontFamily: 'var(--fh)', fontSize: 9,
                padding: '4px 10px', borderRadius: 4, cursor: 'pointer', letterSpacing: '0.08em',
              }}
            >
              ⬡ INCIDENT ROOM
            </button>
          </div>
        </div>

        {/* LEFT COLUMN */}
        <div className="left-col">
          {accountData?.tier === 'convention' && accountData.integrations.length > 0 ? (
            <IntegrationsPanel />
          ) : (
            <div className="panel" style={{ height: '100%' }}>
              <div className="panel-header">⬡ JIRA METRICS</div>
              <div style={{ fontSize: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <div style={{ color: 'var(--dim)', marginBottom: 2 }}>Unresolved Tickets</div>
                  <div style={{ fontFamily: 'var(--fh)', fontSize: 16, color: '#ff9f1c' }}>{jiraUnresolved}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--dim)', marginBottom: 2 }}>In Progress</div>
                  <div style={{ fontFamily: 'var(--fh)', fontSize: 16, color: '#39d353' }}>{jiraInProgress}</div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ color: 'var(--dim)', fontSize: 9, letterSpacing: '0.08em', marginBottom: 6 }}>PORT TRAFFIC</div>
                  {[443, 80, 22, 3389, 8080, 8443, 53].map((port, i) => (
                    <div key={port} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: 'var(--dim)', fontSize: 9 }}>:{port}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 60, height: 3, background: '#1a2332', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${portPcts[i]}%`, background: '#00d4ff', borderRadius: 2, transition: 'width 0.5s' }} />
                        </div>
                        <span style={{ fontSize: 9, color: '#00d4ff', fontFamily: 'var(--fh)', width: 28, textAlign: 'right' }}>{portPcts[i]}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <AlertsFeed />
              </div>
            </div>
          )}
        </div>

        {/* CENTER HUB */}
        <div className="hub panel">
          {/* Ring decorations */}
          <div className="hub-ring-outer" />
          <div className="hub-ring-mid" />
          <div className="hub-ring-inner" />

          {/* Suit cards */}
          {Object.entries(SUITS).map(([key, cfg]) => (
            <div key={key} className={`suit-slot ${cfg.pos}`}>
              <div className="suit-label" style={{ color: cfg.color }}>{cfg.name}</div>
              <SuitCard
                suitKey={key}
                cfg={cfg}
                rank={ranks[key] || 7}
                active={activeSuit === key}
                dimmed={activeSuit !== null && activeSuit !== key}
                flipping={flippingSuits[key] || false}
                onClick={() => handleSuitClick(key)}
              />
            </div>
          ))}

          {/* Joker center */}
          <div className="joker-container">
            {jokerFlipped && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  onClick={() => {
                    if (cveList.length > 0) setActiveCve(cveList[Math.floor(Math.random() * cveList.length)]);
                  }}
                  style={{ background: '#a78bfa11', border: '1px solid #a78bfa33', color: '#a78bfa', fontSize: 9, fontFamily: 'var(--fh)', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}
                >
                  ⇄ SHUFFLE
                </button>
                <button
                  onClick={() => setShowCveInput(v => !v)}
                  style={{ background: '#00d4ff11', border: '1px solid #00d4ff33', color: '#00d4ff', fontSize: 9, fontFamily: 'var(--fh)', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}
                >
                  ⊕ SELECT
                </button>
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <JokerCardSVG
                threatPct={threatPct}
                flipped={jokerFlipped}
                onClick={() => setJokerFlipped(v => !v)}
              />
              <div style={{
                marginTop: 4, textAlign: 'center', fontSize: 9,
                color: threatColor, fontFamily: 'var(--fh)',
                animation: threatPct > 80 ? 'threatFlash 0.8s infinite' : undefined,
              }}>
                {threatPct}% THREAT
              </div>

              {/* CVE search dropdown */}
              {showCveInput && jokerFlipped && (
                <div style={{
                  position: 'absolute', top: '110%', left: '50%', transform: 'translateX(-50%)',
                  width: 240, background: '#0d1117', border: '1px solid rgba(0,212,255,0.2)',
                  borderRadius: 8, padding: 8, zIndex: 50,
                }}>
                  <input
                    autoFocus
                    value={cveSearchInput}
                    onChange={e => setCveSearchInput(e.target.value)}
                    placeholder="Search CVE ID or name..."
                    style={{
                      width: '100%', background: '#060a0f', border: '1px solid rgba(0,212,255,0.2)',
                      color: '#cdd9e5', fontSize: 11, padding: '6px 8px', borderRadius: 4, outline: 'none',
                      fontFamily: 'var(--fm)',
                    }}
                  />
                  <div style={{ marginTop: 6, maxHeight: 160, overflowY: 'auto' }}>
                    {cveSearchResults.map(cve => (
                      <button
                        key={cve.cveId}
                        onClick={() => { setActiveCve(cve); setShowCveInput(false); setCveSearchInput(''); }}
                        style={{
                          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                          padding: '4px 6px', textAlign: 'left', borderRadius: 4,
                          display: 'flex', flexDirection: 'column', gap: 1,
                        }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(0,212,255,0.05)')}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}
                      >
                        <div style={{ fontSize: 10, color: '#00d4ff', fontFamily: 'var(--fh)' }}>{cve.cveId}</div>
                        <div style={{ fontSize: 9, color: 'var(--dim)' }}>{cve.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {jokerFlipped && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 9, color: 'var(--dim)', textAlign: 'center' }}>
                  {geminiAnalyzing ? '⟳' : cveList.length > 0 ? `${cveList.length} CVEs` : cveLoading ? 'Loading...' : 'No CVEs'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="right-col">
          {/* Joker Analysis panel */}
          <div className="panel" style={{ borderColor: `${threatColor}22` }}>
            <div className="panel-header" style={{ color: threatColor }}>⬡ JOKER ANALYSIS</div>
            {activeCve ? (
              <div>
                <div style={{ fontFamily: 'var(--fh)', fontSize: 11, color: '#cdd9e5', marginBottom: 4 }}>{activeCve.cveId}</div>
                <div style={{ fontSize: 10, color: 'var(--dim)', marginBottom: 8 }}>{activeCve.name}</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <div style={{ background: `${threatColor}11`, border: `1px solid ${threatColor}33`, borderRadius: 4, padding: '3px 7px', fontSize: 9, color: threatColor, fontFamily: 'var(--fh)' }}>
                    CVSS {activeCve.cvssScore.toFixed(1)}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--dim)' }}>{activeCve.affectedVendor}</div>
                </div>
                <div style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 3 }}>
                    <span style={{ color: 'var(--dim)' }}>ORG EXPOSURE</span>
                    <span style={{ color: threatColor, fontFamily: 'var(--fh)' }}>{threatPct}%</span>
                  </div>
                  <div style={{ height: 4, background: '#1a2332', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${threatPct}%`, background: threatColor, borderRadius: 2, transition: 'width 0.5s' }} />
                  </div>
                </div>
                {geminiReasoning && (
                  <div style={{ fontSize: 10, color: 'var(--dim)', fontStyle: 'italic', borderLeft: '2px solid #a78bfa', paddingLeft: 6 }}>
                    {geminiReasoning.split('.')[0]}.
                  </div>
                )}
                {activeCve.knownRansomware && (
                  <div style={{ marginTop: 6, fontSize: 9, color: '#f72585' }}>⚠ KNOWN RANSOMWARE</div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 10, color: 'var(--dim)' }}>
                {cveLoading ? '⟳ Loading CVEs...' : 'Click Joker to select a CVE'}
              </div>
            )}
          </div>

          {/* Magician's Reading trigger */}
          <div className="panel" style={{ borderColor: '#a78bfa22' }}>
            <div className="panel-header" style={{ color: '#a78bfa' }}>✨ MAGICIAN'S READING</div>
            <div style={{ fontSize: 10, color: 'var(--dim)', marginBottom: 8 }}>
              {accountData ? `${accountData.orgName} · ${accountData.tier}` : 'Guest Mode'}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => { setShowMagicianReading(true); setActiveSuit(null); setShowFiveYearPlan(false); setShowPostureExplainer(false); setShowAnalyzeIntro(false); }}
                disabled={!orgProfile}
                style={{
                  flex: 1, background: orgProfile ? '#a78bfa11' : 'none',
                  border: `1px solid ${orgProfile ? '#a78bfa44' : 'rgba(255,255,255,0.06)'}`,
                  color: orgProfile ? '#a78bfa' : '#4b5563', fontFamily: 'var(--fh)', fontSize: 9,
                  padding: '5px', borderRadius: 4, cursor: orgProfile ? 'pointer' : 'not-allowed', letterSpacing: '0.06em',
                }}
              >
                READING
              </button>
              <button
                onClick={() => { setShowFiveYearPlan(true); setActiveSuit(null); setShowMagicianReading(false); setShowPostureExplainer(false); setShowAnalyzeIntro(false); }}
                style={{
                  flex: 1, background: '#ffd70011', border: '1px solid #ffd70033',
                  color: '#ffd700', fontFamily: 'var(--fh)', fontSize: 9,
                  padding: '5px', borderRadius: 4, cursor: 'pointer', letterSpacing: '0.06em',
                }}
              >
                5-YEAR PLAN
              </button>
            </div>
          </div>

          {/* Active right panel */}
          {activeSuit && (
            <SuitDashboard
              suitKey={activeSuit}
              cfg={SUITS[activeSuit]}
              rank={ranks[activeSuit]}
              onClose={() => setActiveSuit(null)}
              allRanks={ranks}
              aiAnalysis={suitAnalysisCache[activeSuit]}
              onRequestAnalysis={() => handleRequestSuitAnalysis(activeSuit)}
              hasOrgProfile={!!orgProfile}
            />
          )}
          {showMagicianReading && (
            <MagicianReading
              summary={magicianSummary}
              strengths={magicianStrengths}
              weaknesses={magicianWeaknesses}
              loading={magicianLoading}
              onClose={() => setShowMagicianReading(false)}
              onRequest={handleMagicianRequest}
              hasOrgProfile={!!orgProfile}
            />
          )}
          {showFiveYearPlan && (
            <FiveYearPlan
              ranks={ranks}
              targetRanks={optimalHand.targetRanks}
              currentHand={posture.hand}
              targetHand={optimalHand.targetHand}
              currentScore={posture.score}
              targetScore={optimalHand.targetScore}
              orgName={accountData?.orgName}
              industry={accountData?.industry}
              onClose={() => setShowFiveYearPlan(false)}
            />
          )}
          {showPostureExplainer && (
            <PostureExplainer onClose={() => setShowPostureExplainer(false)} />
          )}
          {showAnalyzeIntro && !activeSuit && !showMagicianReading && !showFiveYearPlan && !showPostureExplainer && (
            <AnalyzeIntro
              orgName={accountData?.orgName}
              hand={posture.hand}
              score={posture.score}
              onClose={() => setShowAnalyzeIntro(false)}
            />
          )}
        </div>
      </div>

      {/* Incident Room modal */}
      {showIR && activeCve && (
        <IncidentRoom
          cve={activeCve}
          threatPct={geminiThreatPct}
          reasoning={geminiReasoning}
          onClose={() => setShowIR(false)}
        />
      )}

      {/* Threat pressure ambient animation */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 2,
        background: `radial-gradient(ellipse at center, rgba(247,37,133,${(threatPressure / 100) * 0.04}) 0%, transparent 70%)`,
        transition: 'background 2s',
      }} />
    </>
  );
}
