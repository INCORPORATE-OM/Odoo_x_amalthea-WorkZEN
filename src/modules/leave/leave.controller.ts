import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { sendSuccess, sendError } from '../../utils/response';
import * as leaveService from './leave.service';

/**
 * Apply for leave
 */
export const applyForLeave = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', 401);
    }

    const leave = await leaveService.applyForLeave({
      ...req.body,
      userId: req.user.id,
    });
    return sendSuccess(res, 'Leave application submitted successfully', leave, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to apply for leave';
    return sendError(res, message, 400);
  }
};

/**
 * Get user's leaves
 */
export const getUserLeaves = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', 401);
    }

    const userId = req.params.userId || req.user.id;

    // Check if user is accessing their own data or is admin/hr
    if (userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'hr_officer') {
      return sendError(res, 'Access denied', 403);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await leaveService.getUserLeaves(userId, page, limit);
    return sendSuccess(res, 'Leaves retrieved successfully', result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get leaves';
    return sendError(res, message, 500);
  }
};

/**
 * Get pending leaves (Payroll officer/Admin only)
 */
export const getPendingLeaves = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await leaveService.getPendingLeaves(page, limit);
    return sendSuccess(res, 'Pending leaves retrieved successfully', result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get pending leaves';
    return sendError(res, message, 500);
  }
};

/**
 * Get leave by ID
 */
export const getLeaveById = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { leaveId } = req.params;
    const leave = await leaveService.getLeaveById(leaveId);
    return sendSuccess(res, 'Leave retrieved successfully', leave);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Leave not found';
    return sendError(res, message, 404);
  }
};

/**
 * Approve or reject leave
 */
export const updateLeaveStatus = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', 401);
    }

    const { leaveId } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return sendError(res, 'Invalid status. Must be approved or rejected', 400);
    }

    const leave = await leaveService.updateLeaveStatus({
      leaveId,
      status,
      approvedBy: req.user.id,
    });

    return sendSuccess(res, `Leave ${status} successfully`, leave);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update leave status';
    return sendError(res, message, 400);
  }
};

/**
 * Get leave history (Admin/HR only)
 */
export const getLeaveHistory = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await leaveService.getLeaveHistory(page, limit);
    return sendSuccess(res, 'Leave history retrieved successfully', result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get leave history';
    return sendError(res, message, 500);
  }
};

/**
 * Get leave summary
 */
export const getLeaveSummary = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', 401);
    }

    const userId = req.params.userId || req.user.id;

    // Check if user is accessing their own data or is admin/hr
    if (userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'hr_officer') {
      return sendError(res, 'Access denied', 403);
    }

    const summary = await leaveService.getLeaveSummary(userId);
    return sendSuccess(res, 'Leave summary retrieved successfully', summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get leave summary';
    return sendError(res, message, 500);
  }
};

