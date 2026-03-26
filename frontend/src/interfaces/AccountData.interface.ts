export interface AccountData {
  userId: string;
  orgId: string;
  orgName: string;
  tier: 'dealers' | 'underground' | 'convention';
  integrations: string[];
  token: string;
  industry?: string;
  employeeCount?: string;
  infraType?: string;
}
