import { z } from 'zod';

export const createPatientSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required'),
    middleName: z.string().optional(),
    lastName: z.string().min(1, 'Last name is required'),
    dateOfBirth: z.string().datetime('Invalid date format'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { required_error: 'Gender is required' }),
    phoneNumber: z.string().min(10, 'Valid phone number required'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    address: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    emergencyContact: z.string().optional(),
    emergencyPhone: z.string().optional(),
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
    allergies: z.string().optional(),
    chronicConditions: z.string().optional(),
    insuranceProvider: z.string().optional(),
    insuranceNumber: z.string().optional()
  })
});

export const updatePatientSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid patient ID')
  }),
  body: z.object({
    firstName: z.string().min(1).optional(),
    middleName: z.string().optional(),
    lastName: z.string().min(1).optional(),
    phoneNumber: z.string().min(10).optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    emergencyContact: z.string().optional(),
    emergencyPhone: z.string().optional(),
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
    allergies: z.string().optional(),
    chronicConditions: z.string().optional(),
    insuranceProvider: z.string().optional(),
    insuranceNumber: z.string().optional()
  })
});

export const searchPatientSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query required'),
    page: z.string().optional(),
    limit: z.string().optional()
  })
});
