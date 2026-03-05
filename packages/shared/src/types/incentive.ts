export interface IncentiveLedger {
  agentId: string;
  totalEarned: number;
  totalRedeemed: number;
  balance: number; // computed: totalEarned - totalRedeemed
}

export type TransactionType = 'earn' | 'redeem';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  leadId?: string; // present for type=earn
  createdAt: Date;
  note: string;
  redeemedBy?: string; // admin uid for type=redeem
}

export interface IncentiveRule {
  id: string;
  name: string;
  baseAmount: number; // per qualified lead (INR)
  convertedBonus: number; // additional on converted
  effectiveFrom: Date;
  effectiveTo: Date | null; // null = active indefinitely
  createdBy: string;
  active: boolean;
}
