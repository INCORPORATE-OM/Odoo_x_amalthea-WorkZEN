import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/users/users.routes';
import attendanceRoutes from '../modules/attendance/attendance.routes';
import leaveRoutes from '../modules/leave/leave.routes';
import payrollRoutes from '../modules/payroll/payroll.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);
router.use('/payroll', payrollRoutes);
router.use('/dashboard', dashboardRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'WorkZen HRMS API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;

