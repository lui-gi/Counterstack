import { useState, useEffect } from 'react';

type Severity = 'warning' | 'danger' | 'info';

interface AlertTemplate {
  text: string;
  severity: Severity;
}

const ALERT_TEMPLATES: AlertTemplate[] = [
  { text: 'Suspicious login attempt blocked',          severity: 'warning' },
  { text: 'EDR quarantine triggered on endpoint',      severity: 'danger'  },
  { text: 'Certificate renewal completed',             severity: 'info'    },
  { text: 'Vulnerability scan completed: 3 new findings', severity: 'warning' },
  { text: 'Backup job completed successfully',         severity: 'info'    },
  { text: 'MFA enrollment reminder sent',              severity: 'info'    },
  { text: 'Firewall rule updated',                     severity: 'info'    },
  { text: 'Patch deployment failed on 2 hosts',        severity: 'danger'  },
];

const COLORS: Record<Severity, string> = {
  warning: '#ff9f1c',
  danger:  '#f72585',
  info:    '#00d4ff',
};

interface Alert {
  id: number;
  text: string;
  severity: Severity;
  ts: string;
}

export function AlertsFeed() {
  const [alerts, setAlerts] = useState<Alert[]>(() =>
    ALERT_TEMPLATES.slice(0, 4).map((a, i) => ({
      ...a,
      id: i,
      ts: `${(5 - i) * 3}m ago`,
    })),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const tmpl = ALERT_TEMPLATES[Math.floor(Math.random() * ALERT_TEMPLATES.length)];
      setAlerts(prev =>
        [{ ...tmpl, id: Date.now(), ts: 'just now' }, ...prev].slice(0, 8),
      );
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="panel">
      <div className="panel-header">⚡ LIVE ALERTS</div>
      {alerts.map(a => (
        <div
          key={a.id}
          style={{
            display: 'flex',
            gap: 6,
            padding: '4px 0',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            fontSize: 10,
          }}
        >
          <span style={{ color: COLORS[a.severity] }}>●</span>
          <span style={{ flex: 1, color: 'var(--dim)' }}>{a.text}</span>
          <span style={{ color: 'rgba(205,217,229,0.3)', whiteSpace: 'nowrap' }}>{a.ts}</span>
        </div>
      ))}
    </div>
  );
}
