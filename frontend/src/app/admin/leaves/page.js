'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { leaveAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Alert from '@/components/common/Alert';
import Loader from '@/components/common/Loader';

export default function AdminLeavesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      router.push(user ? '/dashboard' : '/login');
      return;
    }
    loadRequests();
  }, [user, router, authLoading, filter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await leaveAPI.getAllRequests({ status: filter });
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, status, notes = '') => {
    setMessage({ type: '', text: '' });
    setProcessing(id);
    try {
      await leaveAPI.review(id, { status, reviewNotes: notes });
      setMessage({ type: 'success', text: `Leave ${status} successfully!` });
      loadRequests();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || `Failed to ${status} leave` });
    } finally {
      setProcessing(null);
    }
  };

  const handleApprove = (id) => {
    if (confirm('Approve this leave request?')) {
      handleReview(id, 'approved');
    }
  };

  const handleReject = (id) => {
    const reason = prompt('Rejection reason:');
    if (reason?.trim()) {
      handleReview(id, 'rejected', reason);
    } else if (reason !== null) {
      alert('Reason required');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Leave Requests</h2>
          <p className="page-subtitle mt-1">Review and act on employee leave applications.</p>
        </div>

        {message.text && (
          <Alert
            type={message.type === 'success' ? 'success' : 'danger'}
            message={message.text}
            onClose={() => setMessage({ type: '', text: '' })}
          />
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant={filter === 'pending' ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter('pending')}>Pending</Button>
          <Button variant={filter === 'approved' ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter('approved')}>Approved</Button>
          <Button variant={filter === 'rejected' ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter('rejected')}>Rejected</Button>
          <Button variant={filter === '' ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter('')}>All</Button>
        </div>

        <Card title={`Leave Requests (${requests.length})`} noPadding>
          <div className="table-container border-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Days</th>
                  <th>Type</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-12 text-slate-500">No requests found</td></tr>
                ) : (
                  requests.map(r => (
                    <tr key={r.id}>
                      <td>
                        <div className="font-medium text-slate-900">{r.employee_name}</div>
                        <div className="text-xs text-slate-400">{r.employee_id}</div>
                      </td>
                      <td>{formatDate(r.start_date)}</td>
                      <td>{formatDate(r.end_date)}</td>
                      <td className="tabular-nums">{r.total_days}</td>
                      <td><Badge variant={r.leave_type === 'paid' ? 'success' : 'warning'}>{r.leave_type}</Badge></td>
                      <td className="max-w-xs truncate" title={r.reason}>{r.reason}</td>
                      <td><Badge variant={r.status}>{r.status}</Badge></td>
                      <td>
                        {r.status === 'pending' ? (
                          <div className="flex gap-2">
                            <Button variant="success" size="sm" onClick={() => handleApprove(r.id)} disabled={processing === r.id}>Approve</Button>
                            <Button variant="danger" size="sm" onClick={() => handleReject(r.id)} disabled={processing === r.id}>Reject</Button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">{r.reviewed_by_name || 'Reviewed'}</span>
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
    </AdminLayout>
  );
}
