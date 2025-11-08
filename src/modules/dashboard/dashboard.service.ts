import prisma from '../../config/database';
import { getCurrentMonthYear } from '../../utils/dateHelpers';

/**
 * Get attendance summary for dashboard
 */
export const getAttendanceSummary = async (userId?: string) => {
  const { month, year } = getCurrentMonthYear();
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const where: any = {
    date: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (userId) {
    where.userId = userId;
  }

  const attendances = await prisma.attendance.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const totalDays = endDate.getDate();
  const present = attendances.filter((a) => a.status === 'present').length;
  const absent = attendances.filter((a) => a.status === 'absent').length;
  const leave = attendances.filter((a) => a.status === 'leave').length;
  const halfDay = attendances.filter((a) => a.status === 'half_day').length;

  return {
    month,
    year,
    totalDays,
    present,
    absent,
    leave,
    halfDay,
    attendanceRate: totalDays > 0 ? ((present / totalDays) * 100).toFixed(2) : '0.00',
  };
};

/**
 * Get leaves summary for dashboard
 */
export const getLeavesSummary = async (userId?: string) => {
  const where: any = {};
  if (userId) {
    where.userId = userId;
  }

  const leaves = await prisma.leave.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const total = leaves.length;
  const pending = leaves.filter((l) => l.status === 'pending').length;
  const approved = leaves.filter((l) => l.status === 'approved').length;
  const rejected = leaves.filter((l) => l.status === 'rejected').length;

  // Get recent leaves (last 5)
  const recentLeaves = await prisma.leave.findMany({
    where,
    take: 5,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return {
    total,
    pending,
    approved,
    rejected,
    recentLeaves,
  };
};

/**
 * Get payroll summary for dashboard
 */
export const getPayrollSummary = async () => {
  const { month, year } = getCurrentMonthYear();

  const payrolls = await prisma.payroll.findMany({
    where: {
      month,
      year,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
        },
      },
    },
  });

  const totalEmployees = payrolls.length;
  const totalNetPay = payrolls.reduce((sum, p) => sum + p.netPay, 0);
  const totalBasicSalary = payrolls.reduce((sum, p) => sum + p.basicSalary, 0);
  const totalDeductions = payrolls.reduce((sum, p) => sum + p.deductions, 0);

  return {
    month,
    year,
    totalEmployees,
    totalNetPay: Math.round(totalNetPay * 100) / 100,
    totalBasicSalary: Math.round(totalBasicSalary * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
  };
};

/**
 * Get organization metrics
 */
export const getOrganizationMetrics = async () => {
  const { month, year } = getCurrentMonthYear();
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  // Get total users
  const totalUsers = await prisma.user.count();

  // Get users by role
  const usersByRole = await prisma.user.groupBy({
    by: ['role'],
    _count: {
      role: true,
    },
  });

  // Get attendance stats for current month
  const attendances = await prisma.attendance.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const totalDays = endDate.getDate();
  const presentCount = attendances.filter((a) => a.status === 'present').length;
  const overallAttendanceRate =
    totalUsers > 0 && totalDays > 0
      ? ((presentCount / (totalUsers * totalDays)) * 100).toFixed(2)
      : '0.00';

  // Get pending leaves
  const pendingLeaves = await prisma.leave.count({
    where: {
      status: 'pending',
    },
  });

  // Get payroll stats for current month
  const payrolls = await prisma.payroll.findMany({
    where: {
      month,
      year,
    },
  });

  const totalPayrollGenerated = payrolls.length;
  const totalPayrollAmount = payrolls.reduce((sum, p) => sum + p.netPay, 0);

  return {
    totalUsers,
    usersByRole: usersByRole.map((u) => ({
      role: u.role,
      count: u._count.role,
    })),
    currentMonth: {
      month,
      year,
      overallAttendanceRate,
      pendingLeaves,
      totalPayrollGenerated,
      totalPayrollAmount: Math.round(totalPayrollAmount * 100) / 100,
    },
  };
};

/**
 * Get employee dashboard data
 */
export const getEmployeeDashboard = async (userId: string) => {
  const { month, year } = getCurrentMonthYear();

  // Get attendance summary
  const attendanceSummary = await getAttendanceSummary(userId);

  // Get leaves summary
  const leavesSummary = await getLeavesSummary(userId);

  // Get current month payroll
  const payroll = await prisma.payroll.findUnique({
    where: {
      userId_month_year: {
        userId,
        month,
        year,
      },
    },
    select: {
      id: true,
      month: true,
      year: true,
      netPay: true,
      basicSalary: true,
      createdAt: true,
    },
  });

  // Get recent attendance (last 5)
  const recentAttendance = await prisma.attendance.findMany({
    where: {
      userId,
    },
    take: 5,
    orderBy: {
      date: 'desc',
    },
  });

  return {
    attendanceSummary,
    leavesSummary,
    payroll,
    recentAttendance,
  };
};

