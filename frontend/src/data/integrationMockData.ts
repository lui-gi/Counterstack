export const MOCK_SPLUNK_DATA = {
  eventsPerDay: 4_820_000,
  logSources: 142,
  indexedToday: '38.4 GB',
  alerts: {
    triggered: 17,
    suppressed: 203,
  },
  topSources: [
    { name: 'windows-events', count: 1_840_000 },
    { name: 'palo-alto-fw',   count: 920_000  },
    { name: 'crowdstrike-edr',count: 680_000  },
    { name: 'aws-cloudtrail', count: 540_000  },
    { name: 'linux-syslog',   count: 320_000  },
  ],
};

export const MOCK_CROWDSTRIKE_DATA = {
  coveragePct: 94,
  detections: {
    today: 23,
    week: 187,
  },
  preventions: {
    today: 41,
    week: 312,
  },
  identity: {
    mfaEnrolled: 96.4,     // percentage
    privilegedAccounts: 38,
    riskyUsers: 7,
    staleAccounts: 22,
  },
};
