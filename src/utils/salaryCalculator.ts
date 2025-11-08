/**
 * Salary calculation utilities for WorkZen HRMS
 */

interface SalaryInput {
  basicSalary: number;
  hra?: number;
  allowances?: number;
}

interface SalaryBreakdown {
  basicSalary: number;
  hra: number;
  allowances: number;
  pf: number;
  professionalTax: number;
  deductions: number;
  grossSalary: number;
  netPay: number;
}

/**
 * Calculate PF (12% of basic salary)
 */
export const calculatePF = (basicSalary: number): number => {
  return Math.round((basicSalary * 0.12) * 100) / 100;
};

/**
 * Calculate Professional Tax (fixed 200)
 */
export const calculateProfessionalTax = (): number => {
  return 200;
};

/**
 * Calculate complete salary breakdown
 */
export const calculateSalary = (input: SalaryInput): SalaryBreakdown => {
  const { basicSalary, hra = 0, allowances = 0 } = input;

  const pf = calculatePF(basicSalary);
  const professionalTax = calculateProfessionalTax();
  const deductions = pf + professionalTax;
  const grossSalary = basicSalary + hra + allowances;
  const netPay = grossSalary - deductions;

  return {
    basicSalary,
    hra,
    allowances,
    pf,
    professionalTax,
    deductions: Math.round(deductions * 100) / 100,
    grossSalary: Math.round(grossSalary * 100) / 100,
    netPay: Math.round(netPay * 100) / 100,
  };
};

