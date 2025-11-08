import { Router } from 'express';
import * as leaveController from './leave.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePayroll, requireHR } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validation.middleware';
import * as leaveValidation from './leave.validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Employee routes
router.post(
  '/apply',
  validate(leaveValidation.applyForLeaveSchema),
  leaveController.applyForLeave
);
router.get('/user/:userId?', validate(leaveValidation.getUserLeavesSchema), leaveController.getUserLeaves);
router.get('/summary/:userId?', leaveController.getLeaveSummary);

// Payroll officer/Admin routes
router.get('/pending', requirePayroll, leaveController.getPendingLeaves);
router.patch(
  '/:leaveId/status',
  requirePayroll,
  validate(leaveValidation.updateLeaveStatusSchema),
  leaveController.updateLeaveStatus
);

// Admin/HR routes
router.get('/history', requireHR, leaveController.getLeaveHistory);
router.get(
  '/:leaveId',
  validate(leaveValidation.getLeaveByIdSchema),
  leaveController.getLeaveById
);

export default router;

