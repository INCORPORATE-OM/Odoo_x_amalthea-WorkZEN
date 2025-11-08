import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { Layout } from '../components/Layout';

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [attendance, leaves, payroll] = await Promise.all([
          api.get('/dashboard/attendance'),
          api.get('/dashboard/leaves'),
          api.get('/dashboard/payroll'),
        ]);

        setStats({
          attendance: attendance.data.data,
          leaves: leaves.data.data,
          payroll: payroll.data.data,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Attendance Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Attendance</h3>
            {stats?.attendance && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Present:</span>
                  <span className="font-semibold">{stats.attendance.present}</span>
                </div>
                <div className="flex justify-between">
                  <span>Absent:</span>
                  <span className="font-semibold">{stats.attendance.absent}</span>
                </div>
                <div className="flex justify-between">
                  <span>Leave:</span>
                  <span className="font-semibold">{stats.attendance.leave}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span>Attendance Rate:</span>
                    <span className="font-semibold text-blue-600">
                      {stats.attendance.attendanceRate}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Leaves Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Leaves</h3>
            {stats?.leaves && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-semibold">{stats.leaves.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending:</span>
                  <span className="font-semibold text-yellow-600">{stats.leaves.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span>Approved:</span>
                  <span className="font-semibold text-green-600">{stats.leaves.approved}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rejected:</span>
                  <span className="font-semibold text-red-600">{stats.leaves.rejected}</span>
                </div>
              </div>
            )}
          </div>

          {/* Payroll Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Payroll</h3>
            {stats?.payroll && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Month:</span>
                  <span className="font-semibold">
                    {stats.payroll.month}/{stats.payroll.year}
                  </span>
                </div>
                {stats.payroll.totalEmployees > 0 ? (
                  <>
                    <div className="flex justify-between">
                      <span>Net Pay:</span>
                      <span className="font-semibold text-green-600">
                        ₹{stats.payroll.totalNetPay.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Employees:</span>
                      <span className="font-semibold">{stats.payroll.totalEmployees}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">No payroll generated yet</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Your Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-semibold">{user?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-semibold">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="font-semibold capitalize">{user?.role}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Department</p>
              <p className="font-semibold">{user?.department || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

