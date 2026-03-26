import { MOCK_SPLUNK_DATA, MOCK_CROWDSTRIKE_DATA } from '../../data/integrationMockData';
import { CrowdStrikeIdentityChart } from '../CrowdStrikeIdentityChart';

export function IntegrationsPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Splunk */}
      <div className="panel">
        <div className="panel-header" style={{ color: '#ff9f1c' }}>⬡ SPLUNK</div>
        <div style={{ fontSize: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--dim)' }}>Events/day</span>
            <span style={{ color: '#ff9f1c' }}>{MOCK_SPLUNK_DATA.eventsPerDay.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--dim)' }}>Log Sources</span>
            <span style={{ color: '#ff9f1c' }}>{MOCK_SPLUNK_DATA.logSources}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--dim)' }}>Indexed Today</span>
            <span style={{ color: '#ff9f1c' }}>{MOCK_SPLUNK_DATA.indexedToday}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--dim)' }}>Alerts Triggered</span>
            <span style={{ color: '#f72585' }}>{MOCK_SPLUNK_DATA.alerts.triggered}</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 9, color: 'var(--dim)' }}>TOP SOURCES</div>
          {MOCK_SPLUNK_DATA.topSources.map(s => (
            <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(205,217,229,0.5)', fontSize: 9 }}>{s.name}</span>
              <span style={{ color: '#ff9f1c', fontSize: 9 }}>{s.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 9,
          }}
        >
          <span style={{ color: '#39d353' }}>●</span>
          <span style={{ color: '#39d353' }}>CONNECTED</span>
        </div>
      </div>

      {/* CrowdStrike */}
      <div className="panel">
        <div className="panel-header" style={{ color: '#f72585' }}>⬡ CROWDSTRIKE</div>
        <div style={{ fontSize: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--dim)' }}>Coverage</span>
            <span style={{ color: '#f72585' }}>{MOCK_CROWDSTRIKE_DATA.coveragePct}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--dim)' }}>Detections today</span>
            <span style={{ color: '#ff9f1c' }}>{MOCK_CROWDSTRIKE_DATA.detections.today}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--dim)' }}>Preventions today</span>
            <span style={{ color: '#39d353' }}>{MOCK_CROWDSTRIKE_DATA.preventions.today}</span>
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 9, color: 'var(--dim)', marginBottom: 4 }}>
            IDENTITY PROTECTION
          </div>
          <CrowdStrikeIdentityChart />
        </div>
        <div
          style={{
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 9,
          }}
        >
          <span style={{ color: '#39d353' }}>●</span>
          <span style={{ color: '#39d353' }}>CONNECTED</span>
        </div>
      </div>
    </div>
  );
}
