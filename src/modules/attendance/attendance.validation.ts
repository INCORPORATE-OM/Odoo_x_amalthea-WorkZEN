import { z } from 'zod';

/**
 * Get monthly logs validation schema
 */
export const getMonthlyLogsSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID').optional(),
  }),
  query: z.object({
    year: z.string().optional(),
    month: z.string().optional(),
  }),
});

/**
 * Get attendance summary validation schema
 */
export const getAttendanceSummarySchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID').optional(),
  }),
  query: z.object({
    year: z.string().optional(),
    month: z.string().optional(),
  }),
});

