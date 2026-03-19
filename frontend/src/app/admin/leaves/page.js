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
      {message.text && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <Button variant={filter === 'pending' ? 'primary' : 'outline'} onClick={() => setFilter('pending')}>Pending</Button>
        <Button variant={filter === 'approved' ? 'primary' : 'outline'} onClick={() => setFilter('approved')}>Approved</Button>
        <Button variant={filter === 'rejected' ? 'primary' : 'outline'} onClick={() => setFilter('rejected')}>Rejected</Button>
        <Button variant={filter === '' ? 'primary' : 'outline'} onClick={() => setFilter('')}>All</Button>
      </div>

      <Card>
        <h3 className="text-lg font-semibold mb-4">Leave Requests ({requests.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Employee</th>
                <th className="text-left py-2 px-3">Start</th>
                <th className="text-left py-2 px-3">End</th>
                <th className="text-left py-2 px-3">Days</th>
                <th className="text-left py-2 px-3">Type</th>
                <th className="text-left py-2 px-3">Reason</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-left py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-8 text-gray-500">No requests found</td></tr>
              ) : (
                requests.map(r => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">
                      <div className="font-medium">{r.employee_name}</div>
                      <div className="text-xs text-gray-500">{r.employee_id}</div>
                    </td>
                    <td className="py-2 px-3">{formatDate(r.start_date)}</td>
                    <td className="py-2 px-3">{formatDate(r.end_date)}</td>
                    <td className="py-2 px-3">{r.total_days}</td>
                    <td className="py-2 px-3"><Badge variant={r.leave_type === 'paid' ? 'success' : 'warning'}>{r.leave_type}</Badge></td>
                    <td className="py-2 px-3 max-w-xs truncate" title={r.reason}>{r.reason}</td>
                    <td className="py-2 px-3"><Badge variant={r.status}>{r.status}</Badge></td>
                    <td className="py-2 px-3">
                      {r.status === 'pending' ? (
                        <div className="flex gap-2">
                          <Button variant="success" size="sm" onClick={() => handleApprove(r.id)} disabled={processing === r.id}>Approve</Button>
                          <Button variant="danger" size="sm" onClick={() => handleReject(r.id)} disabled={processing === r.id}>Reject</Button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">{r.reviewed_by_name || 'Reviewed'}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminLayout>
  );
}
