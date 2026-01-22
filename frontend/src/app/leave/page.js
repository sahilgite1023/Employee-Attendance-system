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
import Input from '@/components/common/Input';
import Loader from '@/components/common/Loader';

export default function LeavePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadLeaveData();
  }, [user, router]);

  const loadLeaveData = async () => {
    try {
      setLoading(true);
      const [requestsRes, balanceRes] = await Promise.all([
        leaveAPI.getMyRequests(),
        leaveAPI.getBalance(),
      ]);

      setLeaveRequests(requestsRes?.data || []);
      setLeaveBalance(balanceRes?.data);
    } catch (error) {
      console.error('Failed to load leave data:', error);
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    } else if (formData.reason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      await leaveAPI.apply({
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
      });
      setSuccessMessage('Leave request submitted successfully!');
      setFormData({
        startDate: '',
        endDate: '',
        reason: '',
      });
      setShowApplyForm(false);
      await loadLeaveData();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Failed to submit leave request'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) {
      return;
    }

    try {
      await leaveAPI.cancel(id);
      setSuccessMessage('Leave request cancelled successfully!');
      await loadLeaveData();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Failed to cancel leave request'
      );
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
              <Link href="/dashboard">
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
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-green-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Leave Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Paid Leaves</p>
              <p className="text-3xl font-bold text-blue-600">
                {leaveBalance?.paidLeavesBalance || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Available</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Unpaid Leaves</p>
              <p className="text-3xl font-bold text-orange-600">
                {leaveBalance?.unpaidLeavesTaken || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Taken</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">
                {leaveBalance?.pendingRequests || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Requests</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Approved</p>
              <p className="text-3xl font-bold text-green-600">
                {leaveBalance?.approvedRequests || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">This Year</p>
            </div>
          </Card>
        </div>

        {/* Apply Leave Button */}
        <div className="mb-8">
          <Button
            variant="primary"
            onClick={() => setShowApplyForm(!showApplyForm)}
          >
            {showApplyForm ? 'Cancel' : 'Apply for Leave'}
          </Button>
        </div>

        {/* Apply Leave Form */}
        {showApplyForm && (
          <Card className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Apply for Leave
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  error={errors.startDate}
                  disabled={submitting}
                  min={new Date().toISOString().split('T')[0]}
                />

                <Input
                  label="End Date"
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  error={errors.endDate}
                  disabled={submitting}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows="4"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.reason ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Please provide a detailed reason for your leave..."
                  disabled={submitting}
                />
                {errors.reason && (
                  <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-gray-600">
                  {formData.startDate && formData.endDate && (
                    <>
                      Duration:{' '}
                      <span className="font-semibold">
                        {Math.ceil(
                          (new Date(formData.endDate) -
                            new Date(formData.startDate)) /
                            (1000 * 60 * 60 * 24)
                        ) + 1}{' '}
                        day(s)
                      </span>
                    </>
                  )}
                </p>
                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  disabled={submitting}
                >
                  Submit Request
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Leave Requests Table */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              My Leave Requests
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
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
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Reason
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests && leaveRequests.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-gray-500">
                      No leave requests found
                    </td>
                  </tr>
                ) : (
                  leaveRequests && leaveRequests.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {formatDate(request.start_date)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {formatDate(request.end_date)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {request.total_days}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <Badge
                          variant={
                            request.leave_type === 'paid' ? 'success' : 'warning'
                          }
                        >
                          {request.leave_type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={request.status}>{request.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                        {request.reason}
                      </td>
                      <td className="py-3 px-4">
                        {request.status === 'pending' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleCancel(request.id)}
                          >
                            Cancel
                          </Button>
                        )}
                        {request.status === 'rejected' &&
                          request.rejection_reason && (
                            <span
                              className="text-xs text-red-600 cursor-help"
                              title={request.rejection_reason}
                            >
                              View Reason
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
