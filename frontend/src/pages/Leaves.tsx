import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { Layout } from '../components/Layout';

export const Leaves = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'myLeaves' | 'pending'>('myLeaves');
  const [processingLeave, setProcessingLeave] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    leaveType: 'casual',
    startDate: '',
    endDate: '',
    reason: '',
  });

  // Check if user can approve leaves (Admin or Payroll Officer)
  const canApproveLeaves = user?.role === 'admin' || user?.role === 'payroll_officer';

  useEffect(() => {
    fetchLeaves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      if (viewMode === 'pending' && canApproveLeaves) {
        // Fetch pending leaves for approval
        const response = await api.get('/leaves/pending');
        setLeaves(response.data.data.leaves || []);
      } else {
        // Fetch user's own leaves
        const response = await api.get('/leaves/user');
        setLeaves(response.data.data.leaves || []);
      }
    } catch (error) {
      console.error('Failed to fetch leaves', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorDetails(null);
    setSubmitting(true);
    
    try {
      await api.post('/leaves/apply', formData);
      setShowForm(false);
      setFormData({ leaveType: 'casual', startDate: '', endDate: '', reason: '' });
      setError(null);
      setErrorDetails(null);
      fetchLeaves();
    } catch (error: any) {
      // Log full error details to console for debugging
      console.error('=== LEAVE APPLICATION ERROR ===');
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      console.error('Error response headers:', error.response?.headers);
      console.error('Error message:', error.response?.data?.message);
      console.error('Error stack:', error.stack);
      console.error('Stringified error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      console.error('===============================');
      
      // Store full error details for display
      const fullErrorDetails = {
        message: error.response?.data?.message || error.message || 'Unknown error',
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
        },
      };
      setErrorDetails(fullErrorDetails);
      
      // Extract error message
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error
        || error.message
        || 'Failed to apply for leave';
      
      // Show detailed error
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveLeave = async (leaveId: string) => {
    if (!confirm('Are you sure you want to approve this leave request?')) {
      return;
    }
    setProcessingLeave(leaveId);
    try {
      await api.patch(`/leaves/${leaveId}/status`, { status: 'approved' });
      fetchLeaves();
      alert('Leave approved successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to approve leave');
    } finally {
      setProcessingLeave(null);
    }
  };

  const handleRejectLeave = async (leaveId: string) => {
    if (!confirm('Are you sure you want to reject this leave request?')) {
      return;
    }
    setProcessingLeave(leaveId);
    try {
      await api.patch(`/leaves/${leaveId}/status`, { status: 'rejected' });
      fetchLeaves();
      alert('Leave rejected successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to reject leave');
    } finally {
      setProcessingLeave(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <Layout>
      <div className="px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Leaves</h1>
          <div className="flex space-x-3">
            {/* View Mode Toggle for Admin/Payroll Officer */}
            {canApproveLeaves && (
              <div className="flex space-x-2 border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('myLeaves')}
                  className={`px-4 py-2 rounded-l-md ${
                    viewMode === 'myLeaves'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  My Leaves
                </button>
                <button
                  onClick={() => setViewMode('pending')}
                  className={`px-4 py-2 rounded-r-md ${
                    viewMode === 'pending'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Pending Approvals
                </button>
              </div>
            )}
            {/* Apply for Leave button (only for employees) */}
            {user?.role === 'employee' && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {showForm ? 'Cancel' : 'Apply for Leave'}
              </button>
            )}
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Apply for Leave</h2>
            
            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-red-800 mb-1">Error Applying for Leave</h3>
                    <div className="text-sm text-red-700">
                      <p className="mb-2 font-semibold">{error}</p>
                      {errorDetails && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-red-600 hover:text-red-800 font-medium mb-2">
                            📋 Click to view full error details (can copy from here)
                          </summary>
                          <div className="mt-2 space-y-2">
                            <div className="p-3 bg-red-100 rounded border border-red-200">
                              <p className="font-semibold text-xs text-red-900 mb-1">Error Message:</p>
                              <p className="text-xs text-red-800 font-mono break-all">{errorDetails.message}</p>
                            </div>
                            {errorDetails.status && (
                              <div className="p-3 bg-red-100 rounded border border-red-200">
                                <p className="font-semibold text-xs text-red-900 mb-1">HTTP Status:</p>
                                <p className="text-xs text-red-800 font-mono">{errorDetails.status} {errorDetails.statusText}</p>
                              </div>
                            )}
                            <div className="p-3 bg-red-100 rounded border border-red-200">
                              <p className="font-semibold text-xs text-red-900 mb-1">Full Error Details (JSON):</p>
                              <pre className="text-xs text-red-800 font-mono overflow-auto max-h-60 p-2 bg-white rounded border border-red-200">
                                {JSON.stringify(errorDetails, null, 2)}
                              </pre>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
                                  alert('Error details copied to clipboard!');
                                }}
                                className="mt-2 px-2 py-1 text-xs bg-red-200 text-red-800 rounded hover:bg-red-300"
                              >
                                📋 Copy to Clipboard
                              </button>
                            </div>
                          </div>
                        </details>
                      )}
                      <p className="mt-2 text-xs text-red-600">
                        💡 Tip: Open browser console (F12) for even more details
                      </p>
                    </div>
                  </div>
                  <div className="ml-auto pl-3">
                    <button
                      type="button"
                      onClick={() => setError(null)}
                      className="inline-flex text-red-400 hover:text-red-600"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Leave Type</label>
                <select
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="casual">Casual</option>
                  <option value="sick">Sick</option>
                  <option value="annual">Annual</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {viewMode === 'pending' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Employee
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Leave Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Days
                  </th>
                  {viewMode === 'pending' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Reason
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  {viewMode === 'pending' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaves.map((leave) => (
                  <tr key={leave.id}>
                    {viewMode === 'pending' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {leave.user?.name || 'N/A'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                      {leave.leaveType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(leave.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(leave.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Math.ceil((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}
                    </td>
                    {viewMode === 'pending' && (
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {leave.reason || 'No reason provided'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          leave.status
                        )}`}
                      >
                        {leave.status}
                      </span>
                    </td>
                    {viewMode === 'pending' && leave.status === 'pending' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveLeave(leave.id)}
                            disabled={processingLeave === leave.id}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingLeave === leave.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleRejectLeave(leave.id)}
                            disabled={processingLeave === leave.id}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingLeave === leave.id ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      </td>
                    )}
                    {viewMode === 'pending' && leave.status !== 'pending' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        -
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {leaves.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {viewMode === 'pending' ? 'No pending leave requests' : 'No leave records found'}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

