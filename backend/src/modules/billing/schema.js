import { z } from 'zod';

// Bill schemas
export const createBillSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  items: z.array(z.object({
    itemType: z.enum(['CONSULTATION', 'MEDICATION', 'LAB_TEST', 'PROCEDURE']),
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().int().positive().default(1),
    unitPrice: z.number().min(0, 'Price must be positive'),
  })).min(1, 'At least one item is required'),
  notes: z.string().optional(),
});

export const updateBillSchema = z.object({
  status: z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED']).optional(),
  notes: z.string().optional(),
});

// Payment schemas
export const createPaymentSchema = z.object({
  billId: z.string().uuid('Invalid bill ID'),
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.enum(['CASH', 'CARD', 'INSURANCE', 'MOBILE_MONEY']),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

// Query schemas
export const billQuerySchema = z.object({
  patientId: z.string().uuid().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
