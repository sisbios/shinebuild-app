/**
 * Firebase Cloud Functions v2 — Shine Build Hub
 * All functions use onCall with App Check enforcement.
 * Set FUNCTIONS_EMULATOR=true in env to disable App Check for local testing.
 */

const enforceAppCheck = process.env['FUNCTIONS_EMULATOR'] !== 'true';
const region = 'asia-south1';

export { generateQrToken } from './qr/generateQrToken.js';
export { validateQrToken } from './qr/validateQrToken.js';
export { submitAgentLead } from './leads/submitAgentLead.js';
export { submitQrLead } from './leads/submitQrLead.js';
export { updateLeadStatus } from './leads/updateLeadStatus.js';
export { getAgentLeads } from './leads/getAgentLeads.js';
export { approveAgent } from './agents/approveAgent.js';
export { setUserRole } from './admin/setUserRole.js';
export { exportReport } from './admin/exportReport.js';
export { redeemIncentive } from './incentives/redeemIncentive.js';
