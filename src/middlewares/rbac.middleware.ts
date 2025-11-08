import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { sendError } from '../utils/response';

type Role = 'admin' | 'employee' | 'hr_officer' | 'payroll_officer';

/**
 * Role-based access control middleware
 */
export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      sendError(res, 'Insufficient permissions', 403);
      return;
    }

    next();
  };
};

/**
 * Check if user is admin
 */
export const requireAdmin = requireRole('admin');

/**
 * Check if user is HR officer or admin
 */
export const requireHR = requireRole('admin', 'hr_officer');

/**
 * Check if user is payroll officer or admin
 */
export const requirePayroll = requireRole('admin', 'payroll_officer');

/**
 * Check if user can access their own resource or is admin
 */
export const requireOwnershipOrAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  const resourceUserId = req.params.userId || req.body.userId;
  const isOwner = req.user.id === resourceUserId;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    sendError(res, 'Access denied', 403);
    return;
  }

  next();
};

