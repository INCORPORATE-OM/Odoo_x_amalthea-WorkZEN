import { useState, useEffect } from 'react';
import api from '../lib/api';

interface Leave {
  id: string;
  startDate: string;
  endDate: string;
  status: 'approved' | 'pending' | 'rejected';
  leaveType: string;
  reason?: string;
}

interface LeaveCalendarProps {
  userId?: string;
  title?: string;
}

export const LeaveCalendar = ({ userId, title = 'Leave Calendar' }: LeaveCalendarProps) => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchLeaves();
  }, [userId, currentMonth, currentYear]);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const url = userId ? `/leaves/user/${userId}` : '/leaves/user';
      const response = await api.get(url);
      setLeaves(response.data.data.leaves || []);
    } catch (error) {
      console.error('Failed to fetch leaves', error);
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  // Get all dates in a date range
  const getDatesInRange = (startDate: Date, endDate: Date): Date[] => {
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  };

  // Get leave status for a specific date
  // Priority: approved > pending > rejected
  const getLeaveStatusForDate = (date: Date): 'approved' | 'pending' | 'rejected' | null => {
    const dateStr = date.toISOString().split('T')[0];
    const checkDate = new Date(dateStr);
    checkDate.setHours(0, 0, 0, 0);
    
    const matchingLeaves = leaves.filter((leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      
      return checkDate >= start && checkDate <= end;
    });

    if (matchingLeaves.length === 0) {
      return null;
    }

    // Prioritize: approved > pending > rejected
    if (matchingLeaves.some(l => l.status === 'approved')) {
      return 'approved';
    }
    if (matchingLeaves.some(l => l.status === 'pending')) {
      return 'pending';
    }
    if (matchingLeaves.some(l => l.status === 'rejected')) {
      return 'rejected';
    }

    return null;
  };

  // Get calendar days for the current month
  const getCalendarDays = () => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentYear, currentMonth, day));
    }

    return days;
  };

  const getDateColor = (date: Date | null): string => {
    if (!date) return '';

    const status = getLeaveStatusForDate(date);
    
    switch (status) {
      case 'approved':
        return 'bg-green-500 text-white hover:bg-green-600';
      case 'pending':
        return 'bg-yellow-500 text-gray-900 hover:bg-yellow-600';
      case 'rejected':
        return 'bg-red-500 text-white hover:bg-red-600';
      default:
        return 'bg-white text-gray-900 hover:bg-gray-100';
    }
  };

  const getDateTitle = (date: Date | null): string => {
    if (!date) return '';
    
    const status = getLeaveStatusForDate(date);
    if (!status) return '';

    const leave = leaves.find(l => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      const checkDate = new Date(date);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      checkDate.setHours(0, 0, 0, 0);
      return checkDate >= start && checkDate <= end;
    });

    if (leave) {
      return `${leave.leaveType} (${status})`;
    }

    return '';
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const calendarDays = getCalendarDays();
  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Today
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded"
            aria-label="Next month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 text-center">
          {monthNames[currentMonth]} {currentYear}
        </h3>
      </div>

      {/* Legend */}
      <div className="flex justify-center space-x-4 mb-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Approved</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>Pending</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Rejected</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Week day headers */}
        {weekDays.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-700">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((date, index) => (
          <div
            key={index}
            className={`
              p-2 text-center text-sm rounded cursor-pointer transition-colors
              ${date ? getDateColor(date) : 'bg-gray-50'}
              ${date && isToday(date) ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
            `}
            title={date ? getDateTitle(date) : ''}
          >
            {date ? date.getDate() : ''}
          </div>
        ))}
      </div>

      {/* Leave Summary */}
      {leaves.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Leave Summary</h4>
          <div className="space-y-2">
            {leaves.map((leave) => (
              <div
                key={leave.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
              >
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded ${
                      leave.status === 'approved'
                        ? 'bg-green-500'
                        : leave.status === 'pending'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                  ></div>
                  <span className="capitalize">{leave.leaveType}</span>
                  <span className="text-gray-500">
                    ({new Date(leave.startDate).toLocaleDateString()} -{' '}
                    {new Date(leave.endDate).toLocaleDateString()})
                  </span>
                </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      leave.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : leave.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {leave.status}
                  </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {leaves.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">No leave records found</div>
      )}
    </div>
  );
};

