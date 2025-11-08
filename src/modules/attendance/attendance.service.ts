import prisma from '../../config/database';
import { formatDate } from '../../utils/dateHelpers';

/**
 * Mark attendance (check-in)
 */
export const markCheckIn = async (userId: string) => {
  const today = new Date();

  // Check if attendance already exists for today
  const existingAttendance = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  if (existingAttendance && existingAttendance.checkIn) {
    throw new Error('Already checked in for today');
  }

  // Create or update attendance
  const attendance = await prisma.attendance.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    update: {
      checkIn: new Date(),
      status: 'present',
    },
    create: {
      userId,
      date: today,
      checkIn: new Date(),
      status: 'present',
    },
  });

  return attendance;
};

/**
 * Mark check-out
 */
export const markCheckOut = async (userId: string) => {
  const today = new Date();

  // Find today's attendance
  const attendance = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  if (!attendance) {
    throw new Error('No check-in found for today');
  }

  if (attendance.checkOut) {
    throw new Error('Already checked out for today');
  }

  // Update check-out
  const updatedAttendance = await prisma.attendance.update({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    data: {
      checkOut: new Date(),
    },
  });

  return updatedAttendance;
};

/**
 * Get attendance for a specific date
 */
export const getAttendanceByDate = async (userId: string, date: Date) => {
  const attendance = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId,
        date,
      },
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

  return attendance;
};

/**
 * Get daily attendance logs for a user
 */
export const getDailyLogs = async (userId: string, date: Date) => {
  const attendance = await getAttendanceByDate(userId, date);
  return attendance;
};

/**
 * Get monthly attendance logs for a user
 */
export const getMonthlyLogs = async (userId: string, year: number, month: number) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const attendances = await prisma.attendance.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: 'desc',
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

  return attendances;
};

/**
 * Get all employees' attendance (HR/Admin only)
 */
export const getAllEmployeesAttendance = async (
  date?: Date,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;
  const targetDate = date || new Date();

  const [attendances, total] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        date: targetDate,
      },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            designation: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.attendance.count({
      where: {
        date: targetDate,
      },
    }),
  ]);

  return {
    attendances,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get attendance summary for a user
 */
export const getAttendanceSummary = async (userId: string, year: number, month: number) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const attendances = await prisma.attendance.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const totalDays = endDate.getDate();
  const present = attendances.filter((a) => a.status === 'present').length;
  const absent = attendances.filter((a) => a.status === 'absent').length;
  const leave = attendances.filter((a) => a.status === 'leave').length;
  const halfDay = attendances.filter((a) => a.status === 'half_day').length;

  return {
    totalDays,
    present,
    absent,
    leave,
    halfDay,
    attendanceRate: totalDays > 0 ? ((present / totalDays) * 100).toFixed(2) : '0.00',
  };
};

