import { Router } from 'express';
import * as payrollController from './payroll.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePayroll, requireOwnershipOrAdmin } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validation.middleware';
import * as payrollValidation from './payroll.validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Payroll officer/Admin routes
router.post(
  '/generate',
  requirePayroll,
  validate(payrollValidation.generatePayrollSchema),
  payrollController.generatePayroll
);
router.get('/all', requirePayroll, payrollController.getAllPayrolls);
router.get('/summary', requirePayroll, payrollController.getPayrollSummary);

// Employee routes (own payrolls)
router.get(
  '/user/:userId?',
  validate(payrollValidation.getUserPayrollsSchema),
  requireOwnershipOrAdmin,
  payrollController.getUserPayrolls
);
router.get(
  '/user/:userId?/month',
  validate(payrollValidation.getPayrollByMonthSchema),
  requireOwnershipOrAdmin,
  payrollController.getPayrollByMonth
);

// Get payroll by ID
router.get(
  '/:payrollId',
  validate(payrollValidation.getPayrollByIdSchema),
  payrollController.getPayrollById
);

export default router;

