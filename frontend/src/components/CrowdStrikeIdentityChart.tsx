import { MOCK_CROWDSTRIKE_DATA } from '../data/integrationMockData';

interface Bar {
  label: string;
  value: number;
  color: string;
  raw?: number;
}

export function CrowdStrikeIdentityChart() {
  const { identity } = MOCK_CROWDSTRIKE_DATA;

  const bars: Bar[] = [
    { label: 'MFA Enrolled',    value: identity.mfaEnrolled,                           color: '#39d353' },
    { label: 'Priv. Accounts',  value: (identity.privilegedAccounts / 200) * 100,      color: '#00d4ff', raw: identity.privilegedAccounts },
    { label: 'Risky Users',     value: (identity.riskyUsers / 50) * 100,               color: '#f72585', raw: identity.riskyUsers },
    { label: 'Stale Accounts',  value: (identity.staleAccounts / 100) * 100,           color: '#ff9f1c', raw: identity.staleAccounts },
  ];

  return (
    <div>
      {bars.map(b => (
        <div key={b.label} style={{ marginBottom: 6 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 9,
              marginBottom: 2,
            }}
          >
            <span style={{ color: 'var(--dim)' }}>{b.label}</span>
            <span style={{ color: b.color }}>
              {b.raw !== undefined ? b.raw : `${b.value.toFixed(1)}%`}
            </span>
          </div>
          <div style={{ height: 4, background: '#1a2332', borderRadius: 2 }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, b.value)}%`,
                background: b.color,
                borderRadius: 2,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
