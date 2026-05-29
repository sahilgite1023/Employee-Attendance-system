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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card><div className="text-center"><p className="text-sm text-gray-600">Total</p><p className="text-2xl font-bold text-blue-600">{stats.total}</p></div></Card>
        <Card><div className="text-center"><p className="text-sm text-gray-600">Present</p><p className="text-2xl font-bold text-green-600">{stats.present}</p></div></Card>
        <Card><div className="text-center"><p className="text-sm text-gray-600">Late</p><p className="text-2xl font-bold text-orange-600">{stats.late}</p></div></Card>
        <Card><div className="text-center"><p className="text-sm text-gray-600">Absent</p><p className="text-2xl font-bold text-red-600">{stats.absent}</p></div></Card>
        <Card><div className="text-center"><p className="text-sm text-gray-600">On Leave</p><p className="text-2xl font-bold text-purple-600">{stats.onLeave}</p></div></Card>
      </div>

      <Card className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input label="Date" type="date" value={filters.date} onChange={(e) => setFilters({...filters, date: e.target.value})} />
          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <select value={filters.department} onChange={(e) => setFilters({...filters, department: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="half-day">Half Day</option>
              <option value="on-leave">On Leave</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button variant="outline" onClick={() => setFilters({ date: new Date().toISOString().split('T')[0], department: '', status: '' })} className="flex-1">Reset</Button>
            <Button onClick={exportCSV} className="flex-1">Export</Button>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold mb-4">Attendance Records</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">ID</th>
                <th className="text-left py-2 px-3">Name</th>
                <th className="text-left py-2 px-3">Department</th>
                <th className="text-left py-2 px-3">Date</th>
                <th className="text-left py-2 px-3">Check In</th>
                <th className="text-left py-2 px-3">Check Out</th>
                <th className="text-left py-2 px-3">Hours</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-left py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan="9" className="text-center py-8 text-gray-500">No records found</td></tr>
              ) : (
                records.map(r => (
                  <tr key={`${r.employee_id}-${r.attendance_date}`} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">{r.employee_id}</td>
                    <td className="py-2 px-3">{r.first_name} {r.last_name}</td>
                    <td className="py-2 px-3">{r.department || '-'}</td>
                    <td className="py-2 px-3">{formatDate(r.attendance_date)}</td>
                    <td className="py-2 px-3">{formatTime(r.check_in_time)}</td>
                    <td className="py-2 px-3">{formatTime(r.check_out_time)}</td>
                    <td className="py-2 px-3">{r.total_hours || '-'}</td>
                    <td className="py-2 px-3">
                      <Badge variant={r.status === 'present' ? 'success' : r.status === 'late' ? 'warning' : r.status === 'absent' ? 'danger' : 'info'}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-2 px-3">
                      {r.check_out_time ? (
                        <Button
                          size="sm"
                          variant="outline"
                          loading={revokingId === r.id}
                          disabled={revokingId !== null && revokingId !== r.id}
                          onClick={() => handleRevokeCheckOut(r)}
                        >
                          Revoke Checkout
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
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
