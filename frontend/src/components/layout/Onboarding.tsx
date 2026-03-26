import { useState } from 'react';
import type { AccountData } from '../../interfaces/AccountData.interface';
import {
  registerUser,
  loginUser,
  createOrg,
  uploadProfile,
  saveOnboardingProfile,
} from '../../services/geminiPosture';
import { INIT_RANKS } from '../../data/gameData';

type Phase =
  | 'landing'
  | 'tier'
  | 'account'
  | 'org'
  | 'integrations'
  | 'posture'
  | 'uploading';

type PostureMethod = 'upload' | 'questionnaire' | null;
type AuthMode = 'register' | 'login';

interface OnboardingProps {
  onDone: (
    ranks: Record<string, number>,
    profile: Record<string, unknown> | null,
    account: AccountData | null,
  ) => void;
}

interface QuestionnaireItem {
  key: string;
  label: string;
  type: 'bool' | 'select' | 'number';
  options?: string[];
  placeholder?: string;
}

const QUESTIONNAIRE: QuestionnaireItem[] = [
  { key: 'mfaEnabled',     label: 'Is MFA enforced on all user accounts?',       type: 'bool' },
  { key: 'patchCycle',     label: 'What is your patching cycle?',                type: 'select', options: ['daily', 'weekly', 'monthly', 'quarterly', 'ad-hoc'] },
  { key: 'edrCoverage',    label: 'EDR coverage percentage',                     type: 'number', placeholder: '0-100' },
  { key: 'siemActive',     label: 'Do you have an active SIEM?',                 type: 'bool' },
  { key: 'drTested',       label: 'Has DR been tested in the last 12 months?',   type: 'bool' },
  { key: 'zeroTrust',      label: 'Zero Trust architecture implemented?',        type: 'bool' },
  { key: 'assetInventory', label: 'Complete asset inventory maintained?',        type: 'bool' },
  { key: 'irPlan',         label: 'Incident response plan documented and tested?', type: 'bool' },
];

function computeRanksFromQuestionnaire(
  answers: Record<string, unknown>,
): Record<string, number> {
  let clover = 5, spade = 5, diamond = 5, heart = 5;

  if (answers.mfaEnabled)                                          { diamond += 2; spade += 1; }
  if (answers.patchCycle === 'daily' || answers.patchCycle === 'weekly') clover += 3;
  else if (answers.patchCycle === 'monthly')                          clover += 1;

  const edr = Number(answers.edrCoverage) || 0;
  if (edr >= 90)      { clover += 2; spade += 2; }
  else if (edr >= 70) { clover += 1; spade += 1; }

  if (answers.siemActive)     spade   += 2;
  if (answers.drTested)       heart   += 3;
  if (answers.zeroTrust)      diamond += 2;
  if (answers.assetInventory) clover  += 2;
  if (answers.irPlan)         { spade += 2; heart += 1; }

  return {
    clover:  Math.min(13, clover),
    spade:   Math.min(13, spade),
    diamond: Math.min(13, diamond),
    heart:   Math.min(13, heart),
  };
}

export function Onboarding({ onDone }: OnboardingProps) {
  const [phase, setPhase] = useState<Phase>('landing');
  const [tier, setTier] = useState<AccountData['tier']>('dealers');
  const [authMode, setAuthMode] = useState<AuthMode>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [industry, setIndustry] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [infraType, setInfraType] = useState('');
  const [integrations, setIntegrations] = useState<string[]>([]);
  const [postureMethod, setPostureMethod] = useState<PostureMethod>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [questAnswers, setQuestAnswers] = useState<Record<string, unknown>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGuest = () => {
    onDone(INIT_RANKS, null, null);
  };

  const handleJoker = () => {
    const paths: Array<() => void> = [
      () => onDone(INIT_RANKS, null, null),
      () => { setTier('dealers');     setPhase('account'); },
      () => { setTier('underground'); setPhase('account'); },
    ];
    paths[Math.floor(Math.random() * paths.length)]();
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      let token = '';
      let userId = '';
      let orgId = '';

      if (authMode === 'register') {
        const res = await registerUser(email, password, name);
        token  = res.token;
        userId = res.user.id;
      } else {
        const res = await loginUser(email, password);
        token  = res.token;
        userId = res.user.id;
      }

      const org = await createOrg(orgName || 'My Organization', token);
      orgId = org.id;

      let ranks = INIT_RANKS;
      let profileData: Record<string, unknown> | null = null;

      if (postureMethod === 'upload' && uploadFile) {
        setPhase('uploading');
        const result = await uploadProfile(orgId, uploadFile, token);
        ranks       = result.ranks as Record<string, number>;
        profileData = result as Record<string, unknown>;
      } else if (postureMethod === 'questionnaire') {
        const computedRanks = computeRanksFromQuestionnaire(questAnswers);
        await saveOnboardingProfile(orgId, questAnswers, computedRanks, token);
        ranks       = computedRanks;
        profileData = questAnswers;
      }

      const accountData: AccountData = {
        userId,
        orgId,
        orgName: orgName || 'My Organization',
        tier,
        integrations,
        token,
        industry,
        employeeCount,
        infraType,
      };

      onDone(ranks, profileData, accountData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
      setLoading(false);
    }
  };

  // ── Shared styles ────────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#0d1117',
    border: '1px solid rgba(0,212,255,0.2)',
    color: '#cdd9e5',
    fontFamily: 'var(--fm)',
    fontSize: 12,
    padding: '8px 10px',
    borderRadius: 6,
    outline: 'none',
  };

  const btnPrimary: React.CSSProperties = {
    background: '#00d4ff22',
    border: '1px solid #00d4ff55',
    color: '#00d4ff',
    fontFamily: 'var(--fh)',
    fontSize: 11,
    padding: '8px 16px',
    borderRadius: 6,
    cursor: 'pointer',
    letterSpacing: '0.1em',
    width: '100%',
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="onboarding-overlay">
      <div style={{ width: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              fontFamily: 'var(--fh)',
              fontSize: 22,
              color: '#00d4ff',
              letterSpacing: '0.15em',
            }}
          >
            COUNTERSTACK
          </div>
          <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 4 }}>
            CYBERSECURITY POSTURE DASHBOARD
          </div>
        </div>

        {/* ── LANDING ─────────────────────────────────────────────────────────── */}
        {phase === 'landing' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              {
                label: 'GUEST',
                desc: 'Quick demo — no account needed',
                color: '#6b7280',
                action: handleGuest,
              },
              {
                label: 'CREATE ACCOUNT',
                desc: 'Full registration flow',
                color: '#00d4ff',
                action: () => { setAuthMode('register'); setPhase('tier'); },
              },
              {
                label: 'LOG IN',
                desc: 'Continue with existing account',
                color: '#39d353',
                action: () => { setAuthMode('login'); setPhase('account'); },
              },
              {
                label: '🃏 JOKER',
                desc: 'Random entry path',
                color: '#ffd700',
                action: handleJoker,
              },
            ].map(card => (
              <button
                key={card.label}
                onClick={card.action}
                style={{
                  background: `${card.color}11`,
                  border: `1px solid ${card.color}44`,
                  borderRadius: 8,
                  padding: '20px 16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'transform 0.1s, box-shadow 0.1s',
                }}
                onMouseEnter={e =>
                  ((e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)')
                }
                onMouseLeave={e =>
                  ((e.currentTarget as HTMLElement).style.transform = 'none')
                }
              >
                <div
                  style={{
                    fontFamily: 'var(--fh)',
                    fontSize: 13,
                    color: card.color,
                    marginBottom: 6,
                  }}
                >
                  {card.label}
                </div>
                <div style={{ fontSize: 10, color: 'var(--dim)' }}>{card.desc}</div>
              </button>
            ))}
          </div>
        )}

        {/* ── TIER ────────────────────────────────────────────────────────────── */}
        {phase === 'tier' && (
          <div>
            <div className="panel-header" style={{ marginBottom: 16, fontSize: 11 }}>
              SELECT ACCOUNT TIER
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(
                [
                  { key: 'dealers',     label: "DEALER'S HOUSE",     desc: 'Basic posture dashboard',                     color: '#6b7280' },
                  { key: 'underground', label: 'UNDERGROUND TABLE',  desc: '+ Historical data & trends',                  color: '#ffd700' },
                  { key: 'convention',  label: 'CONVENTION FLOOR',   desc: '+ Splunk & CrowdStrike integrations',          color: '#00d4ff' },
                ] as const
              ).map(t => (
                <button
                  key={t.key}
                  onClick={() => setTier(t.key)}
                  style={{
                    background: tier === t.key ? `${t.color}22` : '#0d1117',
                    border: `1px solid ${tier === t.key ? t.color : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 8,
                    padding: '12px 16px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontFamily: 'var(--fh)', fontSize: 12, color: t.color }}>
                    {t.label}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 4 }}>
                    {t.desc}
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setPhase('account')} style={{ ...btnPrimary, marginTop: 16 }}>
              CONTINUE →
            </button>
          </div>
        )}

        {/* ── ACCOUNT ─────────────────────────────────────────────────────────── */}
        {phase === 'account' && (
          <div>
            <div className="panel-header" style={{ marginBottom: 16, fontSize: 11 }}>
              {authMode === 'register' ? 'CREATE ACCOUNT' : 'LOG IN'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {authMode === 'register' && (
                <div>
                  <label
                    style={{ fontSize: 10, color: 'var(--dim)', display: 'block', marginBottom: 4 }}
                  >
                    NAME
                  </label>
                  <input
                    style={inputStyle}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>
              )}
              <div>
                <label
                  style={{ fontSize: 10, color: 'var(--dim)', display: 'block', marginBottom: 4 }}
                >
                  EMAIL
                </label>
                <input
                  style={inputStyle}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <label
                  style={{ fontSize: 10, color: 'var(--dim)', display: 'block', marginBottom: 4 }}
                >
                  PASSWORD
                </label>
                <input
                  style={inputStyle}
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
            {error && (
              <div style={{ color: '#f72585', fontSize: 11, marginTop: 8 }}>{error}</div>
            )}
            <button
              onClick={() => (authMode === 'register' ? setPhase('org') : handleSubmit())}
              style={{ ...btnPrimary, marginTop: 16 }}
              disabled={loading}
            >
              {authMode === 'register' ? 'CONTINUE →' : loading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </div>
        )}

        {/* ── ORG ─────────────────────────────────────────────────────────────── */}
        {phase === 'org' && (
          <div>
            <div className="panel-header" style={{ marginBottom: 16, fontSize: 11 }}>
              ORGANIZATION DETAILS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(
                [
                  { label: 'ORGANIZATION NAME',  state: orgName,       setState: setOrgName,       placeholder: 'Acme Corp'                  },
                  { label: 'INDUSTRY',            state: industry,      setState: setIndustry,      placeholder: 'Healthcare, Finance, Tech...' },
                  { label: 'EMPLOYEE COUNT',      state: employeeCount, setState: setEmployeeCount, placeholder: '1-50, 51-200, 200+'          },
                  { label: 'INFRASTRUCTURE TYPE', state: infraType,     setState: setInfraType,     placeholder: 'Cloud, On-prem, Hybrid'      },
                ] as const
              ).map(f => (
                <div key={f.label}>
                  <label
                    style={{ fontSize: 10, color: 'var(--dim)', display: 'block', marginBottom: 4 }}
                  >
                    {f.label}
                  </label>
                  <input
                    style={inputStyle}
                    value={f.state}
                    onChange={e => f.setState(e.target.value)}
                    placeholder={f.placeholder}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => setPhase(tier === 'convention' ? 'integrations' : 'posture')}
              style={{ ...btnPrimary, marginTop: 16 }}
            >
              CONTINUE →
            </button>
          </div>
        )}

        {/* ── INTEGRATIONS (convention tier only) ─────────────────────────────── */}
        {phase === 'integrations' && (
          <div>
            <div className="panel-header" style={{ marginBottom: 16, fontSize: 11 }}>
              CONFIGURE INTEGRATIONS
            </div>
            {[
              { key: 'splunk',       label: 'Splunk SIEM',      color: '#ff9f1c' },
              { key: 'crowdstrike',  label: 'CrowdStrike EDR',  color: '#f72585' },
            ].map(int => (
              <button
                key={int.key}
                onClick={() =>
                  setIntegrations(prev =>
                    prev.includes(int.key)
                      ? prev.filter(i => i !== int.key)
                      : [...prev, int.key],
                  )
                }
                style={{
                  width: '100%',
                  background: integrations.includes(int.key) ? `${int.color}22` : '#0d1117',
                  border: `1px solid ${integrations.includes(int.key) ? int.color : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 8,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  marginBottom: 10,
                  color: int.color,
                  fontFamily: 'var(--fh)',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                {int.label}
                <span>{integrations.includes(int.key) ? '✓ ENABLED' : 'DISABLED'}</span>
              </button>
            ))}
            <button onClick={() => setPhase('posture')} style={{ ...btnPrimary, marginTop: 8 }}>
              CONTINUE →
            </button>
          </div>
        )}

        {/* ── POSTURE ─────────────────────────────────────────────────────────── */}
        {phase === 'posture' && (
          <div>
            <div className="panel-header" style={{ marginBottom: 16, fontSize: 11 }}>
              SECURITY POSTURE INPUT
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => setPostureMethod('upload')}
                style={{
                  background: postureMethod === 'upload' ? '#00d4ff22' : '#0d1117',
                  border: `1px solid ${postureMethod === 'upload' ? '#00d4ff' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 8,
                  padding: '16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontFamily: 'var(--fh)', fontSize: 11, color: '#00d4ff' }}>
                  UPLOAD NIST CSF JSON
                </div>
                <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 4 }}>
                  AI-analyzed NIST Cybersecurity Framework profile
                </div>
                {postureMethod === 'upload' && (
                  <input
                    type="file"
                    accept=".json"
                    onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
                    style={{ marginTop: 8, fontSize: 10, color: 'var(--dim)' }}
                    onClick={e => e.stopPropagation()}
                  />
                )}
              </button>

              <button
                onClick={() => setPostureMethod('questionnaire')}
                style={{
                  background: postureMethod === 'questionnaire' ? '#a78bfa22' : '#0d1117',
                  border: `1px solid ${postureMethod === 'questionnaire' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 8,
                  padding: '16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontFamily: 'var(--fh)', fontSize: 11, color: '#a78bfa' }}>
                  ANSWER QUESTIONNAIRE
                </div>
                <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 4 }}>
                  8-question security assessment
                </div>
              </button>
            </div>

            {postureMethod === 'questionnaire' && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {QUESTIONNAIRE.map(q => (
                  <div key={q.key}>
                    <label
                      style={{
                        fontSize: 10,
                        color: 'var(--dim)',
                        display: 'block',
                        marginBottom: 4,
                      }}
                    >
                      {q.label}
                    </label>

                    {q.type === 'bool' ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        {['Yes', 'No'].map(opt => (
                          <button
                            key={opt}
                            onClick={() =>
                              setQuestAnswers(prev => ({
                                ...prev,
                                [q.key]: opt === 'Yes',
                              }))
                            }
                            style={{
                              background:
                                questAnswers[q.key] === (opt === 'Yes') ? '#a78bfa22' : '#0d1117',
                              border: `1px solid ${questAnswers[q.key] === (opt === 'Yes') ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`,
                              color: '#cdd9e5',
                              fontSize: 11,
                              padding: '6px 16px',
                              borderRadius: 4,
                              cursor: 'pointer',
                            }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : q.type === 'select' ? (
                      <select
                        style={inputStyle}
                        value={(questAnswers[q.key] as string) ?? ''}
                        onChange={e =>
                          setQuestAnswers(prev => ({ ...prev, [q.key]: e.target.value }))
                        }
                      >
                        <option value="">Select...</option>
                        {q.options?.map(o => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        style={inputStyle}
                        type="number"
                        placeholder={q.placeholder}
                        value={(questAnswers[q.key] as string) ?? ''}
                        onChange={e =>
                          setQuestAnswers(prev => ({ ...prev, [q.key]: e.target.value }))
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div style={{ color: '#f72585', fontSize: 11, marginTop: 8 }}>{error}</div>
            )}
            <button
              onClick={handleSubmit}
              style={{ ...btnPrimary, marginTop: 16 }}
              disabled={loading}
            >
              {loading ? 'PROCESSING...' : 'COMPLETE SETUP →'}
            </button>
          </div>
        )}

        {/* ── UPLOADING ───────────────────────────────────────────────────────── */}
        {phase === 'uploading' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div
              style={{
                fontSize: 14,
                color: '#00d4ff',
                fontFamily: 'var(--fh)',
                marginBottom: 12,
              }}
            >
              ⟳ ANALYZING PROFILE
            </div>
            <div style={{ fontSize: 11, color: 'var(--dim)' }}>
              Gemini AI is evaluating your NIST CSF profile...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
