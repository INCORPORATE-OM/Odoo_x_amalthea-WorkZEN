import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Layout } from '../components/Layout';

export const Attendance = () => {
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkOutLoading, setCheckOutLoading] = useState(false);

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  const fetchTodayAttendance = async () => {
    setLoading(true);
    try {
      const response = await api.get('/attendance/daily');
      setAttendance(response.data.data);
    } catch (error) {
      setAttendance(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setCheckInLoading(true);
    try {
      await api.post('/attendance/check-in');
      await fetchTodayAttendance();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to check in');
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckOutLoading(true);
    try {
      await api.post('/attendance/check-out');
      await fetchTodayAttendance();
    } catch (error: any) {
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
    });
  };

  return (
    <Layout>
      <div className="px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Attendance</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Today's Attendance</h2>
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : attendance ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Check In</p>
                  <p className="text-lg font-semibold">{formatTime(attendance.checkIn)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Check Out</p>
                  <p className="text-lg font-semibold">{formatTime(attendance.checkOut)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="text-lg font-semibold capitalize">{attendance.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="text-lg font-semibold">
                    {new Date(attendance.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex space-x-4 pt-4">
                {!attendance.checkIn && (
                  <button
                    onClick={handleCheckIn}
                    disabled={checkInLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {checkInLoading ? 'Checking in...' : 'Check In'}
                  </button>
                )}
                {attendance.checkIn && !attendance.checkOut && (
                  <button
                    onClick={handleCheckOut}
                    disabled={checkOutLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {checkOutLoading ? 'Checking out...' : 'Check Out'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-500 mb-4">No attendance record for today</p>
              <button
                onClick={handleCheckIn}
                disabled={checkInLoading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {checkInLoading ? 'Checking in...' : 'Check In'}
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

