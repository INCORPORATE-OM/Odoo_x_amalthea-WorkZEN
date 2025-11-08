import { z } from 'zod';

/**
 * Create user validation schema
 */
export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['admin', 'employee', 'hr_officer', 'payroll_officer']),
    phone: z.string().optional(),
    department: z.string().optional(),
    designation: z.string().optional(),
  }),
});

/**
 * Update user validation schema
 */
export const updateUserSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID'),
  }),
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email format').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    role: z.enum(['admin', 'employee', 'hr_officer', 'payroll_officer']).optional(),
    phone: z.string().optional(),
    department: z.string().optional(),
    designation: z.string().optional(),
    bankAccountNumber: z.string().optional(),
    bankName: z.string().optional(),
    ifscCode: z.string().optional(),
    accountHolderName: z.string().optional(),
  }),
});

/**
 * Get user by ID validation schema
 */
export const getUserByIdSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID'),
  }),
});

/**
 * Delete user validation schema
 */
export const deleteUserSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID'),
  }),
});

