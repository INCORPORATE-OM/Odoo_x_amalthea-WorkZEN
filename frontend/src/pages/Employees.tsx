import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { Layout } from '../components/Layout';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  designation?: string;
  status?: 'present' | 'leave' | 'absent';
}

export const Employees = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Check if user can create employees (Admin or HR)
  const canCreateEmployee = user?.role === 'admin' || user?.role === 'hr_officer';
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [attendance, setAttendance] = useState<any>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkOutLoading, setCheckOutLoading] = useState(false);
  const [showNewEmployeeModal, setShowNewEmployeeModal] = useState(false);
  const [newEmployeeData, setNewEmployeeData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as 'admin' | 'employee' | 'hr_officer' | 'payroll_officer',
    phone: '',
    department: '',
    designation: '',
  });
  const [creatingEmployee, setCreatingEmployee] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEmployees();
    fetchTodayAttendance();
  }, []);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowNewEmployeeModal(false);
      }
    };

    if (showNewEmployeeModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showNewEmployeeModal]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(
        (emp) =>
          emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.department?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
  }, [searchQuery, employees]);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/users');
      const users = response.data.data.users || [];
      
      // Fetch attendance status for each employee
      const employeesWithStatus = await Promise.all(
        users.map(async (emp: any) => {
          try {
            // Try to get today's attendance for this employee
            // Note: This might need a different endpoint or we can infer from the data
            const status = await determineEmployeeStatus(emp.id);
            return { ...emp, status };
          } catch {
            return { ...emp, status: 'absent' as const };
          }
        })
      );
      
      setEmployees(employeesWithStatus);
      setFilteredEmployees(employeesWithStatus);
    } catch (error) {
      console.error('Failed to fetch employees', error);
    } finally {
      setLoading(false);
    }
  };

  const determineEmployeeStatus = async (employeeId: string): Promise<'present' | 'leave' | 'absent'> => {
    try {
      // This is a simplified version - you may need to check actual attendance/leave records
      // For now, we'll use a basic check
      const today = new Date().toISOString().split('T')[0];
      
      // Check if employee has checked in today
      try {
        const attendanceResponse = await api.get(`/attendance/daily?userId=${employeeId}`);
        const attendanceData = attendanceResponse.data.data;
        if (attendanceData && attendanceData.checkIn && !attendanceData.checkOut) {
          return 'present';
        }
      } catch {}
      
      // Check if employee is on leave today
      // This would require a leave endpoint - for now, defaulting to absent
      return 'absent';
    } catch {
      return 'absent';
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const response = await api.get('/attendance/daily');
      setAttendance(response.data.data);
    } catch (error) {
      setAttendance(null);
    }
  };

  const handleCheckIn = async () => {
    setCheckInLoading(true);
    try {
      await api.post('/attendance/check-in');
      await fetchTodayAttendance();
      await fetchEmployees(); // Refresh to update status
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to check in');
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckOutLoading(true);
    try {
      const response = await api.post('/attendance/check-out');
      await fetchTodayAttendance();
      await fetchEmployees(); // Refresh to update status
      console.log('Check out successful:', response.data);
    } catch (error: any) {
      console.error('Check out error:', error);
      alert(error.response?.data?.message || 'Failed to check out');
    } finally {
      setCheckOutLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusIndicator = (status?: 'present' | 'leave' | 'absent') => {
    switch (status) {
      case 'present':
        return (
          <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
        );
      case 'leave':
        return (
          <svg
            className="w-4 h-4 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        );
      case 'absent':
      default:
        return (
          <div className="w-3 h-3 bg-yellow-500 rounded-full border-2 border-white shadow-sm"></div>
        );
    }
  };

  const handleEmployeeClick = (employeeId: string) => {
    navigate(`/employees/${employeeId}`);
  };

  const handleNewEmployee = () => {
    setShowNewEmployeeModal(true);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingEmployee(true);
    try {
      await api.post('/users', newEmployeeData);
      setShowNewEmployeeModal(false);
      setNewEmployeeData({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        phone: '',
        department: '',
        designation: '',
      });
      await fetchEmployees();
      alert('Employee created successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create employee';
      console.error('Create employee error:', error);
      if (error.response?.status === 403) {
        alert('Insufficient permissions. Only Admin and HR Officers can create employees.');
      } else {
        alert(errorMessage);
      }
    } finally {
      setCreatingEmployee(false);
    }
  };

  return (
    <Layout>
      <div className="flex h-full bg-gray-50 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header Bar with NEW button and Search */}
          <div className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              {canCreateEmployee && (
                <button
                  onClick={handleNewEmployee}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                >
                  NEW
                </button>
              )}
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Employee Cards Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    onClick={() => handleEmployeeClick(employee.id)}
                    className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow relative"
                  >
                    {/* Status Indicator */}
                    <div className="absolute top-4 right-4">
                      {getStatusIndicator(employee.status)}
                    </div>

                    {/* Profile Picture Placeholder */}
                    <div className="flex justify-center mb-4">
                      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-12 h-12 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Employee Name */}
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {employee.name}
                      </h3>
                      {employee.designation && (
                        <p className="text-sm text-gray-500 mt-1">
                          {employee.designation}
                        </p>
                      )}
                      {employee.department && (
                        <p className="text-xs text-gray-400 mt-1">
                          {employee.department}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredEmployees.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                {searchQuery ? 'No employees found matching your search' : 'No employees found'}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Check In/Out */}
        <div className="w-64 bg-white shadow-lg border-l p-6 flex flex-col items-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Attendance</h3>
          
          {attendance && attendance.checkIn && (
            <div className="text-center mb-4">
              <p className="text-sm text-gray-500">Since</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatTime(attendance.checkIn)}
              </p>
            </div>
          )}

          <div className="space-y-4 w-full">
            {!attendance || !attendance.checkIn ? (
              <button
                onClick={handleCheckIn}
                disabled={checkInLoading}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
              >
                {checkInLoading ? 'Checking in...' : 'Check IN →'}
              </button>
            ) : attendance.checkOut ? (
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Already checked out</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatTime(attendance.checkOut)}
                </p>
              </div>
            ) : (
              <button
                onClick={handleCheckOut}
                disabled={checkOutLoading}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium transition-colors"
              >
                {checkOutLoading ? 'Checking out...' : 'Check Out →'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* New Employee Modal */}
      {showNewEmployeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            ref={modalRef}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New Employee</h2>
            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={newEmployeeData.name}
                  onChange={(e) => setNewEmployeeData({ ...newEmployeeData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={newEmployeeData.email}
                  onChange={(e) => setNewEmployeeData({ ...newEmployeeData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newEmployeeData.password}
                  onChange={(e) => setNewEmployeeData({ ...newEmployeeData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  required
                  value={newEmployeeData.role}
                  onChange={(e) => setNewEmployeeData({ ...newEmployeeData, role: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="employee">Employee</option>
                  <option value="hr_officer">HR Officer</option>
                  <option value="payroll_officer">Payroll Officer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={newEmployeeData.phone}
                  onChange={(e) => setNewEmployeeData({ ...newEmployeeData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={newEmployeeData.department}
                  onChange={(e) => setNewEmployeeData({ ...newEmployeeData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  value={newEmployeeData.designation}
                  onChange={(e) => setNewEmployeeData({ ...newEmployeeData, designation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewEmployeeModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingEmployee}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {creatingEmployee ? 'Creating...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

