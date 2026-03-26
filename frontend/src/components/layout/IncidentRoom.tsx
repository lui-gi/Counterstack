import { XIcon } from './Icons';
import type { ScoredCve } from '../../interfaces/ScoredCve.interface';

interface IncidentRoomProps {
  cve: ScoredCve;
  threatPct: number | null;
  reasoning: string;
  onClose: () => void;
}

const CWE_MAP: Record<string, string> = {
  injection:        'INJECTION',
  rce:              'REMOTE CODE EXEC',
  'buffer overflow':'BUFFER OVERFLOW',
  authentication:   'AUTH BYPASS',
  privilege:        'PRIVILEGE ESC',
  xss:              'XSS',
  sql:              'SQL INJECTION',
  'path traversal': 'PATH TRAVERSAL',
};

function getCweLabels(desc: string): string[] {
  const d = desc.toLowerCase();
  return Object.entries(CWE_MAP)
    .filter(([k]) => d.includes(k))
    .map(([, v]) => v)
    .slice(0, 4);
}

const CHECKLIST = [
  'Identify all affected systems in asset inventory',
  'Apply vendor patch or workaround immediately',
  'Enable enhanced logging on affected services',
  'Review access logs for exploitation indicators',
  'Notify incident response team if IOCs detected',
  'Test in staging before production deployment',
];

export function IncidentRoom({ cve, threatPct, reasoning, onClose }: IncidentRoomProps) {
  const pct = threatPct ?? cve.threatScore;
  const pctColor =
    pct > 80 ? '#f72585'
    : pct > 60 ? '#ff9f1c'
    : pct > 40 ? '#ffd700'
    : '#39d353';
  const cwes = getCweLabels(cve.description);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(6,10,15,0.9)',
        zIndex: 800,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        className="panel fade-in"
        style={{ width: 520, maxHeight: '80vh', overflowY: 'auto', borderColor: '#f7258544' }}
      >
        {/* Title row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--fh)',
                fontSize: 11,
                color: 'var(--dim)',
                letterSpacing: '0.1em',
              }}
            >
              INCIDENT ROOM
            </div>
            <div
              style={{ fontFamily: 'var(--fh)', fontSize: 16, color: '#f72585', marginTop: 2 }}
            >
              {cve.cveId}
            </div>
            <div style={{ fontSize: 12, color: '#cdd9e5', marginTop: 4 }}>{cve.name}</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dim)' }}
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* CVSS + vendor */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div
            style={{
              background: `${pctColor}22`,
              border: `1px solid ${pctColor}55`,
              borderRadius: 6,
              padding: '4px 10px',
              fontFamily: 'var(--fh)',
              fontSize: 13,
              color: pctColor,
            }}
          >
            CVSS {cve.cvssScore.toFixed(1)}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--dim)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <div>
              {cve.affectedVendor} / {cve.affectedProduct}
            </div>
            {cve.knownRansomware && (
              <div style={{ color: '#f72585', fontSize: 10 }}>⚠ KNOWN RANSOMWARE CAMPAIGN</div>
            )}
          </div>
        </div>

        {/* Org threat exposure */}
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 4,
              fontSize: 10,
            }}
          >
            <span style={{ color: 'var(--dim)' }}>ORG THREAT EXPOSURE</span>
            <span style={{ color: pctColor, fontFamily: 'var(--fh)' }}>{pct}%</span>
          </div>
          <div style={{ height: 6, background: '#1a2332', borderRadius: 3 }}>
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                background: pctColor,
                borderRadius: 3,
                transition: 'width 0.5s',
              }}
            />
          </div>
          <div style={{ fontSize: 9, color: pctColor, marginTop: 2 }}>
            {pct > 80 ? 'CRITICAL' : pct > 60 ? 'HIGH' : pct > 40 ? 'MEDIUM' : 'LOW'} THREAT
          </div>
        </div>

        {/* CWE tags */}
        {cwes.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {cwes.map(c => (
              <div
                key={c}
                style={{
                  background: '#f7258511',
                  border: '1px solid #f7258533',
                  borderRadius: 4,
                  padding: '2px 6px',
                  fontSize: 9,
                  color: '#f72585',
                  letterSpacing: '0.08em',
                }}
              >
                {c}
              </div>
            ))}
          </div>
        )}

        {/* Reasoning */}
        {reasoning && (
          <div
            style={{
              marginBottom: 12,
              padding: '8px 10px',
              background: '#0d1117',
              borderRadius: 6,
              fontSize: 11,
              color: 'var(--dim)',
              borderLeft: '2px solid #a78bfa',
            }}
          >
            {reasoning}
          </div>
        )}

        {/* Description */}
        <div style={{ marginBottom: 12, fontSize: 11, color: 'var(--dim)' }}>
          {cve.description}
        </div>

        {/* Containment checklist */}
        <div>
          <div className="panel-header">CONTAINMENT CHECKLIST</div>
          {CHECKLIST.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: 11 }}>
              <span style={{ color: '#00d4ff' }}>□</span>
              <span style={{ color: 'var(--dim)' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
