import { Router } from 'express';
import * as attendanceController from './attendance.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireHR } from '../../middlewares/rbac.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Employee routes
router.post('/check-in', attendanceController.markCheckIn);
router.post('/check-out', attendanceController.markCheckOut);
router.get('/daily', attendanceController.getDailyLog);
router.get('/monthly/:userId?', attendanceController.getMonthlyLogs);
router.get('/summary/:userId?', attendanceController.getAttendanceSummary);

// HR/Admin routes
router.get('/all', requireHR, attendanceController.getAllEmployeesAttendance);

export default router;

