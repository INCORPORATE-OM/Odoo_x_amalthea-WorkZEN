import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { Layout } from '../components/Layout';
import { LeaveCalendar } from '../components/LeaveCalendar';

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
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEmployeeDetailModal, setShowEmployeeDetailModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const employeeModalRef = useRef<HTMLDivElement>(null);

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
      if (employeeModalRef.current && !employeeModalRef.current.contains(event.target as Node)) {
        setShowEmployeeDetailModal(false);
        setSelectedEmployee(null);
      }
    };

    if (showNewEmployeeModal || showEmployeeDetailModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showNewEmployeeModal, showEmployeeDetailModal]);

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
      // If user is an employee, show only their own information
      if (user?.role === 'employee') {
        // Get current user's information
        const currentUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          designation: user.designation,
          phone: user.phone,
        };
        
        try {
          const status = await determineEmployeeStatus(user.id);
          const employeeWithStatus = { ...currentUser, status };
          setEmployees([employeeWithStatus]);
          setFilteredEmployees([employeeWithStatus]);
        } catch {
          const employeeWithStatus = { ...currentUser, status: 'absent' as const };
          setEmployees([employeeWithStatus]);
          setFilteredEmployees([employeeWithStatus]);
        }
      } else {
        // For admin/HR/Payroll, fetch all employees
        const response = await api.get('/users');
        const users = response.data.data.users || [];
        
        // Fetch today's attendance and leaves once for all employees
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        
        let todayAttendances: any[] = [];
        let todayLeaves: any[] = [];
        
        try {
          // Fetch all attendance for today
          // Pass date as ISO string, backend will convert it
          const attendanceResponse = await api.get('/attendance/all', {
            params: {
              date: todayStr,
              page: 1,
              limit: 1000,
            },
          });
          todayAttendances = attendanceResponse.data.data.attendances || [];
        } catch (error) {
          console.error('Failed to fetch attendance', error);
        }
        
        // Fetch leaves for all employees (we'll need to do this per employee or create a bulk endpoint)
        // For now, we'll determine status efficiently
        const employeesWithStatus = await Promise.all(
          users.map(async (emp: any) => {
            try {
              // Check if employee is on leave first
              let isOnLeave = false;
              try {
                const leavesResponse = await api.get(`/leaves/user/${emp.id}`, { 
                  params: { page: 1, limit: 100 } 
                });
                const leaves = leavesResponse.data.data.leaves || [];
                isOnLeave = leaves.some((leave: any) => {
                  const startDate = new Date(leave.startDate).toISOString().split('T')[0];
                  const endDate = new Date(leave.endDate).toISOString().split('T')[0];
                  return leave.status === 'approved' && todayStr >= startDate && todayStr <= endDate;
                });
              } catch {}
              
              if (isOnLeave) {
                return { ...emp, status: 'leave' as const };
              }
              
              // Check if employee has attendance record for today
              const attendance = todayAttendances.find(
                (att: any) => {
                  // Check both userId field and user.id from the included user object
                  return (att.userId && att.userId === emp.id) || 
                         (att.user && att.user.id === emp.id);
                }
              );
              
              if (attendance) {
                // Priority 1: If they have checked in, they are present (most important check)
                if (attendance.checkIn) {
                  return { ...emp, status: 'present' as const };
                }
                
                // Priority 2: Check the status field
                if (attendance.status === 'present' || attendance.status === 'half_day') {
                  return { ...emp, status: 'present' as const };
                } else if (attendance.status === 'leave') {
                  return { ...emp, status: 'leave' as const };
                } else if (attendance.status === 'absent') {
                  return { ...emp, status: 'absent' as const };
                }
              }
              
              // No attendance record found - employee is absent
              return { ...emp, status: 'absent' as const };
            } catch {
              return { ...emp, status: 'absent' as const };
            }
          })
        );
        
        setEmployees(employeesWithStatus);
        setFilteredEmployees(employeesWithStatus);
      }
    } catch (error) {
      console.error('Failed to fetch employees', error);
      // If error and user is employee, still show their info from context
      if (user?.role === 'employee' && user) {
        const currentUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          designation: user.designation,
          phone: user.phone,
          status: 'absent' as const,
        };
        setEmployees([currentUser]);
        setFilteredEmployees([currentUser]);
      }
    } finally {
      setLoading(false);
    }
  };

  const determineEmployeeStatus = async (employeeId: string): Promise<'present' | 'leave' | 'absent'> => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      // Check if employee is on leave today
      try {
        const leavesResponse = await api.get(`/leaves/user/${employeeId}`, { params: { page: 1, limit: 100 } });
        const leaves = leavesResponse.data.data.leaves || [];
        const todayLeave = leaves.find((leave: any) => {
          const startDate = new Date(leave.startDate).toISOString().split('T')[0];
          const endDate = new Date(leave.endDate).toISOString().split('T')[0];
          return leave.status === 'approved' && todayStr >= startDate && todayStr <= endDate;
        });
        if (todayLeave) {
          return 'leave';
        }
      } catch {}
      
      // Check attendance status for today
      // For admin/HR, we can use the /attendance/all endpoint
      if (user?.role === 'admin' || user?.role === 'hr_officer') {
        try {
          const attendanceResponse = await api.get('/attendance/all', {
            params: {
              date: todayStr,
              page: 1,
              limit: 1000,
            },
          });
          const attendances = attendanceResponse.data.data.attendances || [];
          const employeeAttendance = attendances.find((att: any) => att.userId === employeeId || att.user?.id === employeeId);
          
          if (employeeAttendance) {
            // Check the status field first
            if (employeeAttendance.status === 'present' || employeeAttendance.status === 'half_day') {
              return 'present';
            } else if (employeeAttendance.status === 'leave') {
              return 'leave';
            }
            // If status is absent but has checkIn, still consider present
            if (employeeAttendance.checkIn) {
              return 'present';
            }
          }
        } catch {}
      } else {
        // For other roles, try to get the employee's own attendance
        // This won't work for other employees, but at least works for self
        if (employeeId === user?.id) {
          try {
            const attendanceResponse = await api.get('/attendance/daily');
            const attendanceData = attendanceResponse.data.data;
            if (attendanceData) {
              if (attendanceData.status === 'present' || attendanceData.status === 'half_day') {
                return 'present';
              } else if (attendanceData.status === 'leave') {
                return 'leave';
              }
              // If has checkIn, consider present
              if (attendanceData.checkIn) {
                return 'present';
              }
            }
          } catch {}
        }
      }
      
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

  const handleEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeDetailModal(true);
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
              {user?.role !== 'employee' && (
                <div className="flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              {user?.role === 'employee' && (
                <h2 className="text-xl font-semibold text-gray-900">My Information</h2>
              )}
            </div>
          </div>

          {/* Employee Cards Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className={user?.role === 'employee' ? 'max-w-2xl mx-auto' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
                {filteredEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    onClick={() => handleEmployeeClick(employee)}
                    className={`bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow relative ${
                      user?.role === 'employee' ? 'w-full' : ''
                    }`}
                  >
                    {/* Status Indicator */}
                    <div className="absolute top-4 right-4">
                      {getStatusIndicator(employee.status)}
                    </div>

                    {/* Profile Picture Placeholder */}
                    <div className="flex justify-center mb-4">
                      <div className={`${user?.role === 'employee' ? 'w-32 h-32' : 'w-24 h-24'} bg-blue-100 rounded-full flex items-center justify-center`}>
                        <svg
                          className={`${user?.role === 'employee' ? 'w-16 h-16' : 'w-12 h-12'} text-blue-600`}
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

                    {/* Employee Information */}
                    <div className={`${user?.role === 'employee' ? 'text-left space-y-3' : 'text-center'}`}>
                      <h3 className={`${user?.role === 'employee' ? 'text-2xl' : 'text-lg'} font-semibold text-gray-900`}>
                        {employee.name}
                      </h3>
                      {employee.email && (
                        <p className={`text-sm text-gray-500 ${user?.role === 'employee' ? 'mt-2' : 'mt-1'}`}>
                          {employee.email}
                        </p>
                      )}
                      {employee.designation && (
                        <p className={`text-sm text-gray-600 ${user?.role === 'employee' ? 'mt-2' : 'mt-1'}`}>
                          <span className="font-medium">Designation:</span> {employee.designation}
                        </p>
                      )}
                      {employee.department && (
                        <p className={`text-sm text-gray-600 ${user?.role === 'employee' ? 'mt-2' : 'mt-1'}`}>
                          <span className="font-medium">Department:</span> {employee.department}
                        </p>
                      )}
                      {user?.role === 'employee' && employee.phone && (
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Phone:</span> {employee.phone}
                        </p>
                      )}
                      {user?.role === 'employee' && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm text-gray-500">
                            <span className="font-medium">Status:</span>{' '}
                            <span className={`capitalize ${
                              employee.status === 'present' 
                                ? 'text-green-600' 
                                : employee.status === 'leave' 
                                ? 'text-yellow-600' 
                                : 'text-red-600'
                            }`}>
                              {employee.status || 'absent'}
                            </span>
                          </p>
                        </div>
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

      {/* Employee Detail Modal with Leave Calendar */}
      {showEmployeeDetailModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div
            ref={employeeModalRef}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedEmployee.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedEmployee.email}</p>
                {selectedEmployee.designation && (
                  <p className="text-sm text-gray-600 mt-1">{selectedEmployee.designation}</p>
                )}
                {selectedEmployee.department && (
                  <p className="text-sm text-gray-600">{selectedEmployee.department}</p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowEmployeeDetailModal(false);
                  setSelectedEmployee(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Leave Calendar */}
            <div className="mt-6">
              <LeaveCalendar userId={selectedEmployee.id} title={`${selectedEmployee.name}'s Leave Calendar`} />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

