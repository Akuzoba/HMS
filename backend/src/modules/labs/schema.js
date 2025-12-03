import { z } from 'zod';

// Lab Test schemas
export const createLabTestSchema = z.object({
  testCode: z.string().min(1, 'Test code is required'),
  testName: z.string().min(1, 'Test name is required'),
  category: z.enum(['HEMATOLOGY', 'BIOCHEMISTRY', 'MICROBIOLOGY', 'RADIOLOGY', 'URINALYSIS', 'OTHER']).optional(),
  description: z.string().optional(),
  sampleType: z.string().optional(),
  normalRange: z.string().optional(),
  unit: z.string().optional(),
  price: z.number().min(0).default(0),
  turnaroundTime: z.number().int().positive().optional(), // In hours
});

export const updateLabTestSchema = createLabTestSchema.partial();

// Lab Order schemas
export const createLabOrderSchema = z.object({
  consultationId: z.string().uuid('Invalid consultation ID'),
  patientId: z.string().uuid('Invalid patient ID'),
  priority: z.enum(['ROUTINE', 'URGENT', 'STAT']).default('ROUTINE'),
  clinicalNotes: z.string().optional(),
  tests: z.array(z.object({
    labTestId: z.string().uuid('Invalid lab test ID'),
  })).min(1, 'At least one test is required'),
});

export const updateLabOrderSchema = z.object({
  priority: z.enum(['ROUTINE', 'URGENT', 'STAT']).optional(),
  status: z.enum(['PENDING', 'SAMPLE_COLLECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  clinicalNotes: z.string().optional(),
});

// Lab Result schemas
export const submitLabResultSchema = z.object({
  labOrderId: z.string().uuid('Invalid lab order ID'),
  results: z.array(z.object({
    testName: z.string().min(1, 'Test name is required'),
    result: z.string().min(1, 'Result is required'),
    unit: z.string().optional(),
    normalRange: z.string().optional(),
    flag: z.enum(['NORMAL', 'HIGH', 'LOW', 'CRITICAL']).optional(),
    notes: z.string().optional(),
  })).min(1, 'At least one result is required'),
  performedBy: z.string().optional(),
});

export const verifyLabResultSchema = z.object({
  verifiedBy: z.string().min(1, 'Verifier name/ID is required'),
  notes: z.string().optional(),
});

// Query schemas
export const labOrderQuerySchema = z.object({
  patientId: z.string().uuid().optional(),
  status: z.string().optional(),
  priority: z.enum(['ROUTINE', 'URGENT', 'STAT']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const labTestQuerySchema = z.object({
  category: z.enum(['HEMATOLOGY', 'BIOCHEMISTRY', 'MICROBIOLOGY', 'RADIOLOGY', 'URINALYSIS', 'OTHER']).optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});
