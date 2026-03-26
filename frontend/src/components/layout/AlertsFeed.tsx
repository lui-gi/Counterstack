import type { IntegrationAlert } from '../../interfaces';
import { SEVERITY_COLORS, SOURCE_COLORS } from '../../data/integrationMockData';

interface AlertsFeedProps {
  alerts: IntegrationAlert[];
  onAlertClick?: (alert: IntegrationAlert) => void;
  maxItems?: number;
}

export default function AlertsFeed({ alerts, onAlertClick, maxItems = 8 }: AlertsFeedProps) {
  const displayAlerts = alerts.slice(0, maxItems);

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const highCount = alerts.filter((a) => a.severity === 'high').length;

  return (
    <div className="panel alerts-feed">
      <div className="ptitle alerts-feed-header">
        <span>Live Alerts</span>
        <div className="alerts-summary">
          {criticalCount > 0 && (
            <span className="alert-badge critical">{criticalCount} CRIT</span>
          )}
          {highCount > 0 && (
            <span className="alert-badge high">{highCount} HIGH</span>
          )}
        </div>
      </div>
      <div className="alerts-list">
        {displayAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`alert-row clickable ${alert.status}`}
            onClick={() => onAlertClick?.(alert)}
          >
            <div className="alert-left">
              <span
                className="alert-sev-dot"
                style={{ background: SEVERITY_COLORS[alert.severity] }}
              />
              <span
                className="alert-source"
                style={{ color: SOURCE_COLORS[alert.source] }}
              >
                {alert.source === 'crowdstrike' ? 'CS' : alert.source.slice(0, 3).toUpperCase()}
              </span>
            </div>
            <div className="alert-content">
              <div className="alert-title">{alert.title}</div>
              <div className="alert-meta">
                {alert.hostname && <span className="alert-host">{alert.hostname}</span>}
                {alert.technique && (
                  <span className="alert-mitre">{alert.technique}</span>
                )}
              </div>
            </div>
            <div className="alert-right">
              <span className="alert-time">{alert.timestamp}</span>
              <span className={`alert-status ${alert.status}`}>
                {alert.status === 'new' ? 'NEW' : alert.status === 'acknowledged' ? 'ACK' : 'RES'}
              </span>
            </div>
          </div>
        ))}
      </div>
      {alerts.length > maxItems && (
        <div className="alerts-more">
          +{alerts.length - maxItems} more alerts
        </div>
      )}
    </div>
  );
}
