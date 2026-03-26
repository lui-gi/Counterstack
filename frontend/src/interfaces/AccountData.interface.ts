export interface AccountData {
  tier: 'dealers' | 'underground' | 'convention' | '';
  orgName: string;
  industry?: string;
  employeeCount?: string;
  infraType?: string;
  integrations: string[];
}
