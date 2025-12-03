import { z } from 'zod';

export const createServiceSchema = z.object({
  body: z.object({
    serviceCode: z.string().min(1, 'Service code is required'),
    serviceName: z.string().min(1, 'Service name is required'),
    category: z.enum(['CONSULTATION', 'LABORATORY', 'PHARMACY', 'PROCEDURE', 'NURSING', 'RADIOLOGY', 'OTHER']),
    description: z.string().optional(),
    unitPrice: z.coerce.number().min(0, 'Price must be positive'),
    isActive: z.boolean().optional(),
  }),
});

export const updateServiceSchema = z.object({
  body: z.object({
    serviceCode: z.string().min(1).optional(),
    serviceName: z.string().min(1).optional(),
    category: z.enum(['CONSULTATION', 'LABORATORY', 'PHARMACY', 'PROCEDURE', 'NURSING', 'RADIOLOGY', 'OTHER']).optional(),
    description: z.string().optional(),
    unitPrice: z.coerce.number().min(0).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const chargeServiceSchema = z.object({
  body: z.object({
    visitId: z.string().uuid('Invalid visit ID'),
    serviceId: z.string().uuid('Invalid service ID'),
    quantity: z.coerce.number().int().positive().optional(),
    notes: z.string().optional(),
  }),
});
