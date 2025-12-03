import { z } from 'zod';

export const createVitalSchema = z.object({
  body: z.object({
    visitId: z.string().uuid(),
    temperature: z.number().min(20).max(50).optional(),
    bloodPressureSystolic: z.number().min(50).max(300).optional(),
    bloodPressureDiastolic: z.number().min(30).max(200).optional(),
    heartRate: z.number().min(20).max(300).optional(),
    respiratoryRate: z.number().min(5).max(60).optional(),
    oxygenSaturation: z.number().min(0).max(100).optional(),
    weight: z.number().min(0).max(500).optional(),
    height: z.number().min(0).max(300).optional(),
    bmi: z.number().min(0).max(100).optional(),
    notes: z.string().optional(),
  }),
});

export const updateVitalSchema = z.object({
  body: z.object({
    temperature: z.number().min(20).max(50).optional(),
    bloodPressureSystolic: z.number().min(50).max(300).optional(),
    bloodPressureDiastolic: z.number().min(30).max(200).optional(),
    heartRate: z.number().min(20).max(300).optional(),
    respiratoryRate: z.number().min(5).max(60).optional(),
    oxygenSaturation: z.number().min(0).max(100).optional(),
    weight: z.number().min(0).max(500).optional(),
    height: z.number().min(0).max(300).optional(),
    bmi: z.number().min(0).max(100).optional(),
    notes: z.string().optional(),
  }),
});