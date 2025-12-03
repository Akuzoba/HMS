import { z } from 'zod';

export const createConsultationSchema = z.object({
  body: z.object({
    visitId: z.string().uuid('Invalid visit ID'),
    chiefComplaint: z.string().min(1, 'Chief complaint is required'),
    historyOfPresentingIllness: z.string().optional(),
    pastMedicalHistory: z.string().optional(),
    examination: z.string().optional(),
    provisionalDiagnosis: z.string().optional(),
    finalDiagnosis: z.string().optional(),
    treatmentPlan: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updateConsultationSchema = z.object({
  body: z.object({
    chiefComplaint: z.string().min(1).optional(),
    historyOfPresentingIllness: z.string().optional(),
    pastMedicalHistory: z.string().optional(),
    examination: z.string().optional(),
    provisionalDiagnosis: z.string().optional(),
    finalDiagnosis: z.string().optional(),
    treatmentPlan: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const addDiagnosisSchema = z.object({
  body: z.object({
    icdCode: z.string().min(1, 'ICD code is required'),
    description: z.string().min(1, 'Diagnosis description is required'),
    type: z.enum(['PROVISIONAL', 'FINAL'], {
      errorMap: () => ({ message: 'Type must be PROVISIONAL or FINAL' }),
    }),
  }),
});
