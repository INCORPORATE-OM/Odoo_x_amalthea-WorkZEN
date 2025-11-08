import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { sendSuccess, sendError } from '../../utils/response';
import * as attendanceService from './attendance.service';

/**
 * Mark check-in
 */
export const markCheckIn = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', 401);
    }

    const attendance = await attendanceService.markCheckIn(req.user.id);
    return sendSuccess(res, 'Check-in successful', attendance);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to mark check-in';
    return sendError(res, message, 400);
  }
};

/**
 * Mark check-out
 */
export const markCheckOut = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', 401);
    }

    const attendance = await attendanceService.markCheckOut(req.user.id);
    return sendSuccess(res, 'Check-out successful', attendance);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to mark check-out';
    return sendError(res, message, 400);
  }
};

/**
 * Get daily attendance log
 */
export const getDailyLog = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', 401);
    }

    const date = req.query.date ? new Date(req.query.date as string) : new Date();
    const attendance = await attendanceService.getDailyLogs(req.user.id, date);
    
    if (!attendance) {
      return sendSuccess(res, 'No attendance record found for this date', null);
    }

    return sendSuccess(res, 'Attendance retrieved successfully', attendance);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get attendance';
    return sendError(res, message, 500);
  }
};

/**
 * Get monthly attendance logs
 */
export const getMonthlyLogs = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', 401);
    }

    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const userId = req.params.userId || req.user.id;

    // Check if user is accessing their own data or is admin/hr
    if (userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'hr_officer') {
      return sendError(res, 'Access denied', 403);
    }

    const logs = await attendanceService.getMonthlyLogs(userId, year, month);
    return sendSuccess(res, 'Monthly attendance logs retrieved successfully', logs);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get monthly logs';
    return sendError(res, message, 500);
  }
};

/**
 * Get all employees' attendance (HR/Admin only)
 */
export const getAllEmployeesAttendance = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    let date: Date | undefined;
    if (req.query.date) {
      // Parse the date string and normalize to start of day
      date = new Date(req.query.date as string);
      date.setHours(0, 0, 0, 0);
    }
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await attendanceService.getAllEmployeesAttendance(date, page, limit);
    return sendSuccess(res, 'All employees attendance retrieved successfully', result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get attendance';
    return sendError(res, message, 500);
  }
};

/**
 * Get attendance summary
 */
export const getAttendanceSummary = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', 401);
    }

    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const userId = req.params.userId || req.user.id;

    // Check if user is accessing their own data or is admin/hr
    if (userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'hr_officer') {
      return sendError(res, 'Access denied', 403);
    }

    const summary = await attendanceService.getAttendanceSummary(userId, year, month);
    return sendSuccess(res, 'Attendance summary retrieved successfully', summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get attendance summary';
    return sendError(res, message, 500);
  }
};

