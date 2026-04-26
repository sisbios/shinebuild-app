export type UserRole = 'superadmin' | 'admin' | 'staff' | 'agent';
export type AgentStatus = 'pending' | 'approved' | 'rejected' | 'deactivated' | 'deleted';

export interface UserDoc {
  uid: string;
  role: UserRole;
  phone: string; // E.164
  name: string;
  status?: AgentStatus; // agents only
  directEntryEnabled?: boolean; // agents only — superadmin-controlled, allows direct lead entry without customer QR scan
  createdAt: Date;
  lastLoginAt: Date;
  deletedAt?: Date;
  deletedBy?: string;
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
