import { z } from 'zod';

/**
 * Apply for leave validation schema
 */
export const applyForLeaveSchema = z.object({
  body: z.object({
    leaveType: z.enum(['casual', 'sick', 'annual', 'unpaid']),
    startDate: z.string().transform((str) => new Date(str)),
    endDate: z.string().transform((str) => new Date(str)),
    reason: z.string().optional(),
  }),
});

/**
 * Update leave status validation schema
 */
export const updateLeaveStatusSchema = z.object({
  params: z.object({
    leaveId: z.string().uuid('Invalid leave ID'),
  }),
  body: z.object({
    status: z.enum(['approved', 'rejected']),
  }),
});

/**
 * Get leave by ID validation schema
 */
export const getLeaveByIdSchema = z.object({
  params: z.object({
    leaveId: z.string().uuid('Invalid leave ID'),
  }),
});

/**
 * Get user leaves validation schema
 */
export const getUserLeavesSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID').optional(),
  }),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

