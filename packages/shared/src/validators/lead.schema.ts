import { z } from 'zod';

const GeoSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().min(0),
  capturedAt: z.string().datetime(),
});

export const AgentLeadSchema = z.object({
  requirementNotes: z.string().min(10).max(2000),
  city: z.string().min(2).max(100),
  geo: GeoSchema,
  photoStoragePaths: z
    .array(z.string().min(1))
    .min(1, 'At least 1 photo required')
    .max(3, 'Maximum 3 photos'),
  customerConsent: z.literal(true, {
    errorMap: () => ({ message: 'Customer consent is required' }),
  }),
});

export const AgentDirectLeadSchema = z.object({
  customerName: z.string().min(2).max(100),
  customerPhone: z.string().regex(/^\+[1-9]\d{7,14}$/, 'Invalid phone number (E.164 format required)'),
  customerEmail: z.string().email().optional().or(z.literal('')),
  requirementNotes: z.string().min(10).max(2000),
  city: z.string().min(2).max(100),
  geo: GeoSchema,
  photoStoragePaths: z
    .array(z.string().min(1))
    .min(1, 'At least 1 photo required')
    .max(3, 'Maximum 3 photos'),
  services: z.array(z.string().min(1)).default([]),
  agentNotes: z.string().max(2000).optional().or(z.literal('')),
  customerConsent: z.literal(true, {
    errorMap: () => ({ message: 'Customer consent is required' }),
  }),
});

export const QrLeadSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/, 'Invalid phone number (E.164 format required)'),
  email: z.string().email().optional().or(z.literal('')),
  requirementNotes: z.string().min(10).max(2000),
  city: z.string().min(2).max(100),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Consent is required' }),
  }),
});

export type AgentLeadInput = z.infer<typeof AgentLeadSchema>;
export type AgentDirectLeadInput = z.infer<typeof AgentDirectLeadSchema>;
export type QrLeadInput = z.infer<typeof QrLeadSchema>;
