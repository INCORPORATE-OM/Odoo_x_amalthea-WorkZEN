import prisma from '../../config/database';
import { LeaveStatus, LeaveType } from '@prisma/client';
import { getDaysDifference } from '../../utils/dateHelpers';

interface CreateLeaveInput {
  userId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  reason?: string;
}

interface UpdateLeaveStatusInput {
  leaveId: string;
  status: LeaveStatus;
  approvedBy: string;
}

/**
 * Apply for leave
 */
export const applyForLeave = async (input: CreateLeaveInput) => {
  const { userId, leaveType, startDate, endDate, reason } = input;

  // Validate dates
  if (endDate < startDate) {
    throw new Error('End date must be after start date');
  }

  // Check for overlapping leaves
  const overlappingLeaves = await prisma.leave.findMany({
    where: {
      userId,
      status: {
        in: ['pending', 'approved'],
      },
      OR: [
        {
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      ],
    },
  });

  if (overlappingLeaves.length > 0) {
    throw new Error('You have an overlapping leave request');
  }

  // Create leave request
  const leave = await prisma.leave.create({
    data: {
      userId,
      leaveType,
      startDate,
      endDate,
      reason,
      status: 'pending',
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

  return leave;
};

/**
 * Get all leaves for a user
 */
export const getUserLeaves = async (userId: string, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [leaves, total] = await Promise.all([
    prisma.leave.findMany({
      where: { userId },
      skip,
      take: limit,
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
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.leave.count({
      where: { userId },
    }),
  ]);

  return {
    leaves,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get all pending leaves (for payroll officer/admin)
 */
export const getPendingLeaves = async (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [leaves, total] = await Promise.all([
    prisma.leave.findMany({
      where: {
        status: 'pending',
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
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
    }),
    prisma.leave.count({
      where: {
        status: 'pending',
      },
    }),
  ]);

  return {
    leaves,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get leave by ID
 */
export const getLeaveById = async (leaveId: string) => {
  const leave = await prisma.leave.findUnique({
    where: { id: leaveId },
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
      approver: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!leave) {
    throw new Error('Leave not found');
  }

  return leave;
};

/**
 * Approve or reject leave
 */
export const updateLeaveStatus = async (input: UpdateLeaveStatusInput) => {
  const { leaveId, status, approvedBy } = input;

  // Check if leave exists
  const leave = await prisma.leave.findUnique({
    where: { id: leaveId },
  });

  if (!leave) {
    throw new Error('Leave not found');
  }

  if (leave.status !== 'pending') {
    throw new Error('Leave request has already been processed');
  }

  // Update leave status
  const updatedLeave = await prisma.leave.update({
    where: { id: leaveId },
    data: {
      status,
      approvedBy: status === 'approved' ? approvedBy : null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      approver: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // If approved, mark attendance as leave for those dates
  if (status === 'approved') {
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    const days = getDaysDifference(startDate, endDate);

    // Create attendance records for leave days
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      await prisma.attendance.upsert({
        where: {
          userId_date: {
            userId: leave.userId,
            date: currentDate,
          },
        },
        update: {
          status: 'leave',
        },
        create: {
          userId: leave.userId,
          date: currentDate,
          status: 'leave',
        },
      });
    }
  }

  return updatedLeave;
};

/**
 * Get leave history (all leaves)
 */
export const getLeaveHistory = async (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [leaves, total] = await Promise.all([
    prisma.leave.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
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
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.leave.count(),
  ]);

  return {
    leaves,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get leave summary for a user
 */
export const getLeaveSummary = async (userId: string) => {
  const leaves = await prisma.leave.findMany({
    where: { userId },
  });

  const total = leaves.length;
  const pending = leaves.filter((l) => l.status === 'pending').length;
  const approved = leaves.filter((l) => l.status === 'approved').length;
  const rejected = leaves.filter((l) => l.status === 'rejected').length;

  // Calculate total leave days
  let totalDays = 0;
  leaves.forEach((leave) => {
    if (leave.status === 'approved') {
      totalDays += getDaysDifference(leave.startDate, leave.endDate);
    }
  });

  return {
    total,
    pending,
    approved,
    rejected,
    totalDays,
  };
};

