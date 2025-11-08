import prisma from '../../config/database';
import { calculateSalary } from '../../utils/salaryCalculator';
import { getCurrentMonthYear } from '../../utils/dateHelpers';

interface GeneratePayrollInput {
  userId: string;
  month: number;
  year: number;
  basicSalary: number;
  hra?: number;
  allowances?: number;
  generatedBy: string;
}

/**
 * Generate payroll for an employee
 */
export const generatePayroll = async (input: GeneratePayrollInput) => {
  const { userId, month, year, basicSalary, hra = 0, allowances = 0, generatedBy } = input;

  // Validate month and year
  if (month < 1 || month > 12) {
    throw new Error('Invalid month. Must be between 1 and 12');
  }

  // Check if payroll already exists for this month/year
  const existingPayroll = await prisma.payroll.findUnique({
    where: {
      userId_month_year: {
        userId,
        month,
        year,
      },
    },
  });

  if (existingPayroll) {
    throw new Error('Payroll already generated for this month');
  }

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Calculate salary breakdown
  const salaryBreakdown = calculateSalary({
    basicSalary,
    hra,
    allowances,
  });

  // Create payroll record
  const payroll = await prisma.payroll.create({
    data: {
      userId,
      month,
      year,
      basicSalary,
      hra,
      allowances,
      deductions: salaryBreakdown.deductions,
      netPay: salaryBreakdown.netPay,
      generatedBy,
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
      generator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return {
    ...payroll,
    breakdown: {
      pf: salaryBreakdown.pf,
      professionalTax: salaryBreakdown.professionalTax,
      grossSalary: salaryBreakdown.grossSalary,
    },
  };
};

/**
 * Get payroll by ID
 */
export const getPayrollById = async (payrollId: string) => {
  const payroll = await prisma.payroll.findUnique({
    where: { id: payrollId },
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
      generator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!payroll) {
    throw new Error('Payroll not found');
  }

  // Calculate breakdown for display
  const salaryBreakdown = calculateSalary({
    basicSalary: payroll.basicSalary,
    hra: payroll.hra,
    allowances: payroll.allowances,
  });

  return {
    ...payroll,
    breakdown: {
      pf: salaryBreakdown.pf,
      professionalTax: salaryBreakdown.professionalTax,
      grossSalary: salaryBreakdown.grossSalary,
    },
  };
};

/**
 * Get payrolls for a user
 */
export const getUserPayrolls = async (userId: string, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [payrolls, total] = await Promise.all([
    prisma.payroll.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.payroll.count({
      where: { userId },
    }),
  ]);

  return {
    payrolls,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get payroll for a specific month/year
 */
export const getPayrollByMonth = async (userId: string, month: number, year: number) => {
  const payroll = await prisma.payroll.findUnique({
    where: {
      userId_month_year: {
        userId,
        month,
        year,
      },
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
      generator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!payroll) {
    return null;
  }

  // Calculate breakdown for display
  const salaryBreakdown = calculateSalary({
    basicSalary: payroll.basicSalary,
    hra: payroll.hra,
    allowances: payroll.allowances,
  });

  return {
    ...payroll,
    breakdown: {
      pf: salaryBreakdown.pf,
      professionalTax: salaryBreakdown.professionalTax,
      grossSalary: salaryBreakdown.grossSalary,
    },
  };
};

/**
 * Get all payrolls (Payroll officer/Admin only)
 */
export const getAllPayrolls = async (
  month?: number,
  year?: number,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;

  const where: any = {};
  if (month && year) {
    where.month = month;
    where.year = year;
  }

  const [payrolls, total] = await Promise.all([
    prisma.payroll.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
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
        generator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.payroll.count({ where }),
  ]);

  return {
    payrolls,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get payroll summary
 */
export const getPayrollSummary = async (month?: number, year?: number) => {
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const targetMonth = month || currentMonth;
  const targetYear = year || currentYear;

  const payrolls = await prisma.payroll.findMany({
    where: {
      month: targetMonth,
      year: targetYear,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
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
    month: targetMonth,
    year: targetYear,
    totalEmployees,
    totalNetPay: Math.round(totalNetPay * 100) / 100,
    totalBasicSalary: Math.round(totalBasicSalary * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
  };
};

