import { z } from 'zod';

export const createVisitSchema = z.object({
  body: z.object({
    patientId: z.string().uuid(),
    visitType: z.enum(['OPD', 'EMERGENCY', 'FOLLOW_UP', 'REFERRAL']),
    chiefComplaint: z.string().min(1),
    symptoms: z.string().optional(),
  }),
});

export const updateVisitSchema = z.object({
  body: z.object({
    status: z.enum(['CHECKED_IN', 'IN_TRIAGE', 'WITH_DOCTOR', 'WITH_LAB', 'WITH_PHARMACY', 'BILLING', 'COMPLETED', 'CANCELLED']).optional(),
    chiefComplaint: z.string().optional(),
    symptoms: z.string().optional(),
    notes: z.string().optional(),
  }),
});
