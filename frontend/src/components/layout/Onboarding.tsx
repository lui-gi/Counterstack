import { useState, useEffect, useCallback, useMemo, useRef, type ChangeEvent } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShuffle, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import '../../styles/counterstack.css';
import { SUITS, RANK_NAMES } from '../../data/gameData';
import CardArt from '../CardArt';
import type { SuitConfig } from '../../interfaces/SuitConfig.interface';
import { analyzeOrgProfile } from '../../services/geminiPosture';
import type { OnboardingProps } from '../../interfaces/OnboardingProps.interface';
import type { AccountData } from '../../interfaces/AccountData.interface';
import graysonProfile from '../../../public/data/grayson-and-co-org-profile.json';

const OB_STEPS = [
  { suit:"clover",  q:"How is your baseline security health?",    opts:["No visibility","Basic monitoring","Full SIEM deployed","AI-driven monitoring"]},
  { suit:"spade",   q:"What is your detection & response level?", opts:["Reactive only","Alert-based","Proactive hunting","Fully automated SOC"]},
  { suit:"heart",   q:"How robust is your recovery posture?",     opts:["No DR plan","Plan exists, untested","Tested annually","Continuous validation"]},
  { suit:"diamond", q:"How hardened is your access control?",     opts:["Perimeter only","MFA partial","Zero Trust in progress","Full Zero Trust + PAM"]},
];

// Landing cards configuration
const LANDING_CARDS = [
  { id: "guest", icon: "🎭", label: "Simulate as Guest", color: "rgba(170,80,255,0.95)" },
  { id: "create", icon: "✦", label: "Create Account",    color: "rgba(50,220,100,0.95)" },
  { id: "login", icon: "🔑", label: "Log In",            color: "rgba(195,150,30,0.95)" },
  { id: "joker", icon: "🃏", label: "Joker",             color: "#f72585" },
];

// Tier configuration
const TIERS = [
  { id: "dealers", icon: "🎲", name: "Dealer's House", color: "var(--cyan)",
    desc: "Personal devices & endpoint protection" },
  { id: "underground", icon: "🎰", name: "Underground Table", color: "var(--gold)",
    desc: "Small teams with servers & cloud" },
  { id: "convention", icon: "🏛️", name: "Convention Floor", color: "var(--pink)",
    desc: "Enterprise with security integrations" },
];

// Industry options for Convention Floor
const INDUSTRIES = [
  "Finance & Banking", "Healthcare", "Technology", "Government",
  "Energy & Utilities", "Retail & E-commerce", "Manufacturing", "Other"
];

// Employee count ranges
const EMPLOYEE_COUNTS = [
  "1-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+"
];

// Infrastructure types
const INFRA_TYPES = ["Cloud-Native", "On-Premise", "Hybrid"];

// Security integrations for Convention Floor
const INTEGRATIONS = {
  siem: [
    { id: "splunk", name: "Splunk" },
    { id: "sentinel", name: "Microsoft Sentinel" },
    { id: "elastic", name: "Elastic SIEM" },
  ],
  edr: [
    { id: "crowdstrike", name: "CrowdStrike" },
    { id: "sentinelone", name: "SentinelOne" },
    { id: "carbonblack", name: "Carbon Black" },
  ],
  cloud: [
    { id: "aws-hub", name: "AWS Security Hub" },
    { id: "azure-defender", name: "Azure Defender" },
    { id: "gcp-scc", name: "GCP Security Command" },
  ],
};

type CardState = "stacked" | "tilted" | "throwing" | "landed" | "video-dropping";
type WizardStep = "tier" | "account" | "org" | "integrations" | "confirm" | "posture-choice";

interface WizardData {
  tier: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  orgName: string;
  industry: string;
  employeeCount: string;
  infraType: string;
  integrations: string[];
}

export default function Onboarding({ onDone, videoTransition }: OnboardingProps) {
  // Freeze the initial videoTransition value — prop may flip to false once the video unmounts,
  // but the animation should keep playing based on what it started with.
  const [isVideoEntry] = useState(videoTransition ?? false);
  const [phase, setPhase] = useState("landing");
  const [cardStates, setCardStates] = useState<CardState[]>(
    isVideoEntry
      ? ["video-dropping", "video-dropping", "video-dropping", "video-dropping"]
      : ["stacked", "stacked", "stacked", "stacked"]
  );
  const [showTitle, setShowTitle] = useState(false);
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [cardPositions, setCardPositions] = useState<Record<string, boolean>>({});
  const [importError, setImportError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard state
  const [wizardStep, setWizardStep] = useState<WizardStep>("tier");
  const [wizardData, setWizardData] = useState<WizardData>({
    tier: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    orgName: "",
    industry: "",
    employeeCount: "",
    infraType: "",
    integrations: [],
  });

  // Wizard file input ref
  const wizardFileRef = useRef<HTMLInputElement>(null);
  const [wizardImportError, setWizardImportError] = useState<string | null>(null);
  const [wizardAnalyzing, setWizardAnalyzing] = useState(false);

  // Get wizard step number for progress indicator
  const getWizardStepNum = (): number => {
    const steps: WizardStep[] = wizardData.tier === "convention"
      ? ["tier", "account", "org", "integrations", "confirm", "posture-choice"]
      : ["tier", "account", "org", "confirm", "posture-choice"];
    return steps.indexOf(wizardStep);
  };

  const getTotalSteps = (): number => {
    return wizardData.tier === "convention" ? 6 : 5;
  };

  // Handle wizard field changes
  const updateWizardField = (field: keyof WizardData, value: string) => {
    setWizardData(prev => ({ ...prev, [field]: value }));
  };

  // Toggle integration selection
  const toggleIntegration = (id: string) => {
    setWizardData(prev => ({
      ...prev,
      integrations: prev.integrations.includes(id)
        ? prev.integrations.filter(i => i !== id)
        : [...prev.integrations, id]
    }));
  };

  // Validate current wizard step
  const canProceed = (): boolean => {
    switch (wizardStep) {
      case "tier":
        return wizardData.tier !== "";
      case "account":
        return wizardData.email !== "" &&
               wizardData.password !== "" &&
               wizardData.password === wizardData.confirmPassword &&
               wizardData.fullName !== "";
      case "org":
        if (wizardData.tier === "dealers") {
          return wizardData.orgName !== "";
        } else if (wizardData.tier === "underground") {
          return wizardData.orgName !== "";
        } else {
          return wizardData.orgName !== "" &&
                 wizardData.industry !== "" &&
                 wizardData.employeeCount !== "" &&
                 wizardData.infraType !== "";
        }
      case "integrations":
        return true; // Optional
      case "confirm":
        return true;
      default:
        return false;
    }
  };

  // Navigate wizard
  const nextStep = () => {
    const steps: WizardStep[] = wizardData.tier === "convention"
      ? ["tier", "account", "org", "integrations", "confirm", "posture-choice"]
      : ["tier", "account", "org", "confirm", "posture-choice"];
    const currentIdx = steps.indexOf(wizardStep);
    if (currentIdx < steps.length - 1) {
      setWizardStep(steps[currentIdx + 1]);
    }
  };

  const prevStep = () => {
    const steps: WizardStep[] = wizardData.tier === "convention"
      ? ["tier", "account", "org", "integrations", "confirm", "posture-choice"]
      : ["tier", "account", "org", "confirm", "posture-choice"];
    const currentIdx = steps.indexOf(wizardStep);
    if (currentIdx > 0) {
      setWizardStep(steps[currentIdx - 1]);
    }
  };

  // Track if user came from wizard (to pass account data after questionnaire)
  const [fromWizard, setFromWizard] = useState(false);

  // Track if user is in joker mode (bypass account creation)
  const [isJokerMode, setIsJokerMode] = useState(false);
  const [showJokerProfile, setShowJokerProfile] = useState(false);

  // Complete wizard with manual questionnaire
  const completeWithQuestionnaire = () => {
    setFromWizard(true); // Mark that we came from wizard
    setShowCreateModal(false);
    setWizardStep("tier");
    setPhase("questions");
    setQi(0);
  };

  // Joker mode: analyze pre-loaded Grayson and Co. profile and launch
  const handleJokerContinue = async () => {
    setWizardAnalyzing(true);
    setWizardImportError(null);
    try {
      const json = graysonProfile as unknown as Record<string, unknown>;
      const geminiResult = await analyzeOrgProfile(json);
      const ranks: Record<string, number> = {
        clover: geminiResult.clover,
        diamond: geminiResult.diamond,
        heart: geminiResult.heart,
        spade: geminiResult.spade,
      };
      const accountData = buildAccountData();
      setShowCreateModal(false);
      setWizardStep("tier");
      setWizardAnalyzing(false);
      launchSequence(ranks, json, accountData);
    } catch (err: unknown) {
      setWizardImportError(err instanceof Error ? err.message : "Failed to load NIST CSF profile.");
      setWizardAnalyzing(false);
    }
  };

  // Handle wizard file import
  const handleWizardImportClick = () => {
    setWizardImportError(null);
    wizardFileRef.current?.click();
  };

  const handleWizardFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    let json: Record<string, unknown>;
    try {
      const text = await file.text();
      json = JSON.parse(text);
    } catch {
      setWizardImportError("Invalid JSON file. Please select a valid NIST CSF profile.");
      return;
    }

    setWizardAnalyzing(true);
    setWizardImportError(null);

    try {
      const geminiResult = await analyzeOrgProfile(json);
      const ranks: Record<string, number> = {
        clover: geminiResult.clover,
        diamond: geminiResult.diamond,
        heart: geminiResult.heart,
        spade: geminiResult.spade,
      };
      // Close wizard and launch with analyzed ranks + account data
      const accountData = buildAccountData();
      setShowCreateModal(false);
      setWizardStep("tier");
      setWizardAnalyzing(false);
      launchSequence(ranks, json, accountData);
    } catch (err: unknown) {
      setWizardImportError(err instanceof Error ? err.message : "The Magician analysis failed.");
      setWizardAnalyzing(false);
    }
  };


  // Card throw animation on mount
  useEffect(() => {
    if (phase !== "landing") return;

    if (isVideoEntry) {
      // Video-transition mode:
      // Cards are already rendering as "video-dropping" (CSS handles the staggered drop-from-above).
      // We just need to chain each card's throw once its individual drop finishes.
      // CSS delays: card i starts dropping at i*65ms; animation is 440ms long.
      const timers: ReturnType<typeof setTimeout>[] = [];
      [0, 1, 2, 3].forEach(i => {
        const throwAt = i * 65 + 440 + 20; // drop delay + drop duration + tiny buffer
        timers.push(setTimeout(() => {
          setCardStates(prev => { const n = [...prev]; n[i] = "throwing"; return n; });
          timers.push(setTimeout(() => {
            setCardStates(prev => { const n = [...prev]; n[i] = "landed"; return n; });
            if (i === 3) timers.push(setTimeout(() => setShowTitle(true), 200));
          }, 700));
        }, throwAt));
      });
      return () => timers.forEach(clearTimeout);
    }

    // Normal (non-video) animation — brief pause, tilt deck, then throw
    const tiltTimer = setTimeout(() => {
      setCardStates(["tilted", "tilted", "tilted", "tilted"]);
      setTimeout(() => {
        [0, 1, 2, 3].forEach((i) => {
          setTimeout(() => {
            setCardStates(prev => {
              const next = [...prev];
              next[i] = "throwing";
              return next;
            });
            setTimeout(() => {
              setCardStates(prev => {
                const next = [...prev];
                next[i] = "landed";
                return next;
              });
              if (i === 3) setTimeout(() => setShowTitle(true), 300);
            }, 700);
          }, i * 100);
        });
      }, 200);
    }, 500);

    return () => clearTimeout(tiltTimer);
  }, [phase, isVideoEntry]);

  const posMap: Record<string, {x:number,y:number,rot:number}> = {
    clover:  {x:-180, y:-80, rot:-4},
    spade:   {x:-60,  y:-80, rot:-1},
    diamond: {x:60,   y:-80, rot:1},
    heart:   {x:180,  y:-80, rot:4},
  };

  // Build account data from wizard state
  const buildAccountData = (): AccountData => ({
    tier: wizardData.tier as AccountData['tier'],
    orgName: wizardData.orgName,
    industry: wizardData.industry || undefined,
    employeeCount: wizardData.employeeCount || undefined,
    infraType: wizardData.infraType || undefined,
    integrations: wizardData.integrations,
  });

  const launchSequence = (ranks: Record<string, number>, profile?: Record<string, unknown>, accountData?: AccountData, isTutorial?: boolean) => {
    setPhase("launching");
    Object.keys(SUITS).forEach((s,i)=>{
      setTimeout(()=>{
        setCardPositions(p=>({...p,[s]:true}));
      }, i*180+200);
    });
    setTimeout(()=>onDone(ranks, profile, accountData, isTutorial), 1800);
  };

  const handleAnswer = (optIdx: number) => {
    const rmap = [3,6,9,12];
    const suit = OB_STEPS[qi].suit;
    const na = {...answers,[suit]:rmap[optIdx]};
    setAnswers(na);
    if(qi < OB_STEPS.length-1) setQi(qi+1);
    else {
      // Pass account data if user came from wizard
      const accountData = fromWizard ? buildAccountData() : undefined;
      launchSequence(na, undefined, accountData);
    }
  };

  const handleExisting = () => launchSequence({clover:10,spade:9,diamond:10,heart:7});

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setLoginError("Email and password are required");
      return;
    }
    
    setLoginLoading(true);
    setLoginError(null);
    
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      
      if (!response.ok) {
        const err = await response.json();
        setLoginError(err.error || "Login failed");
        setLoginLoading(false);
        return;
      }
      
      const data = await response.json();
      const accountData: AccountData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        token: data.token,
      };
      
      // Store token in localStorage for persistence
      localStorage.setItem('authToken', data.token);
      
      // Close modal and launch with default ranks
      setShowLoginModal(false);
      launchSequence({clover:10,spade:9,diamond:10,heart:7}, undefined, accountData);
    } catch (err) {
      console.error("Login error:", err);
      setLoginError("Network error. Please try again.");
      setLoginLoading(false);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    let json: Record<string, unknown>;
    try {
      const text = await file.text();
      json = JSON.parse(text);
    } catch {
      setImportError("Invalid JSON file. Please select a valid org profile.");
      return;
    }

    setPhase("analyzing");
    try {
      const geminiResult = await analyzeOrgProfile(json);
      const ranks: Record<string, number> = {
        clover: geminiResult.clover,
        diamond: geminiResult.diamond,
        heart: geminiResult.heart,
        spade: geminiResult.spade,
      };
      // Pass the original JSON profile along with ranks for CVE threat analysis
      launchSequence(ranks, json);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : "The Magician analysis failed.");
      setPhase("landing");
    }
  };

  // Handle landing card clicks
  const handleCardClick = (cardId: string) => {
    // Only allow clicks when all cards have landed
    if (!cardStates.every(s => s === "landed")) return;

    switch(cardId) {
      case "guest":
        setPhase("questions");
        setQi(0);
        break;
      case "create":
        setShowCreateModal(true);
        break;
      case "login":
        setShowLoginModal(true);
        break;
      case "joker":
        setWizardData(prev => ({
          ...prev,
          tier: "convention",
          orgName: "Grayson and Co.",
          integrations: ["splunk", "crowdstrike", "azure-defender"],
        }));
        setWizardStep("posture-choice");
        setIsJokerMode(true);
        setShowCreateModal(true);
        break;
    }
  };

  const currSuit = phase==="questions" ? OB_STEPS[qi].suit : null;
  const currColor = currSuit ? SUITS[currSuit].color : "var(--cyan)";

  return (
    <div className="ob-screen">
      <button className="ob-skip" onClick={handleExisting}>SKIP →</button>

      {/* Flying suit cards (for launching phase) */}
      {(Object.entries(SUITS) as [string, SuitConfig][]).map(([k, cfg])=>{
        const pos = posMap[k];
        const visible = cardPositions[k];
        const rank = answers[k] || 8;
        return (
          <div key={k} className="fc" style={{
            top:"50%", left:"50%",
            background:'#050a10',
            border:`1.5px solid ${cfg.color}${visible ? 'bb' : '44'}`,
            boxShadow: visible
              ? `0 0 22px ${cfg.color}55, 0 0 44px ${cfg.color}22`
              : `0 0 10px ${cfg.color}22`,
            transform: visible
              ? `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) rotate(${pos.rot}deg) scale(1)`
              : "translate(-50%,-50%) scale(0) rotate(0deg)",
            opacity: visible ? 1 : 0,
            overflow: 'hidden',
          }}>
            {/* CardArt SVG */}
            <div style={{position:'absolute', inset:0, zIndex:0}}>
              <CardArt suitKey={k} color={cfg.color} rank={rank} />
            </div>
            {/* Holo shimmer */}
            <div style={{
              position:'absolute', inset:0, pointerEvents:'none', zIndex:1,
              background:'linear-gradient(135deg,transparent 25%,rgba(255,255,255,0.04) 50%,transparent 75%)',
              animation:'holo 5s ease-in-out infinite',
            }}/>
            {/* Rank badge */}
            <div style={{
              position:'absolute', bottom:4, left:'50%', transform:'translateX(-50%)', zIndex:2,
              fontFamily:'var(--fh)', fontSize:7, fontWeight:900, color:cfg.color,
              textShadow:`0 0 6px ${cfg.color}`, letterSpacing:1, whiteSpace:'nowrap',
              background:'rgba(0,0,0,0.65)', borderRadius:3, padding:'1px 4px',
            }}>
              {RANK_NAMES[rank]}
            </div>
          </div>
        );
      })}

      {/* Landing Phase - Card Stack Animation */}
      {phase==="landing" && (
        <>
          {/* Title appears after cards land */}
          <div className={`landing-title ${showTitle ? "visible" : ""}`}>
            <img src="/counterstack.ico" alt="" style={{ height: "52px", width: "auto", verticalAlign: "middle", marginRight: "0.35em" }} />
            <span className="landing-title-logo-text">CounterStack</span>
          </div>

          {/* Landing cards stack */}
          <div className="landing-stack">
            {LANDING_CARDS.map((card, i) => (
              <div
                key={card.id}
                className={`landing-card ${cardStates[i]}`}
                data-card={card.id}
                data-pos={i}
                style={{
                  color: card.color,
                  "--land-x": `${[-345, -118, 118, 345][i]}px`,
                  "--land-y": `${[170, 125, 125, 170][i]}px`,
                  "--land-rot": `${[-16, -5, 5, 16][i]}deg`,
                  "--stack-z": `${i * 3}px`,
                  zIndex: cardStates[i] === "stacked" ? 10 + i : 20 + i,
                } as React.CSSProperties}
                onClick={() => handleCardClick(card.id)}
              >
                {card.id === "joker" && (
                  <>
                    {/* Corner J markers */}
                    <span style={{
                      position:'absolute', top:10, left:12, zIndex:3,
                      fontFamily:'Georgia,serif', fontSize:17, fontWeight:'bold',
                      color:'#f72585', lineHeight:1, opacity:0.85,
                    }}>J</span>
                    <span style={{
                      position:'absolute', bottom:10, right:12, zIndex:3,
                      fontFamily:'Georgia,serif', fontSize:17, fontWeight:'bold',
                      color:'#f72585', lineHeight:1, opacity:0.85,
                      transform:'rotate(180deg)', display:'block',
                    }}>J</span>
                    {/* artwork + label stacked */}
                    <div style={{
                      position:'absolute', inset:0, zIndex:2,
                      display:'flex', flexDirection:'column',
                      alignItems:'center', justifyContent:'center', gap:6,
                      transform:'translateY(-14px)',
                    }}>
                      <img
                        src="/assets/sprites/p5jokerSVG.png"
                        alt=""
                        style={{
                          width:130, height:'auto', opacity:0.92,
                          filter:'drop-shadow(0 0 10px rgba(247,37,133,0.4))',
                        }}
                      />
                      <span style={{
                        fontFamily:'var(--fh)', fontSize:11, letterSpacing:4,
                        color:'#f72585', opacity:0.85,
                      }}>JOKER</span>
                    </div>
                  </>
                )}
                <div className="lc-holo"/>
                {card.id !== "joker" && <span className="lc-icon">{card.icon}</span>}
                {card.id !== "joker" && <span className="lc-label" style={{color: card.color}}>{card.label}</span>}
              </div>
            ))}
          </div>


          {/* Hidden file input for import */}
          <input ref={fileInputRef} type="file" accept=".json" style={{display:"none"}} onChange={handleFileChange}/>
          {importError && (
            <div style={{fontFamily:"var(--fm)",fontSize:14,color:"#ef4444",marginTop:12,maxWidth:340,textAlign:"center"}}>
              {importError}
            </div>
          )}
        </>
      )}

      {/* Create Account Wizard Modal */}
      {showCreateModal && (
        <div className="modal-ov" onClick={() => { setShowCreateModal(false); setWizardStep("tier"); setIsJokerMode(false); }}>
          <div className="wizard-modal" onClick={e => e.stopPropagation()} style={isJokerMode ? { width: 640 } : undefined}>
            <div className="wizard-header">
              <span className="wizard-title">{isJokerMode ? "🃏 JOKER MODE" : "✦ CREATE ACCOUNT"}</span>
              <button className="wizard-close" onClick={() => { setShowCreateModal(false); setWizardStep("tier"); setIsJokerMode(false); }}>×</button>
            </div>
            <div className="wizard-body">
              {/* Progress Pips */}
              {!isJokerMode && (
                <div className="wizard-pips">
                  {Array.from({ length: getTotalSteps() }).map((_, i) => (
                    <div key={i} className={`wizard-pip ${i < getWizardStepNum() ? "done" : i === getWizardStepNum() ? "active" : "pending"}`} />
                  ))}
                </div>
              )}

              {/* Step 1: Tier Selection */}
              {wizardStep === "tier" && (
                <div className="fade-in">
                  <div className="wizard-step-title">SELECT YOUR TABLE</div>
                  <div className="wizard-step-sub">Choose the tier that matches your organization</div>
                  <div className="tier-cards">
                    {TIERS.map(tier => (
                      <div
                        key={tier.id}
                        className="tier-card"
                        data-tier={tier.id}
                        onClick={() => { updateWizardField("tier", tier.id); nextStep(); }}
                      >
                        <div className="tier-holo" />
                        <span className="tier-icon">{tier.icon}</span>
                        <span className="tier-name">{tier.name}</span>
                        <span className="tier-desc">{tier.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Account Basics */}
              {wizardStep === "account" && (
                <div className="fade-in">
                  <div className="wizard-step-title">ACCOUNT DETAILS</div>
                  <div className="wizard-step-sub">Create your secure credentials</div>
                  <div className="wizard-form">
                    <div className="wiz-field">
                      <label className="wiz-label">FULL NAME</label>
                      <input
                        type="text"
                        className="wiz-input"
                        placeholder="John Doe"
                        value={wizardData.fullName}
                        onChange={e => updateWizardField("fullName", e.target.value)}
                      />
                    </div>
                    <div className="wiz-field">
                      <label className="wiz-label">EMAIL</label>
                      <input
                        type="email"
                        className="wiz-input"
                        placeholder="user@company.com"
                        value={wizardData.email}
                        onChange={e => updateWizardField("email", e.target.value)}
                      />
                    </div>
                    <div className="wiz-row">
                      <div className="wiz-field">
                        <label className="wiz-label">PASSWORD</label>
                        <input
                          type="password"
                          className="wiz-input"
                          placeholder="••••••••"
                          value={wizardData.password}
                          onChange={e => updateWizardField("password", e.target.value)}
                        />
                      </div>
                      <div className="wiz-field">
                        <label className="wiz-label">CONFIRM PASSWORD</label>
                        <input
                          type="password"
                          className="wiz-input"
                          placeholder="••••••••"
                          value={wizardData.confirmPassword}
                          onChange={e => updateWizardField("confirmPassword", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="wizard-nav">
                    <button className="wiz-btn wiz-btn-back" onClick={prevStep}>BACK</button>
                    <button className="wiz-btn wiz-btn-next" onClick={nextStep} disabled={!canProceed()}>CONTINUE</button>
                  </div>
                </div>
              )}

              {/* Step 3: Organization Setup */}
              {wizardStep === "org" && (
                <div className="fade-in">
                  <div className="wizard-step-title">
                    {wizardData.tier === "dealers" ? "DEVICE SETUP" :
                     wizardData.tier === "underground" ? "TEAM SETUP" : "ORGANIZATION SETUP"}
                  </div>
                  <div className="wizard-step-sub">
                    {wizardData.tier === "dealers" ? "Configure your primary device" :
                     wizardData.tier === "underground" ? "Set up your team workspace" : "Configure your enterprise profile"}
                  </div>
                  <div className="wizard-form">
                    <div className="wiz-field">
                      <label className="wiz-label">
                        {wizardData.tier === "dealers" ? "DEVICE NAME" :
                         wizardData.tier === "underground" ? "TEAM NAME" : "ORGANIZATION NAME"}
                      </label>
                      <input
                        type="text"
                        className="wiz-input"
                        placeholder={wizardData.tier === "dealers" ? "Home Workstation" :
                                    wizardData.tier === "underground" ? "Startup Labs" : "Acme Corporation"}
                        value={wizardData.orgName}
                        onChange={e => updateWizardField("orgName", e.target.value)}
                      />
                    </div>

                    {/* Convention Floor specific fields */}
                    {wizardData.tier === "convention" && (
                      <>
                        <div className="wiz-row">
                          <div className="wiz-field">
                            <label className="wiz-label">INDUSTRY</label>
                            <select
                              className="wiz-select"
                              value={wizardData.industry}
                              onChange={e => updateWizardField("industry", e.target.value)}
                            >
                              <option value="">Select industry...</option>
                              {INDUSTRIES.map(ind => (
                                <option key={ind} value={ind}>{ind}</option>
                              ))}
                            </select>
                          </div>
                          <div className="wiz-field">
                            <label className="wiz-label">EMPLOYEES</label>
                            <select
                              className="wiz-select"
                              value={wizardData.employeeCount}
                              onChange={e => updateWizardField("employeeCount", e.target.value)}
                            >
                              <option value="">Select size...</option>
                              {EMPLOYEE_COUNTS.map(count => (
                                <option key={count} value={count}>{count}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="wiz-field">
                          <label className="wiz-label">INFRASTRUCTURE TYPE</label>
                          <select
                            className="wiz-select"
                            value={wizardData.infraType}
                            onChange={e => updateWizardField("infraType", e.target.value)}
                          >
                            <option value="">Select type...</option>
                            {INFRA_TYPES.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="wizard-nav">
                    <button className="wiz-btn wiz-btn-back" onClick={prevStep}>BACK</button>
                    <button className="wiz-btn wiz-btn-next" onClick={nextStep} disabled={!canProceed()}>CONTINUE</button>
                  </div>
                </div>
              )}

              {/* Step 4: Integrations (Convention Floor only) */}
              {wizardStep === "integrations" && (
                <div className="fade-in">
                  <div className="wizard-step-title">SECURITY INTEGRATIONS</div>
                  <div className="wizard-step-sub">Select your connected security platforms</div>

                  <div className="integrations-section">
                    <div className="integrations-title">SIEM PLATFORMS</div>
                    <div className="integration-grid">
                      {INTEGRATIONS.siem.map(int => (
                        <div
                          key={int.id}
                          className={`integration-toggle ${wizardData.integrations.includes(int.id) ? "active" : ""}`}
                          onClick={() => toggleIntegration(int.id)}
                        >
                          <div className="int-check">
                            <span className="int-check-mark">✓</span>
                          </div>
                          <div className="int-info">
                            <span className="int-name">{int.name}</span>
                            <span className="int-type">SIEM</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="integrations-section">
                    <div className="integrations-title">EDR SOLUTIONS</div>
                    <div className="integration-grid">
                      {INTEGRATIONS.edr.map(int => (
                        <div
                          key={int.id}
                          className={`integration-toggle ${wizardData.integrations.includes(int.id) ? "active" : ""}`}
                          onClick={() => toggleIntegration(int.id)}
                        >
                          <div className="int-check">
                            <span className="int-check-mark">✓</span>
                          </div>
                          <div className="int-info">
                            <span className="int-name">{int.name}</span>
                            <span className="int-type">EDR</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="integrations-section">
                    <div className="integrations-title">CLOUD SECURITY</div>
                    <div className="integration-grid">
                      {INTEGRATIONS.cloud.map(int => (
                        <div
                          key={int.id}
                          className={`integration-toggle ${wizardData.integrations.includes(int.id) ? "active" : ""}`}
                          onClick={() => toggleIntegration(int.id)}
                        >
                          <div className="int-check">
                            <span className="int-check-mark">✓</span>
                          </div>
                          <div className="int-info">
                            <span className="int-name">{int.name}</span>
                            <span className="int-type">CLOUD</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="wizard-nav">
                    <button className="wiz-btn wiz-btn-back" onClick={prevStep}>BACK</button>
                    <button className="wiz-btn wiz-btn-next" onClick={nextStep}>CONTINUE</button>
                  </div>
                </div>
              )}

              {/* Step 5: Confirmation */}
              {wizardStep === "confirm" && (
                <div className="fade-in">
                  <div className="wizard-step-title">CONFIRM SETUP</div>
                  <div className="wizard-step-sub">Review your configuration</div>
                  <div className="confirm-grid">
                    <div className="confirm-row">
                      <span className="confirm-lbl">Tier</span>
                      <span className="confirm-val" style={{color: TIERS.find(t => t.id === wizardData.tier)?.color}}>
                        {TIERS.find(t => t.id === wizardData.tier)?.icon} {TIERS.find(t => t.id === wizardData.tier)?.name}
                      </span>
                    </div>
                    <div className="confirm-row">
                      <span className="confirm-lbl">Account</span>
                      <span className="confirm-val">{wizardData.email}</span>
                    </div>
                    <div className="confirm-row">
                      <span className="confirm-lbl">Name</span>
                      <span className="confirm-val">{wizardData.fullName}</span>
                    </div>
                    <div className="confirm-row">
                      <span className="confirm-lbl">
                        {wizardData.tier === "dealers" ? "Device" :
                         wizardData.tier === "underground" ? "Team" : "Organization"}
                      </span>
                      <span className="confirm-val">{wizardData.orgName}</span>
                    </div>
                    {wizardData.tier === "convention" && (
                      <>
                        <div className="confirm-row">
                          <span className="confirm-lbl">Industry</span>
                          <span className="confirm-val">{wizardData.industry}</span>
                        </div>
                        <div className="confirm-row">
                          <span className="confirm-lbl">Size</span>
                          <span className="confirm-val">{wizardData.employeeCount} employees</span>
                        </div>
                        <div className="confirm-row">
                          <span className="confirm-lbl">Infrastructure</span>
                          <span className="confirm-val">{wizardData.infraType}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {wizardData.tier === "convention" && wizardData.integrations.length > 0 && (
                    <div className="confirm-integrations">
                      {wizardData.integrations.map(intId => {
                        const int = [...INTEGRATIONS.siem, ...INTEGRATIONS.edr, ...INTEGRATIONS.cloud].find(i => i.id === intId);
                        return int ? (
                          <span key={intId} className="confirm-int-tag">{int.name}</span>
                        ) : null;
                      })}
                    </div>
                  )}

                  <div className="wizard-nav">
                    <button className="wiz-btn wiz-btn-back" onClick={prevStep}>BACK</button>
                    <button className="wiz-btn wiz-btn-next" onClick={nextStep}>CONTINUE</button>
                  </div>
                </div>
              )}

              {/* Step 6: Posture Assessment Choice */}
              {wizardStep === "posture-choice" && (
                <div className="fade-in">
                  <div className="wizard-step-title">SECURITY POSTURE</div>

                  {isJokerMode ? (
                    <>
                      <div className="wizard-step-sub" style={{ marginBottom: 16, fontSize: 14, color: "#b0b8d4" }}>
                        You are operating as <span style={{ color: "var(--violet)", fontWeight: 700 }}>Grayson and Co.</span>, a multinational conglomerate.
                      </div>
                      <div style={{
                        fontFamily: "var(--fm)", fontSize: 13, color: "#8a93b0",
                        lineHeight: 1.7, marginBottom: 20,
                        padding: "12px 16px",
                        background: "rgba(167,139,250,.06)",
                        border: "1px solid rgba(167,139,250,.2)",
                        borderRadius: 8,
                      }}>
                        CounterStack will use the Grayson and Co. NIST CSF profile to configure your threat environment and security posture for this session.
                      </div>

                      {wizardAnalyzing ? (
                        <div style={{ textAlign: "center", padding: "40px 0" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                            <span style={{
                              display: "inline-block", width: 10, height: 10, borderRadius: "50%",
                              background: "#a855f7", boxShadow: "0 0 10px #a855f7",
                              animation: "pulse 1s ease-in-out infinite"
                            }} />
                            <div style={{
                              fontFamily: "var(--fh)", fontSize: 14, color: "#a855f7", letterSpacing: 2
                            }}>
                              THE MAGICIAN IS ANALYZING...
                            </div>
                          </div>
                          <div style={{
                            fontFamily: "var(--fm)", fontSize: 12, color: "var(--dim)",
                            letterSpacing: 2, marginTop: 12
                          }}>
                            EVALUATING NIST CSF COMPLIANCE
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {/* View NIST CSF Profile */}
                          <div
                            className="posture-choice-card"
                            onClick={() => setShowJokerProfile(true)}
                            style={{
                              background: "linear-gradient(145deg, rgba(167,139,250,.08), rgba(4,13,26,.95))",
                              border: "2px solid rgba(167,139,250,.35)",
                              borderRadius: 12,
                              padding: "20px 20px",
                              cursor: "pointer",
                              transition: "all .25s",
                              display: "flex",
                              alignItems: "center",
                              gap: 16,
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor = "rgba(167,139,250,.6)";
                              e.currentTarget.style.boxShadow = "0 0 25px rgba(167,139,250,.2)";
                              e.currentTarget.style.transform = "translateY(-2px)";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = "rgba(167,139,250,.35)";
                              e.currentTarget.style.boxShadow = "none";
                              e.currentTarget.style.transform = "translateY(0)";
                            }}
                          >
                            <div style={{ fontSize: 28, filter: "drop-shadow(0 0 10px rgba(167,139,250,.6))" }}>📋</div>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontFamily: "var(--fh)", fontSize: 14, fontWeight: 700,
                                color: "var(--violet)", letterSpacing: 1
                              }}>
                                VIEW NIST CSF PROFILE
                              </div>
                            </div>
                            <div style={{
                              fontFamily: "var(--fm)", fontSize: 14, color: "var(--violet)", opacity: .6
                            }}>↗</div>
                          </div>

                          {/* Continue */}
                          <div
                            className="posture-choice-card"
                            onClick={handleJokerContinue}
                            style={{
                              background: "linear-gradient(145deg, rgba(0,212,255,.08), rgba(4,13,26,.95))",
                              border: "2px solid rgba(0,212,255,.35)",
                              borderRadius: 12,
                              padding: "20px 20px",
                              cursor: "pointer",
                              transition: "all .25s",
                              display: "flex",
                              alignItems: "center",
                              gap: 16,
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor = "rgba(0,212,255,.6)";
                              e.currentTarget.style.boxShadow = "0 0 25px rgba(0,212,255,.2)";
                              e.currentTarget.style.transform = "translateY(-2px)";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = "rgba(0,212,255,.35)";
                              e.currentTarget.style.boxShadow = "none";
                              e.currentTarget.style.transform = "translateY(0)";
                            }}
                          >
                            <div style={{ fontSize: 28, filter: "drop-shadow(0 0 10px rgba(0,212,255,.6))" }}>▶</div>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontFamily: "var(--fh)", fontSize: 14, fontWeight: 700,
                                color: "var(--cyan)", letterSpacing: 1
                              }}>
                                CONTINUE
                              </div>
                            </div>
                            <div style={{
                              fontFamily: "var(--fm)", fontSize: 18, color: "var(--cyan)", opacity: .6
                            }}>→</div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="wizard-step-sub">How would you like to assess your security posture?</div>

                      {/* Hidden file input */}
                      <input
                        ref={wizardFileRef}
                        type="file"
                        accept=".json"
                        style={{ display: "none" }}
                        onChange={handleWizardFileChange}
                      />

                      {wizardAnalyzing ? (
                        <div style={{ textAlign: "center", padding: "40px 0" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                            <span style={{
                              display: "inline-block", width: 10, height: 10, borderRadius: "50%",
                              background: "#a855f7", boxShadow: "0 0 10px #a855f7",
                              animation: "pulse 1s ease-in-out infinite"
                            }} />
                            <div style={{
                              fontFamily: "var(--fh)", fontSize: 14, color: "#a855f7", letterSpacing: 2
                            }}>
                              THE MAGICIAN IS ANALYZING...
                            </div>
                          </div>
                          <div style={{
                            fontFamily: "var(--fm)", fontSize: 12, color: "var(--dim)",
                            letterSpacing: 2, marginTop: 12
                          }}>
                            EVALUATING NIST CSF COMPLIANCE
                          </div>
                        </div>
                      ) : (
                        <div className="posture-choice-cards">
                          {/* Import JSON Option */}
                          <div
                            className="posture-choice-card"
                            onClick={handleWizardImportClick}
                            style={{
                              background: "linear-gradient(145deg, rgba(167,139,250,.08), rgba(4,13,26,.95))",
                              border: "2px solid rgba(167,139,250,.35)",
                              borderRadius: 12,
                              padding: "24px 20px",
                              cursor: "pointer",
                              marginBottom: 12,
                              transition: "all .25s",
                              display: "flex",
                              alignItems: "center",
                              gap: 16,
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor = "rgba(167,139,250,.6)";
                              e.currentTarget.style.boxShadow = "0 0 25px rgba(167,139,250,.2)";
                              e.currentTarget.style.transform = "translateY(-2px)";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = "rgba(167,139,250,.35)";
                              e.currentTarget.style.boxShadow = "none";
                              e.currentTarget.style.transform = "translateY(0)";
                            }}
                          >
                            <div style={{
                              fontSize: 36,
                              filter: "drop-shadow(0 0 10px rgba(167,139,250,.6))"
                            }}>📄</div>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontFamily: "var(--fh)", fontSize: 14, fontWeight: 700,
                                color: "var(--violet)", letterSpacing: 1, marginBottom: 4
                              }}>
                                IMPORT NIST CSF PROFILE
                              </div>
                              <div style={{
                                fontFamily: "var(--fm)", fontSize: 12, color: "var(--dim)",
                                lineHeight: 1.4
                              }}>
                                Upload your existing NIST CSF JSON file for AI-powered analysis
                              </div>
                            </div>
                            <div style={{
                              fontFamily: "var(--fm)", fontSize: 18, color: "var(--violet)", opacity: .6
                            }}>→</div>
                          </div>

                          {/* Manual Questionnaire Option */}
                          <div
                            className="posture-choice-card"
                            onClick={completeWithQuestionnaire}
                            style={{
                              background: "linear-gradient(145deg, rgba(0,212,255,.08), rgba(4,13,26,.95))",
                              border: "2px solid rgba(0,212,255,.35)",
                              borderRadius: 12,
                              padding: "24px 20px",
                              cursor: "pointer",
                              transition: "all .25s",
                              display: "flex",
                              alignItems: "center",
                              gap: 16,
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor = "rgba(0,212,255,.6)";
                              e.currentTarget.style.boxShadow = "0 0 25px rgba(0,212,255,.2)";
                              e.currentTarget.style.transform = "translateY(-2px)";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = "rgba(0,212,255,.35)";
                              e.currentTarget.style.boxShadow = "none";
                              e.currentTarget.style.transform = "translateY(0)";
                            }}
                          >
                            <div style={{
                              fontSize: 36,
                              filter: "drop-shadow(0 0 10px rgba(0,212,255,.6))"
                            }}>📝</div>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontFamily: "var(--fh)", fontSize: 14, fontWeight: 700,
                                color: "var(--cyan)", letterSpacing: 1, marginBottom: 4
                              }}>
                                ANSWER QUESTIONNAIRE
                              </div>
                              <div style={{
                                fontFamily: "var(--fm)", fontSize: 12, color: "var(--dim)",
                                lineHeight: 1.4
                              }}>
                                Complete a quick 4-question assessment of your security posture
                              </div>
                            </div>
                            <div style={{
                              fontFamily: "var(--fm)", fontSize: 18, color: "var(--cyan)", opacity: .6
                            }}>→</div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {wizardImportError && (
                    <div style={{
                      fontFamily: "var(--fm)", fontSize: 13, color: "#ef4444",
                      marginTop: 12, padding: "10px 14px",
                      background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)",
                      borderRadius: 6, textAlign: "center"
                    }}>
                      {wizardImportError}
                    </div>
                  )}

                  <div className="wizard-nav" style={{ marginTop: 24 }}>
                    <button
                      className="wiz-btn wiz-btn-back"
                      onClick={() => {
                        if (isJokerMode) {
                          setShowCreateModal(false);
                          setWizardStep("tier");
                          setIsJokerMode(false);
                        } else {
                          prevStep();
                        }
                      }}
                      disabled={wizardAnalyzing}
                    >BACK</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal-ov" onClick={() => setShowLoginModal(false)}>
          <div className="modal-box" style={{borderColor:"rgba(167,139,250,.28)"}} onClick={e => e.stopPropagation()}>
            <div className="modal-h">
              <span className="modal-t" style={{color:"var(--violet)"}}>🔑 LOG IN</span>
              <button className="modal-x" style={{borderColor:"rgba(167,139,250,.25)",color:"var(--violet)"}} onClick={() => {setShowLoginModal(false); setLoginError(null); setLoginEmail(""); setLoginPassword("");}}>×</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div>
                <label style={{fontFamily:"var(--fm)",fontSize:12,color:"var(--dim)",letterSpacing:1,display:"block",marginBottom:6}}>EMAIL</label>
                <input 
                  type="email" 
                  placeholder="user@company.com"
                  value={loginEmail}
                  onChange={(e) => {setLoginEmail(e.target.value); setLoginError(null);}}
                  disabled={loginLoading}
                  style={{
                    width:"100%",background:"rgba(167,139,250,.05)",border:"1px solid rgba(167,139,250,.25)",
                    borderRadius:6,padding:"10px 12px",color:"#fff",fontFamily:"var(--fm)",fontSize:14,outline:"none",
                    opacity: loginLoading ? 0.6 : 1, cursor: loginLoading ? "not-allowed" : "text"
                  }}
                />
              </div>
              <div>
                <label style={{fontFamily:"var(--fm)",fontSize:12,color:"var(--dim)",letterSpacing:1,display:"block",marginBottom:6}}>PASSWORD</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => {setLoginPassword(e.target.value); setLoginError(null);}}
                  disabled={loginLoading}
                  onKeyPress={(e) => e.key === "Enter" && !loginLoading && handleLogin()}
                  style={{
                    width:"100%",background:"rgba(167,139,250,.05)",border:"1px solid rgba(167,139,250,.25)",
                    borderRadius:6,padding:"10px 12px",color:"#fff",fontFamily:"var(--fm)",fontSize:14,outline:"none",
                    opacity: loginLoading ? 0.6 : 1, cursor: loginLoading ? "not-allowed" : "text"
                  }}
                />
              </div>
              {loginError && (
                <div style={{padding:"10px 12px",background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:6,color:"#ef4444",fontFamily:"var(--fm)",fontSize:12,textAlign:"center"}}>
                  {loginError}
                </div>
              )}
              <button 
                onClick={handleLogin}
                disabled={loginLoading}
                style={{
                  marginTop:8,padding:"12px 24px",background:loginLoading ? "rgba(167,139,250,.15)" : "rgba(167,139,250,.3)",border:"1px solid rgba(167,139,250,.4)",
                  borderRadius:6,color:"var(--violet)",fontFamily:"var(--fh)",fontSize:13,letterSpacing:2,
                  cursor:loginLoading ? "not-allowed" : "pointer",opacity:loginLoading ? 0.6 : 1,
                  transition: "all 0.2s"
                }}
              >
                {loginLoading ? "LOGGING IN..." : "LOG IN"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NIST CSF Profile Viewer Modal */}
      {showJokerProfile && (
        <div className="modal-ov" onClick={() => setShowJokerProfile(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{
            borderColor: "rgba(167,139,250,.3)",
            width: "min(860px, 92vw)",
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
          }}>
            <div className="modal-h">
              <span className="modal-t" style={{ color: "var(--violet)" }}>📋 GRAYSON AND CO. — NIST CSF PROFILE</span>
              <button className="modal-x" style={{ borderColor: "rgba(167,139,250,.25)", color: "var(--violet)" }} onClick={() => setShowJokerProfile(false)}>×</button>
            </div>
            <pre style={{
              fontFamily: "monospace",
              fontSize: 14,
              color: "#d4d8f0",
              lineHeight: 1.7,
              overflowY: "auto",
              margin: 0,
              padding: "16px 4px 4px",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              flex: 1,
            }}>
              {JSON.stringify(graysonProfile, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {phase==="questions" && (
        <div className="fade-in" key={qi} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:0,position:"relative"}}>
          <button
            onClick={() => { setPhase("landing"); setQi(0); }}
            style={{
              position:"absolute",top:-8,right:-8,
              background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.15)",
              color:"#aaa",borderRadius:"50%",width:28,height:28,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:14,cursor:"pointer",fontFamily:"system-ui",lineHeight:1,
              zIndex:10,
            }}
            title="Back to menu"
          >✕</button>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8,
            fontFamily:"var(--fh)",fontSize:12,letterSpacing:2,color:currColor}}>
            <span style={{fontSize:16}}>{currSuit && SUITS[currSuit].sym}</span>
            {currSuit && SUITS[currSuit].name} — PILLAR {qi+1}
          </div>
          <div className="ob-q" style={{marginBottom:12,color:"#fff"}}>{OB_STEPS[qi].q}</div>
          <div className="ob-opts">
            {OB_STEPS[qi].opts.map((o,i)=>(
              <button key={i} className="ob-opt" onClick={()=>handleAnswer(i)}>
                <span className="ob-num">{i+1}</span>{o}
              </button>
            ))}
          </div>
          <div className="ob-pips">
            {OB_STEPS.map((_,i)=>(
              <div key={i} className={`ob-pip ${i<=qi?"on":""}`}/>
            ))}
          </div>
        </div>
      )}

      {phase==="analyzing" && (
        <div className="fade-in" style={{textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{display:"inline-block",width:10,height:10,borderRadius:"50%",background:"#a855f7",boxShadow:"0 0 10px #a855f7",animation:"pulse 1s ease-in-out infinite"}}/>
            <div className="ob-launch" style={{color:"#a855f7"}}>THE MAGICIAN IS ANALYZING...</div>
          </div>
          <div style={{fontFamily:"var(--fm)",fontSize:12,color:"var(--dim)",letterSpacing:2}}>
            EVALUATING NIST CSF PROFILE
          </div>
        </div>
      )}

      {phase==="launching" && (
        <div className="fade-in" style={{textAlign:"center", marginTop:120}}>
          <div className="ob-launch">DEPLOYING POSTURE STACK...</div>
          <div style={{fontFamily:"var(--fm)",fontSize:12,color:"var(--dim)",marginTop:8,letterSpacing:2}}>
            INITIALIZING COUNTERSTACK AI ENGINE
          </div>
        </div>
      )}
    </div>
  );
}
