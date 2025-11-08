import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { sendSuccess, sendError } from '../../utils/response';
import * as payrollService from './payroll.service';

/**
 * Generate payroll
 */
export const generatePayroll = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', 401);
    }

    const payroll = await payrollService.generatePayroll({
      ...req.body,
      generatedBy: req.user.id,
    });
    return sendSuccess(res, 'Payroll generated successfully', payroll, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate payroll';
    return sendError(res, message, 400);
  }
};

/**
 * Get payroll by ID
 */
export const getPayrollById = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { payrollId } = req.params;
    const payroll = await payrollService.getPayrollById(payrollId);
    return sendSuccess(res, 'Payroll retrieved successfully', payroll);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payroll not found';
    return sendError(res, message, 404);
  }
};

/**
 * Get user's payrolls
 */
export const getUserPayrolls = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', 401);
    }

    const userId = req.params.userId || req.user.id;

    // Check if user is accessing their own data or is admin/payroll officer
    if (
      userId !== req.user.id &&
      req.user.role !== 'admin' &&
      req.user.role !== 'payroll_officer'
    ) {
      return sendError(res, 'Access denied', 403);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await payrollService.getUserPayrolls(userId, page, limit);
    return sendSuccess(res, 'Payrolls retrieved successfully', result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get payrolls';
    return sendError(res, message, 500);
  }
};

/**
 * Get payroll by month/year
 */
export const getPayrollByMonth = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', 401);
    }

    const userId = req.params.userId || req.user.id;
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    // Check if user is accessing their own data or is admin/payroll officer
    if (
      userId !== req.user.id &&
      req.user.role !== 'admin' &&
      req.user.role !== 'payroll_officer'
    ) {
      return sendError(res, 'Access denied', 403);
    }

    const payroll = await payrollService.getPayrollByMonth(userId, month, year);

    if (!payroll) {
      return sendSuccess(res, 'No payroll found for this month', null);
    }

    return sendSuccess(res, 'Payroll retrieved successfully', payroll);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get payroll';
    return sendError(res, message, 500);
  }
};

/**
 * Get all payrolls (Payroll officer/Admin only)
 */
export const getAllPayrolls = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await payrollService.getAllPayrolls(month, year, page, limit);
    return sendSuccess(res, 'All payrolls retrieved successfully', result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get payrolls';
    return sendError(res, message, 500);
  }
};

/**
 * Get payroll summary
 */
export const getPayrollSummary = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;

    const summary = await payrollService.getPayrollSummary(month, year);
    return sendSuccess(res, 'Payroll summary retrieved successfully', summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get payroll summary';
    return sendError(res, message, 500);
  }
};

