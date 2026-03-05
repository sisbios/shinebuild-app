import { z } from 'zod';

export const AgentRegisterSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/, 'Invalid phone number'),
  city: z.string().min(2).max(100),
  district: z.string().min(2).max(100).optional(),
});

export const SetUserRoleSchema = z.object({
  targetUid: z.string().min(1),
  role: z.enum(['superadmin', 'admin', 'staff', 'agent']),
});

export type AgentRegisterInput = z.infer<typeof AgentRegisterSchema>;
export type SetUserRoleInput = z.infer<typeof SetUserRoleSchema>;
