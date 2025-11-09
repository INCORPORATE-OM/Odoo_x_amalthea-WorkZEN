export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'leave' | 'half_day';
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
}

export interface PayrollRecord {
  id: string;
  userId: string;
  userName: string;
  month: number;
  year: number;
  basicSalary: number;
  hra: number;
  allowances: number;
  pf: number;
  professionalTax: number;
  netPay: number;
  generatedBy?: string;
}

export const mockAttendance: AttendanceRecord[] = [
  {
    id: '1',
    userId: '2',
    userName: 'John Doe',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:00 AM',
    checkOut: '06:00 PM',
    status: 'present',
  },
  {
    id: '2',
    userId: '3',
    userName: 'Jane Smith',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:15 AM',
    status: 'present',
  },
];

export const mockLeaves: LeaveRequest[] = [
  {
    id: '1',
    userId: '2',
    userName: 'John Doe',
    leaveType: 'Sick Leave',
    startDate: '2025-11-15',
    endDate: '2025-11-16',
    reason: 'Medical appointment',
    status: 'pending',
  },
  {
    id: '2',
    userId: '3',
    userName: 'Jane Smith',
    leaveType: 'Vacation',
    startDate: '2025-12-01',
    endDate: '2025-12-05',
    reason: 'Family vacation',
    status: 'approved',
    approvedBy: 'Admin User',
  },
];

export const mockPayroll: PayrollRecord[] = [
  {
    id: '1',
    userId: '2',
    userName: 'John Doe',
    month: 11,
    year: 2025,
    basicSalary: 50000,
    hra: 10000,
    allowances: 5000,
    pf: 6000,
    professionalTax: 200,
    netPay: 58800,
    generatedBy: 'Robert Wilson',
  },
];

export const calculatePayroll = (basicSalary: number, hra: number, allowances: number) => {
  const pf = basicSalary * 0.12;
  const professionalTax = 200;
  const netPay = basicSalary + hra + allowances - pf - professionalTax;
  
  return {
    pf: Math.round(pf),
    professionalTax,
    netPay: Math.round(netPay),
  };
};
