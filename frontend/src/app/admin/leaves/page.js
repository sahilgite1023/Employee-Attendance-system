'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { leaveAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Loader from '@/components/common/Loader';

export default function AdminLeavesPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role_name !== 'admin' && user.role_name !== 'hr') {
      router.push('/dashboard');
      return;
    }

    loadLeaveRequests();
  }, [user, router, filter]);

  const loadLeaveRequests = async () => {
    try {
      setLoading(true);
      const response = await leaveAPI.getMyRequests({ status: filter });
      setLeaveRequests(response.data.data);
    } catch (error) {
      console.error('Failed to load leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, status, rejectionReason = null) => {
    setSuccessMessage('');
    setErrorMessage('');
    setProcessingId(id);

    try {
      await leaveAPI.review(id, status, rejectionReason);
      setSuccessMessage(
        `Leave request ${status === 'approved' ? 'approved' : 'rejected'} successfully!`
      );
      await loadLeaveRequests();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || `Failed to ${status} leave request`
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleApprove = (id) => {
    if (confirm('Are you sure you want to approve this leave request?')) {
      handleReview(id, 'approved');
    }
  };

  const handleReject = (id) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason && reason.trim()) {
      handleReview(id, 'rejected', reason);
    } else if (reason !== null) {
      alert('Rejection reason is required');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Leave Management
            </h1>
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex space-x-4 mb-6">
          <Button
            variant={filter === 'pending' ? 'primary' : 'outline'}
            onClick={() => setFilter('pending')}
          >
            Pending
          </Button>
          <Button
            variant={filter === 'approved' ? 'primary' : 'outline'}
            onClick={() => setFilter('approved')}
          >
            Approved
          </Button>
          <Button
            variant={filter === 'rejected' ? 'primary' : 'outline'}
            onClick={() => setFilter('rejected')}
          >
            Rejected
          </Button>
          <Button
            variant={filter === '' ? 'primary' : 'outline'}
            onClick={() => setFilter('')}
          >
            All
          </Button>
        </div>

        {/* Leave Requests Table */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Leave Requests ({leaveRequests.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Employee
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Start Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    End Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Days
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Reason
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-gray-500">
                      No leave requests found
                    </td>
                  </tr>
                ) : (
                  leaveRequests.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900">
                        <div>
                          <p className="font-medium">{request.employee_name}</p>
                          <p className="text-xs text-gray-500">
                            {request.employee_id}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {formatDate(request.start_date)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {formatDate(request.end_date)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {request.total_days}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            request.leave_type === 'paid' ? 'success' : 'warning'
                          }
                        >
                          {request.leave_type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 max-w-xs">
                        <div className="truncate" title={request.reason}>
                          {request.reason}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={request.status}>{request.status}</Badge>
                        {request.status === 'rejected' &&
                          request.rejection_reason && (
                            <p
                              className="text-xs text-red-600 mt-1 cursor-help"
                              title={request.rejection_reason}
                            >
                              {request.rejection_reason.substring(0, 30)}...
                            </p>
                          )}
                      </td>
                      <td className="py-3 px-4">
                        {request.status === 'pending' && (
                          <div className="flex space-x-2">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleApprove(request.id)}
                              disabled={processingId === request.id}
                              loading={processingId === request.id}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleReject(request.id)}
                              disabled={processingId === request.id}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                        {request.status !== 'pending' && (
                          <span className="text-xs text-gray-500">
                            {request.reviewed_by && `By: ${request.reviewed_by}`}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
