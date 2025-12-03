import { z } from 'zod';

const prescriptionItemSchema = z.object({
  drugId: z.string().uuid('Invalid drug ID').optional(),
  drugName: z.string().min(1, 'Drug name is required').optional(),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.string().min(1, 'Duration is required'),
  quantity: z.coerce.number().int().positive('Quantity must be positive'),
  instructions: z.string().optional(),
}).refine(data => data.drugId || data.drugName, {
  message: 'Either drugId or drugName is required',
});

export const createPrescriptionSchema = z.object({
  body: z.object({
    consultationId: z.string().uuid('Invalid consultation ID'),
    patientId: z.string().uuid('Invalid patient ID').optional(),
    visitId: z.string().uuid('Invalid visit ID').optional(),
    items: z.array(prescriptionItemSchema).min(1, 'At least one item is required'),
    instructions: z.string().optional(),
  }),
});

export const updatePrescriptionSchema = z.object({
  body: z.object({
    dosage: z.string().optional(),
    frequency: z.string().optional(),
    duration: z.string().optional(),
    quantity: z.coerce.number().int().positive().optional(),
    instructions: z.string().optional(),
    status: z.enum(['PENDING', 'DISPENSED', 'CANCELLED']).optional(),
  }),
});

export const dispensePrescriptionSchema = z.object({
  body: z.object({
    notes: z.string().optional(),
  }).optional(),
});
