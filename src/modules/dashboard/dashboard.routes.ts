import { Router } from 'express';
import * as dashboardController from './dashboard.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireHR, requireOwnershipOrAdmin } from '../../middlewares/rbac.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// General dashboard routes
router.get('/attendance', dashboardController.getAttendanceSummary);
router.get('/leaves', dashboardController.getLeavesSummary);
router.get('/payroll', dashboardController.getPayrollSummary);

// Employee dashboard
router.get('/employee/:userId?', requireOwnershipOrAdmin, dashboardController.getEmployeeDashboard);

// Admin/HR routes
router.get('/organization', requireHR, dashboardController.getOrganizationMetrics);

export default router;

