export interface AccountData {
  // Authentication fields (set when user logs in or creates account)
  id?: string;
  email?: string;
  name?: string;
  token?: string;
  
  // Organization/tier fields
  tier?: 'dealers' | 'underground' | 'convention' | '';
  orgName?: string;
  industry?: string;
  employeeCount?: string;
  infraType?: string;
  integrations?: string[];
}
