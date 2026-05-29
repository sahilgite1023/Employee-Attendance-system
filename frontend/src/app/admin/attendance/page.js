'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceAPI } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Input from '@/components/common/Input';
import StatCard from '@/components/common/StatCard';
import Loader from '@/components/common/Loader';

export default function AdminAttendancePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    department: '',
    status: '',
  });
  const [departments, setDepartments] = useState([]);
  const [revokingId, setRevokingId] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      router.push(user ? '/dashboard' : '/login');
      return;
    }
    loadAttendance();
  }, [user, router, authLoading, filters]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.date) params.date = filters.date;
      if (filters.department) params.department = filters.department;
      if (filters.status) params.status = filters.status;

      const response = await attendanceAPI.getAll(params);
      setRecords(response.data || []);
      const uniqueDepts = [...new Set(response.data?.map(r => r.department).filter(Boolean))];
      setDepartments(uniqueDepts);
    } catch (error) {
      console.error('Failed to load attendance:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!records.length) return alert('No data to export');
    const headers = ['Employee ID', 'Name', 'Department', 'Date', 'Check In', 'Check Out', 'Hours', 'Status'];
    const rows = records.map(r => [
      r.employee_id,
      `${r.first_name} ${r.last_name}`,
      r.department || '',
      r.attendance_date,
      formatTime(r.check_in_time),
      formatTime(r.check_out_time),
      r.total_hours || '0',
      r.status,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${filters.date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRevokeCheckOut = async (record) => {
    if (!record?.id || !record?.check_out_time) return;

    const confirmed = window.confirm(
      `Revoke checkout for ${record.first_name} ${record.last_name} on ${formatDate(record.attendance_date)}?`
    );
    if (!confirmed) return;

    try {
      setRevokingId(record.id);
      await attendanceAPI.revokeCheckOut(record.id);
      await loadAttendance();
      alert('Checkout revoked successfully');
    } catch (error) {
      alert(error?.message || 'Failed to revoke checkout');
    } finally {
      setRevokingId(null);
    }
  };

  const stats = {
    total: records.length,
    present: records.filter(r => r.status === 'present').length,
    late: records.filter(r => r.status === 'late' || r.is_late).length,
    absent: records.filter(r => r.status === 'absent').length,
    onLeave: records.filter(r => r.status === 'on-leave').length,
  };

  if (loading && !records.length) {
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
          <h2 className="text-xl font-bold text-slate-900">Attendance Records</h2>
          <p className="page-subtitle mt-1">Monitor daily attendance across the organization.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard title="Total" value={stats.total} color="primary" />
          <StatCard title="Present" value={stats.present} color="success" />
          <StatCard title="Late" value={stats.late} color="warning" />
          <StatCard title="Absent" value={stats.absent} color="danger" />
          <StatCard title="On Leave" value={stats.onLeave} color="info" />
        </div>

        <Card title="Filters">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input label="Date" type="date" value={filters.date} onChange={(e) => setFilters({...filters, date: e.target.value})} />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
              <select value={filters.department} onChange={(e) => setFilters({...filters, department: e.target.value})} className="input">
                <option value="">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="input">
                <option value="">All Status</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
                <option value="half-day">Half Day</option>
                <option value="on-leave">On Leave</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button variant="secondary" onClick={() => setFilters({ date: new Date().toISOString().split('T')[0], department: '', status: '' })} className="flex-1">Reset</Button>
              <Button onClick={exportCSV} className="flex-1">Export</Button>
            </div>
          </div>
        </Card>

        <Card title="Records" noPadding>
          <div className="table-container border-0">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan="9" className="text-center py-12 text-slate-500">No records found</td></tr>
                ) : (
                  records.map(r => (
                    <tr key={`${r.employee_id}-${r.attendance_date}`}>
                      <td className="font-medium text-slate-900">{r.employee_id}</td>
                      <td>{r.first_name} {r.last_name}</td>
                      <td>{r.department || '-'}</td>
                      <td>{formatDate(r.attendance_date)}</td>
                      <td className="tabular-nums">{formatTime(r.check_in_time)}</td>
                      <td className="tabular-nums">{formatTime(r.check_out_time)}</td>
                      <td className="tabular-nums">{r.total_hours || '-'}</td>
                      <td>
                        <Badge variant={r.status === 'present' ? 'success' : r.status === 'late' ? 'warning' : r.status === 'absent' ? 'danger' : 'info'}>
                          {r.status}
                        </Badge>
                      </td>
                      <td>
                        {r.check_out_time ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={revokingId === r.id}
                            disabled={revokingId !== null && revokingId !== r.id}
                            onClick={() => handleRevokeCheckOut(r)}
                          >
                            Revoke Checkout
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
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
