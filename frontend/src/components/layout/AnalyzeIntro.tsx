import { useState, useEffect } from 'react';
import type { AnalyzeIntroProps } from '../../interfaces/AnalyzeIntroProps.interface';

const PAD = 12;

const SUITS_INFO = [
  { sym: '♣', name: 'RESOURCES', color: '#39d353', desc: 'Asset inventory, patch compliance & hygiene' },
  { sym: '♠', name: 'OFFSEC',    color: '#00d4ff', desc: 'Detection maturity, SOC coverage & response' },
  { sym: '♦', name: 'HARDEN',    color: '#a78bfa', desc: 'MFA adoption, least-privilege & hardening' },
  { sym: '♥', name: 'RESILIENCE',color: '#f72585', desc: 'Backup integrity, DR planning & continuity' },
];

interface TourStep {
  id: string | null;
  combineId?: string;
  modalPosition: 'center' | 'below' | 'right' | 'left-of' | 'above';
  title: string;
  subtitle: string;
}

const TOUR_STEPS: TourStep[] = [
  { id: null,                  modalPosition: 'center',  title: 'DEALER\'S BRIEFING',    subtitle: 'WELCOME TO COUNTERSTACK' },
  { id: 'tour-hub',            modalPosition: 'right',   title: 'THE FOUR SUITS',        subtitle: 'YOUR SECURITY DOMAINS' },
  { id: 'tour-joker',          modalPosition: 'right',   title: 'THE JOKER',             subtitle: 'YOUR THREAT PRESSURE' },
  { id: 'tour-integrations',   modalPosition: 'right',   title: 'INTEGRATIONS',          subtitle: 'YOUR LIVE TELEMETRY' },
  { id: 'tour-right-col',      modalPosition: 'left-of', title: 'THE MAGICIAN',          subtitle: 'YOUR STRATEGIC ADVISOR' },
  { id: 'tour-mode-toggle', modalPosition: 'below', title: 'ANALYZE VS SIMULATE', subtitle: 'TWO MODES, ONE MISSION' },
];

interface Rect { top: number; left: number; right: number; bottom: number; }

export default function AnalyzeIntro({ onClose, accountData }: AnalyzeIntroProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<Rect | null>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const step = TOUR_STEPS[currentStep];
    if (!step.id) { setSpotlightRect(null); return; }
    const raf = requestAnimationFrame(() => {
      const el = document.getElementById(step.id!);
      if (!el) { setSpotlightRect(null); return; }
      const r = el.getBoundingClientRect();
      let rect: Rect = { top: r.top, left: r.left, right: r.right, bottom: r.bottom };
      if (step.combineId) {
        const el2 = document.getElementById(step.combineId);
        if (el2) {
          const r2 = el2.getBoundingClientRect();
          rect = {
            top: Math.min(rect.top, r2.top),
            left: Math.min(rect.left, r2.left),
            right: Math.max(rect.right, r2.right),
            bottom: Math.max(rect.bottom, r2.bottom),
          };
        }
      }
      setSpotlightRect(rect);
    });
    return () => cancelAnimationFrame(raf);
  }, [currentStep, windowWidth]);

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const isFirst = currentStep === 0;

  function getModalStyle(): React.CSSProperties {
    const base: React.CSSProperties = {
      position: 'fixed',
      zIndex: 400,
      width: 500,
    };
    if (!spotlightRect || step.modalPosition === 'center') {
      return { ...base, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
    }
    const r = spotlightRect;
    switch (step.modalPosition) {
      case 'below':
        return { ...base, top: r.bottom + PAD + 8, left: '50%', transform: 'translateX(-50%)' };
      case 'right': {
        const left = Math.min(r.right + PAD + 8, window.innerWidth - 520);
        return { ...base, top: r.top + (r.bottom - r.top) / 2, left, transform: 'translateY(-50%)' };
      }
      case 'left-of':
        return { ...base, top: r.top + (r.bottom - r.top) / 2, right: window.innerWidth - r.left + PAD + 12, transform: 'translateY(-50%)' };
      case 'above':
        return { ...base, bottom: window.innerHeight - r.top + PAD + 8, left: '50%', transform: 'translateX(-50%)' };
      default:
        return { ...base, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
    }
  }

  const hasIntegrations = accountData?.tier === 'convention' && (accountData.integrations?.length ?? 0) > 0;

  return (
    <>
      {/* Spotlight overlay — 4 panels around the target, or full overlay on step 0 */}
      {spotlightRect ? (
        <>
          {/* top */}
          <div className="tour-ov" style={{ top: 0, left: 0, right: 0, height: Math.max(0, spotlightRect.top - PAD) }} />
          {/* bottom */}
          <div className="tour-ov" style={{ top: spotlightRect.bottom + PAD, left: 0, right: 0, bottom: 0 }} />
          {/* left */}
          <div className="tour-ov" style={{ top: spotlightRect.top - PAD, left: 0, width: Math.max(0, spotlightRect.left - PAD), height: spotlightRect.bottom - spotlightRect.top + 2 * PAD }} />
          {/* right */}
          <div className="tour-ov" style={{ top: spotlightRect.top - PAD, left: spotlightRect.right + PAD, right: 0, height: spotlightRect.bottom - spotlightRect.top + 2 * PAD }} />
          {/* animated cyan border */}
          <div className="tour-hl-border" style={{
            position: 'fixed',
            zIndex: 37,
            top: spotlightRect.top - PAD,
            left: spotlightRect.left - PAD,
            width: spotlightRect.right - spotlightRect.left + 2 * PAD,
            height: spotlightRect.bottom - spotlightRect.top + 2 * PAD,
          }} />
        </>
      ) : (
        <div className="tour-ov" style={{ inset: 0, position: 'fixed' }} />
      )}

      {/* Floating modal */}
      <div className="tour-modal" style={getModalStyle()}>
        <div className="tour-header">
          <div className="tour-title" style={currentStep === 4 ? {display:'flex',alignItems:'center',gap:6} : undefined}>
            {currentStep === 4 && <img src="/magician-icon.png" style={{height:16,objectFit:'contain',flexShrink:0}} />}
            {step.title}
          </div>
          <button className="tour-skip" onClick={onClose}>SKIP</button>
        </div>
        <div className="tour-step-count">{currentStep + 1} / {TOUR_STEPS.length}</div>

        <div className="tour-body">
          <div className="tour-subtitle">{step.subtitle}</div>

          {/* Step 0 — Welcome */}
          {currentStep === 0 && (
            <>
              <div className="tour-text">
                Analyze Mode gives you a real-time view of your organization's security posture — mapped across four domains, scored like a poker hand, and powered by AI.
              </div>
              <div className="tour-suit-row" style={{ marginTop: 16 }}>
                {SUITS_INFO.map(s => (
                  <div key={s.name} className="tour-suit-sym-wrap">
                    <span className="tour-suit-sym" style={{ color: s.color }}>{s.sym}</span>
                    <span className="tour-suit-name" style={{ color: s.color }}>{s.name}</span>
                    <span className="tour-suit-desc">{s.desc}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Step 1 — Four Suits */}
          {currentStep === 1 && (
            <>
              <div className="tour-text">
                Each of the four suit cards represents a core security domain, scored 1–13 like a card rank. Ace (1) is a warning sign; King (13) is elite-tier maturity.
              </div>
              <div className="tour-text" style={{ marginTop: 10 }}>
                Together, your four ranks form a <strong style={{ color: '#00d4ff' }}>poker hand</strong> — your overall posture tier. Click any card to open an AI-driven deep-dive on that domain.
              </div>
            </>
          )}

          {/* Step 2 — Joker */}
          {currentStep === 2 && (
            <>
              <div className="tour-text">
                The Joker displays your organization's <strong style={{ color: '#f72585' }}>real-time threat pressure score</strong> — a 0–100% likelihood derived from active CVEs in the wild.
              </div>
              <div className="tour-text" style={{ marginTop: 10 }}>
                CounterStack's AI cross-references CVE severity, exploitability, and your asset profile. Above 60% is high pressure; below 30% is relatively calm. Click the Joker to shuffle or select a CVE.
              </div>
            </>
          )}

          {/* Step 3 — Integrations */}
          {currentStep === 3 && (
            <>
              <div className="tour-text">
                The Integrations panel streams <strong style={{ color: '#00d4ff' }}>live telemetry</strong> from connected tools like Splunk and CrowdStrike directly into your posture view.
              </div>
              {hasIntegrations ? (
                <div className="tour-notice" style={{ marginTop: 12 }}>
                  <span className="tour-notice-icon">✓</span>
                  <span className="tour-notice-text" style={{ color: '#39d353' }}>
                    Your integrations are active. Anomaly spikes from connected feeds can shift your suit ranks in real time.
                  </span>
                </div>
              ) : (
                <div className="tour-notice" style={{ marginTop: 12 }}>
                  <span className="tour-notice-icon">⚠</span>
                  <span className="tour-notice-text">
                    No integrations are currently active. Connect Splunk or CrowdStrike under your account settings to enable live telemetry feeds.
                  </span>
                </div>
              )}
            </>
          )}

          {/* Step 4 — Magician */}
          {currentStep === 4 && (
            <>
              <div className="tour-text">
                The Magician reads your entire posture holistically — across all four domains — and delivers <strong style={{ color: '#a78bfa' }}>AI-driven recommendations</strong> tailored to your organization.
              </div>
              <div className="tour-text" style={{ marginTop: 10 }}>
                It covers your executive <strong style={{ color: '#00d4ff' }}>Reading</strong>, your <strong style={{ color: '#39d353' }}>Strengths</strong>, your <strong style={{ color: '#f72585' }}>Gaps</strong>, and a phased <strong style={{ color: '#a78bfa' }}>5-Year Plan</strong> projecting how investments elevate your hand tier.
              </div>
            </>
          )}

          {/* Step 5 — Analyze vs Simulate */}
          {currentStep === 5 && (
            <>
              <div className="tour-text">
                <strong style={{ color: '#00d4ff' }}>● ANALYZE</strong> gives you a live view of your organization's security posture across all four domains — and shows how vulnerable you are to different known threats in the wild.
              </div>
              <div className="tour-text" style={{ marginTop: 10 }}>
                <strong style={{ color: '#a78bfa' }}>○ SIMULATE</strong> pits your organization directly against a known threat. If your hand rank isn't strong enough to defeat it, you lose the simulation — exposing exactly where you need to improve.
              </div>
            </>
          )}


        </div>

        <div className="tour-footer">
          <button
            className="tour-btn-back"
            onClick={() => setCurrentStep(s => s - 1)}
            style={{ visibility: isFirst ? 'hidden' : 'visible' }}
          >
            ← BACK
          </button>
          <div className="tour-dots">
            {TOUR_STEPS.map((_, i) => (
              <span key={i} className={`tour-dot${i === currentStep ? ' active' : ''}`} />
            ))}
          </div>
          {currentStep === 0 ? (
            <button className="tour-cta" onClick={() => setCurrentStep(1)}>START TOUR →</button>
          ) : isLast ? (
            <button className="tour-btn-got-it" onClick={onClose}>GOT IT</button>
          ) : (
            <button className="tour-btn-next" onClick={() => setCurrentStep(s => s + 1)}>NEXT →</button>
          )}
        </div>
      </div>
    </>
  );
}
