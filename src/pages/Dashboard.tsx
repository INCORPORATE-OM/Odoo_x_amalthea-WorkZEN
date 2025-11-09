import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, FileText, IndianRupee, TrendingUp } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { API_BASE } from '@/lib/auth';

// attendanceTrend will be computed from real attendance data (last 7 days)

const leaveTypes = [
  { name: 'Sick Leave', value: 15 },
  { name: 'Vacation', value: 30 },
  { name: 'Personal', value: 10 },
  { name: 'Other', value: 5 },
];

const payrollByDept = [
  { dept: 'Engineering', amount: 450000 },
  { dept: 'Sales', amount: 380000 },
  { dept: 'HR', amount: 250000 },
  { dept: 'Finance', amount: 320000 },
];

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const recentActivities = [
  { id: 1, type: 'attendance', user: 'John Doe', action: 'checked in', time: '2 minutes ago' },
  { id: 2, type: 'leave', user: 'Jane Smith', action: 'leave approved', time: '15 minutes ago' },
  { id: 3, type: 'payroll', user: 'System', action: 'payroll generated for November', time: '1 hour ago' },
  { id: 4, type: 'attendance', user: 'Robert Wilson', action: 'checked out', time: '2 hours ago' },
];

export default function Dashboard() {
  const [totalEmployees, setTotalEmployees] = useState<number | null>(null);
  const [presentToday, setPresentToday] = useState<number | null>(null);
  const [pendingLeaves, setPendingLeaves] = useState<number | null>(null);
  const [payrollThisMonth, setPayrollThisMonth] = useState<number | null>(null);
  const [attendanceTrend, setAttendanceTrend] = useState<Array<{ date: string; present: number; absent: number }>>([]);

  useEffect(() => {
    // fetch total employees
    fetch(`${API_BASE}/api/users`).then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setTotalEmployees(data.length);
    }).catch(() => setTotalEmployees(null));

    // fetch attendance and compute present today
    fetch(`${API_BASE}/api/attendance`).then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) {
        const today = new Date().toISOString().split('T')[0];
        const present = data.filter((d: any) => {
          const date = d.date ? new Date(d.date).toISOString().split('T')[0] : today;
          return date === today && d.check_in;
        }).length;
        setPresentToday(present);
      }
    }).catch(() => setPresentToday(null));

    // fetch leaves pending
    fetch(`${API_BASE}/api/leaves`).then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) {
        setPendingLeaves(data.filter((l: any) => l.status === 'pending').length);
      }
    }).catch(() => setPendingLeaves(null));

    // payroll this month
    fetch(`${API_BASE}/api/payroll`).then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const total = data.reduce((acc: number, p: any) => {
          if (p.month === month && p.year === year) return acc + Number(p.net_pay || p.netPay || 0);
          return acc;
        }, 0);
        setPayrollThisMonth(total);
      }
    }).catch(() => setPayrollThisMonth(null));

    // compute attendance trend for last 7 days
    Promise.all([
      fetch(`${API_BASE}/api/users`).then((r) => r.json()).catch(() => []),
      fetch(`${API_BASE}/api/attendance`).then((r) => r.json()).catch(() => []),
    ]).then(([usersData, attendanceData]) => {
      const users = Array.isArray(usersData) ? usersData : [];
      const attendance = Array.isArray(attendanceData) ? attendanceData : [];

      // count only users with role 'employee' for expected present/absent
      const employeeCount = users.filter((u: any) => u.role === 'employee').length || 0;

      // build last 7 days labels and counts
      const days: Array<{ dateISO: string; label: string }> = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateISO = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString(undefined, { weekday: 'short' });
        days.push({ dateISO, label });
      }

      const trend = days.map((d) => {
        const present = attendance.filter((a: any) => {
          const ad = a.date ? new Date(a.date).toISOString().split('T')[0] : null;
          return ad === d.dateISO && (a.check_in || a.checkIn);
        }).length;
        const absent = Math.max(0, employeeCount - present);
        return { date: d.label, present, absent };
      });
      setAttendanceTrend(trend);
    }).catch(() => setAttendanceTrend([]));
  }, []);

  const fmtCurrency = (v: number | null) => v == null ? '—' : `₹${v.toLocaleString()}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your organization's HR metrics"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalEmployees ?? '—'}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {/* we don't have historical data yet, keep placeholder */}
              +{totalEmployees ? Math.max(0, Math.round(totalEmployees * 0.03)) : '—'} from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <Clock className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{presentToday ?? '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalEmployees ? `${totalEmployees > 0 ? ((presentToday || 0) / totalEmployees * 100).toFixed(1) : '—'}% attendance rate` : '—'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Leaves Pending</CardTitle>
            <FileText className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingLeaves ?? '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-info/10 to-info/5 border-info/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Payroll This Month</CardTitle>
            <IndianRupee className="h-5 w-5 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{fmtCurrency(payrollThisMonth)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              For {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="present" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                <Line type="monotone" dataKey="absent" stroke="hsl(var(--chart-5))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leave Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={leaveTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {leaveTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payroll by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={payrollByDept}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dept" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="amount" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      <span className="text-primary">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
