export type LeadSource = 'agent_direct' | 'qr_self_entry';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'rejected'
  | 'duplicate'
  | 'converted';

export interface GeoPoint {
  lat: number;
  lng: number;
  accuracy: number;
  capturedAt: Date;
}

export interface LeadStatusEntry {
  status: LeadStatus;
  at: Date;
  by: string; // uid
  note?: string;
}

export interface Lead {
  id: string;
  source: LeadSource;
  agentId: string;
  assignedStaffIds: string[];
  customer: {
    name: string;
    phoneE164: string;
    email?: string;
  };
  requirementNotes: string;
  city: string;
  geo?: GeoPoint; // required for agent_direct
  photos: string[]; // Firebase Storage paths
  duplicateOfLeadId?: string;
  status: {
    current: LeadStatus;
    history: LeadStatusEntry[];
  };
  qc?: {
    notes: string;
    nextFollowUpAt?: Date;
    lastContactAt?: Date;
  };
  incentive?: {
    amount: number;
    ruleId: string;
    earnedAt: Date;
    redeemedAt?: Date;
  };
  createdAt: Date;
  createdBy: string; // uid
}

/** Masked view stored in agentView subcollection */
export interface AgentView {
  agentId: string;
  referenceId: string; // last 6 chars of leadId, uppercase
  maskedName: string;
  maskedPhone: string;
  maskedEmail: string | null;
  source: LeadSource;
  status: LeadStatus;
  incentiveAmount: number;
  city: string;
  createdAt: Date;
}
