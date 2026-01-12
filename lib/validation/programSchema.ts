import { z } from 'zod';

export const registrationSchema = z.object({
  studentName: z.string().min(2, 'Name must be at least 2 characters'),
  studentId: z.string().regex(/^STU\d{3}$/, 'Invalid student ID format (e.g., STU001)'),
  parentName: z.string().min(2, 'Parent name is required'),
  parentEmail: z.string().email('Invalid email address'),
  parentPhone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number'),
});

export const programSchema = z.object({
  name: z.string().min(3, 'Program name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  startDate: z.string().refine((date) => new Date(date) > new Date(), {
    message: 'Start date must be in the future',
  }),
  endDate: z.string(),
  registrationDeadline: z.string(),
  cost: z.number().min(0, 'Cost must be positive'),
  requirements: z.array(z.string()),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
}).refine((data) => new Date(data.registrationDeadline) < new Date(data.startDate), {
  message: 'Registration deadline must be before start date',
  path: ['registrationDeadline'],
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;
export type ProgramFormData = z.infer<typeof programSchema>;
