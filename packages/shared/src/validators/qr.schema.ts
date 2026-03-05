import { z } from 'zod';

export const GenerateQrTokenSchema = z.object({});

export const ValidateQrTokenSchema = z.object({
  token: z.string().length(64, 'Invalid token format'),
});

export const SubmitQrLeadSchema = z.object({
  tokenId: z.string().min(1),
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/),
  email: z.string().email().optional().or(z.literal('')),
  requirementNotes: z.string().min(10).max(2000),
  city: z.string().min(2).max(100),
  consent: z.literal(true),
});

export type ValidateQrTokenInput = z.infer<typeof ValidateQrTokenSchema>;
export type SubmitQrLeadInput = z.infer<typeof SubmitQrLeadSchema>;
