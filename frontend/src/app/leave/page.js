'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { leaveAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Input from '@/components/common/Input';
import Alert from '@/components/common/Alert';
import StatCard from '@/components/common/StatCard';
import EmployeeLayout from '@/components/common/EmployeeLayout';
import Loader from '@/components/common/Loader';

export default function LeavePage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
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
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    loadLeaveData();
  }, [user, router, authLoading]);

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
      <EmployeeLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader />
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="page-title">Leave Management</h1>
            <p className="page-subtitle mt-1">Apply for leave and track your requests.</p>
          </div>
          <Button
            variant={showApplyForm ? 'secondary' : 'primary'}
            onClick={() => setShowApplyForm(!showApplyForm)}
            icon={!showApplyForm && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          >
            {showApplyForm ? 'Cancel' : 'Apply for Leave'}
          </Button>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <Alert type="success" message={successMessage} onClose={() => setSuccessMessage('')} />
        )}
        {errorMessage && (
          <Alert type="danger" message={errorMessage} onClose={() => setErrorMessage('')} />
        )}

        {/* Leave Balance Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Paid Leaves"
            value={leaveBalance?.paidLeavesBalance || 0}
            subtitle="Available"
            color="primary"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          />
          <StatCard
            title="Unpaid Leaves"
            value={leaveBalance?.unpaidLeavesTaken || 0}
            subtitle="Taken"
            color="warning"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard
            title="Pending"
            value={leaveBalance?.pendingRequests || 0}
            subtitle="Requests"
            color="info"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          />
          <StatCard
            title="Approved"
            value={leaveBalance?.approvedRequests || 0}
            subtitle="This Year"
            color="success"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
        </div>

        {/* Apply Leave Form */}
        {showApplyForm && (
          <Card>
            <h2 className="text-xl font-bold text-slate-900 mb-4">
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
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reason
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows="4"
                  className={`input ${errors.reason ? 'input-error' : ''}`}
                  placeholder="Please provide a detailed reason for your leave..."
                  disabled={submitting}
                />
                {errors.reason && (
                  <p className="text-danger-600 text-sm mt-1.5">{errors.reason}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  {formData.startDate && formData.endDate && (
                    <>
                      Duration:{' '}
                      <span className="font-semibold text-slate-800 tabular-nums">
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
        <Card title="My Leave Requests" noPadding>
          <div className="table-container border-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Days</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests && leaveRequests.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-500">
                      No leave requests found
                    </td>
                  </tr>
                ) : (
                  leaveRequests && leaveRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="font-medium text-slate-900">
                        {formatDate(request.start_date)}
                      </td>
                      <td>{formatDate(request.end_date)}</td>
                      <td className="tabular-nums">{request.total_days}</td>
                      <td>
                        <Badge
                          variant={
                            request.leave_type === 'paid' ? 'success' : 'warning'
                          }
                        >
                          {request.leave_type}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={request.status}>{request.status}</Badge>
                      </td>
                      <td className="text-slate-500 max-w-xs truncate">
                        {request.reason}
                      </td>
                      <td>
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
                              className="text-xs text-danger-600 cursor-help"
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
      </div>
    </EmployeeLayout>
  );
}
