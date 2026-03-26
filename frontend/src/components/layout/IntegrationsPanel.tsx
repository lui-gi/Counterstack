import { useState, useEffect } from 'react';
import type { SplunkData, CrowdStrikeData } from '../../interfaces';
import type { IntegrationAlert } from '../../interfaces';
import { SEVERITY_COLORS, ALL_SPLUNK_ALERTS, ALL_CROWDSTRIKE_ALERTS } from '../../data/integrationMockData';
import CrowdStrikeIdentityChart from '../CrowdStrikeIdentityChart';

interface IntegrationsPanelProps {
  integrations: string[];
  splunkData?: SplunkData;
  crowdstrikeData?: CrowdStrikeData;
  onAlertClick?: (alertId: string, source: string) => void;
}

const INTEGRATION_META: Record<string, { name: string; color: string; type: string }> = {
  splunk: { name: 'Splunk', color: '#65a30d', type: 'SIEM' },
  crowdstrike: { name: 'CrowdStrike', color: '#ef4444', type: 'EDR' },
  sentinel: { name: 'Sentinel', color: '#0ea5e9', type: 'SIEM' },
  elastic: { name: 'Elastic', color: '#f59e0b', type: 'SIEM' },
  sentinelone: { name: 'SentinelOne', color: '#8b5cf6', type: 'EDR' },
  carbonblack: { name: 'Carbon Black', color: '#6b7280', type: 'EDR' },
};

export default function IntegrationsPanel({
  integrations,
  splunkData,
  crowdstrikeData,
  onAlertClick,
}: IntegrationsPanelProps) {
  const [liveEvents, setLiveEvents] = useState<IntegrationAlert[]>(
    splunkData?.notableEvents ?? []
  );
  const [newestId, setNewestId] = useState<string | null>(null);

  const [liveDetections, setLiveDetections] = useState<IntegrationAlert[]>(
    crowdstrikeData?.detections ?? []
  );
  const [newestCsId, setNewestCsId] = useState<string | null>(null);


  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      const delay = Math.random() * 10_000;
      timeoutId = setTimeout(() => {
        const template = ALL_SPLUNK_ALERTS[Math.floor(Math.random() * ALL_SPLUNK_ALERTS.length)];
        const injected: IntegrationAlert = {
          ...template,
          id: `SPL-live-${Date.now()}`,
          timestamp: 'just now',
          status: 'new',
        };
        setLiveEvents((prev) => [injected, ...prev]);
        setNewestId(injected.id);
        setTimeout(() => setNewestId(null), 5000);
        scheduleNext();
      }, delay);
    };

    scheduleNext();
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      const delay = Math.random() * 12_000;
      timeoutId = setTimeout(() => {
        const template = ALL_CROWDSTRIKE_ALERTS[Math.floor(Math.random() * ALL_CROWDSTRIKE_ALERTS.length)];
        const injected: IntegrationAlert = {
          ...template,
          id: `CS-live-${Date.now()}`,
          timestamp: 'just now',
          status: 'new',
        };
        setLiveDetections((prev) => [injected, ...prev]);
        setNewestCsId(injected.id);
        setTimeout(() => setNewestCsId(null), 5000);
        scheduleNext();
      }, delay);
    };

    scheduleNext();
    return () => clearTimeout(timeoutId);
  }, []);

  const renderSplunkExpanded = (data: SplunkData) => (
    <div className="int-expanded">
      <div className="int-stats-grid">
        <div className="int-stat">
          <span className="int-stat-val">{data.riskScore}</span>
          <span className="int-stat-lbl">Risk Score</span>
        </div>
        <div className="int-stat">
          <span className="int-stat-val">{data.eventsPerSecond.toLocaleString()}</span>
          <span className="int-stat-lbl">EPS</span>
        </div>
        <div className="int-stat">
          <span className="int-stat-val">{data.openIncidents}</span>
          <span className="int-stat-lbl">Open</span>
        </div>
        <div className="int-stat">
          <span className="int-stat-val">{data.dataVolumeGB.toFixed(0)}GB</span>
          <span className="int-stat-lbl">Vol/Day</span>
        </div>
      </div>
      <div className="int-alerts-header">
        <span>Notable Events</span>
        <span className="int-alerts-count">{liveEvents.length}</span>
      </div>
      <div className="int-alerts-list">
        {liveEvents.slice(0, 3).map((alert) => {
          const isNew = alert.id === newestId;
          return (
            <div
              key={alert.id}
              className={`int-alert-item clickable${isNew ? ' int-alert-item--new' : ''}`}
              onClick={() => onAlertClick?.(alert.id, 'splunk')}
            >
              <span
                className="int-alert-sev"
                style={{ background: SEVERITY_COLORS[alert.severity] }}
              />
              <span className="int-alert-title">{alert.title}</span>
              {isNew && <span className="int-alert-unread" />}
              <span className="int-alert-time">{alert.timestamp}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCrowdstrikeExpanded = (data: CrowdStrikeData) => (
    <div className="int-expanded" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div className="int-stats-grid">
        <div className="int-stat">
          <span className="int-stat-val" style={{ color: '#39d353' }}>
            {data.sensorsOnline}
          </span>
          <span className="int-stat-lbl">Online</span>
        </div>
        <div className="int-stat">
          <span className="int-stat-val" style={{ color: data.sensorsOffline > 0 ? '#ff9f1c' : '#39d353' }}>
            {data.sensorsOffline}
          </span>
          <span className="int-stat-lbl">Offline</span>
        </div>
        <div className="int-stat">
          <span className="int-stat-val">{data.preventionsToday}</span>
          <span className="int-stat-lbl">Blocked</span>
        </div>
        <div className="int-stat">
          <span className="int-stat-val">{data.ztaAvgScore}</span>
          <span className="int-stat-lbl">ZTA</span>
        </div>
      </div>
      <div className="int-vuln-bar">
        <span className="int-vuln-lbl">Critical Vulns</span>
        <span className="int-vuln-val" style={{ color: '#f72585' }}>{data.criticalVulns}</span>
      </div>
      <div className="int-alerts-header">
        <span>Detections</span>
        <span className="int-alerts-count">{liveDetections.length}</span>
      </div>
      <div className="int-alerts-list">
        {liveDetections.slice(0, 3).map((alert) => {
          const isNew = alert.id === newestCsId;
          return (
            <div
              key={alert.id}
              className={`int-alert-item clickable${isNew ? ' int-alert-item--new' : ''}`}
              onClick={() => onAlertClick?.(alert.id, 'crowdstrike')}
            >
              <span
                className="int-alert-sev"
                style={{ background: SEVERITY_COLORS[alert.severity] }}
              />
              <span className="int-alert-title">{alert.title}</span>
              {isNew && <span className="int-alert-unread" />}
              <span className="int-alert-time">{alert.timestamp}</span>
            </div>
          );
        })}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <CrowdStrikeIdentityChart />
      </div>
    </div>
  );

  // Render Splunk panel if available
  const renderSplunkPanel = () => {
    if (!integrations.includes('splunk') || !splunkData) return null;
    const meta = INTEGRATION_META.splunk;

    return (
      <div className="panel int-panel-single">
        <div className="ptitle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="tdot" style={{ background: meta.color }} />
          <span>{meta.name}</span>
          <span className="int-type" style={{ borderColor: meta.color, color: meta.color, marginLeft: 'auto' }}>
            {meta.type}
          </span>
        </div>
        {renderSplunkExpanded(splunkData)}
      </div>
    );
  };

  // Render CrowdStrike panel if available
  const renderCrowdStrikePanel = () => {
    if (!integrations.includes('crowdstrike') || !crowdstrikeData) return null;
    const meta = INTEGRATION_META.crowdstrike;

    return (
      <div className="panel int-panel-single" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="ptitle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="tdot" style={{ background: meta.color }} />
          <span>{meta.name}</span>
          <span className="int-type" style={{ borderColor: meta.color, color: meta.color, marginLeft: 'auto' }}>
            {meta.type}
          </span>
        </div>
        {renderCrowdstrikeExpanded(crowdstrikeData)}
      </div>
    );
  };

  return (
    <>
      {renderSplunkPanel()}
      {renderCrowdStrikePanel()}
    </>
  );
}
