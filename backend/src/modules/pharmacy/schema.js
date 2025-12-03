import { z } from 'zod';

export const createDrugSchema = z.object({
  body: z.object({
    drugName: z.string().min(1, 'Drug name is required'),
    genericName: z.string().optional(),
    category: z.string().min(1, 'Category is required'),
    dosageForm: z.string().optional(),
    strength: z.string().optional(),
    unitPrice: z.coerce.number().positive('Price must be positive'),
    stockQuantity: z.coerce.number().int().min(0, 'Stock cannot be negative'),
    reorderLevel: z.coerce.number().int().positive('Reorder level must be positive'),
    expiryDate: z.string().optional(),
    manufacturer: z.string().optional(),
  }),
});

export const updateDrugSchema = z.object({
  body: z.object({
    drugName: z.string().optional(),
    genericName: z.string().optional(),
    category: z.string().optional(),
    dosageForm: z.string().optional(),
    strength: z.string().optional(),
    unitPrice: z.coerce.number().positive().optional(),
    stockQuantity: z.coerce.number().int().min(0).optional(),
    reorderLevel: z.coerce.number().int().positive().optional(),
    expiryDate: z.string().optional(),
    manufacturer: z.string().optional(),
  }),
});
