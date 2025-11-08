import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { sendSuccess, sendError } from '../../utils/response';
import * as dashboardService from './dashboard.service';

/**
 * Get attendance summary
 */
export const getAttendanceSummary = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const userId = req.query.userId as string | undefined;
    const summary = await dashboardService.getAttendanceSummary(userId);
    return sendSuccess(res, 'Attendance summary retrieved successfully', summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get attendance summary';
    return sendError(res, message, 500);
  }
};

/**
 * Get leaves summary
 */
export const getLeavesSummary = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const userId = req.query.userId as string | undefined;
    const summary = await dashboardService.getLeavesSummary(userId);
    return sendSuccess(res, 'Leaves summary retrieved successfully', summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get leaves summary';
    return sendError(res, message, 500);
  }
};

/**
 * Get payroll summary
 */
export const getPayrollSummary = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const summary = await dashboardService.getPayrollSummary();
    return sendSuccess(res, 'Payroll summary retrieved successfully', summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get payroll summary';
    return sendError(res, message, 500);
  }
};

/**
 * Get organization metrics (Admin/HR only)
 */
export const getOrganizationMetrics = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const metrics = await dashboardService.getOrganizationMetrics();
    return sendSuccess(res, 'Organization metrics retrieved successfully', metrics);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get organization metrics';
    return sendError(res, message, 500);
  }
};

/**
 * Get employee dashboard
 */
export const getEmployeeDashboard = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', 401);
    }

    const userId = req.params.userId || req.user.id;

    // Check if user is accessing their own data or is admin/hr
    if (userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'hr_officer') {
      return sendError(res, 'Access denied', 403);
    }

    const dashboard = await dashboardService.getEmployeeDashboard(userId);
    return sendSuccess(res, 'Employee dashboard retrieved successfully', dashboard);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get employee dashboard';
    return sendError(res, message, 500);
  }
};

