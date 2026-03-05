/**
 * Typed Firestore collection references.
 * Import from client SDK or admin SDK depending on context.
 */
import type {
  Firestore,
  CollectionReference,
  DocumentReference,
  Query,
} from 'firebase/firestore';

// These collection names are the single source of truth
export const COLLECTIONS = {
  USERS: 'users',
  LEADS: 'leads',
  AGENT_VIEW: 'agentView',
  QR_TOKENS: 'qrTokens',
  INCENTIVE_LEDGER: 'incentiveLedger',
  INCENTIVE_LEDGER_TRANSACTIONS: 'transactions',
  INCENTIVE_RULES: 'incentiveRules',
  AUDITS: 'audits',
} as const;
