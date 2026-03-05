export type UserRole = 'superadmin' | 'admin' | 'staff' | 'agent';
export type AgentStatus = 'pending' | 'approved' | 'rejected' | 'deactivated';

export interface UserDoc {
  uid: string;
  role: UserRole;
  phone: string; // E.164
  name: string;
  status?: AgentStatus; // agents only
  createdAt: Date;
  lastLoginAt: Date;
  metadata?: {
    city?: string;
    district?: string;
    idProofStoragePath?: string;
  };
}

export interface CustomClaims {
  role: UserRole;
  status?: AgentStatus;
}
