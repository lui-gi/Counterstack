export interface ScoredCve {
  cveId: string;
  name: string;
  description: string;
  cvssScore: number;
  threatScore: number;
  affectedVendor: string;
  affectedProduct: string;
  knownRansomware?: boolean;
  dateAdded?: string;
}
