import { z } from 'zod';

/**
 * Generate payroll validation schema
 */
export const generatePayrollSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID'),
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2000).max(3000),
    basicSalary: z.number().positive('Basic salary must be positive'),
    hra: z.number().min(0).optional(),
    allowances: z.number().min(0).optional(),
  }),
});

/**
 * Get payroll by ID validation schema
 */
export const getPayrollByIdSchema = z.object({
  params: z.object({
    payrollId: z.string().uuid('Invalid payroll ID'),
  }),
});

/**
 * Get user payrolls validation schema
 */
export const getUserPayrollsSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID').optional(),
  }),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

/**
 * Get payroll by month validation schema
 */
export const getPayrollByMonthSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID').optional(),
  }),
  query: z.object({
    month: z.string().optional(),
    year: z.string().optional(),
  }),
});

