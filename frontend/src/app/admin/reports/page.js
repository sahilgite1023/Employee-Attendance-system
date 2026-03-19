'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { adminAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Loader from '@/components/common/Loader';

export default function AdminReportsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', employeeId: '' });
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      router.push(user ? '/dashboard' : '/login');
      return;
    }
    loadEmployees();
  }, [user, router, authLoading]);

  const loadEmployees = async () => {
    try {
      const response = await adminAPI.getEmployees();
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  };

  const generateReport = async () => {
    if (!filters.startDate || !filters.endDate) {
      alert('Please select both start and end dates');
      return;
    }
    setLoading(true);
    try {
      const response = await adminAPI.getAttendanceReport(filters);
      setReport(response.data || []);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!report?.length) return alert('No data to export');
    const headers = ['Employee ID', 'Name', 'Total Days', 'Present', 'Absent', 'Late', 'On Leave', 'Avg Hours'];
    const rows = report.map(r => [
      r.employee_id,
      `${r.first_name} ${r.last_name}`,
      r.total_days,
      r.present,
      r.absent,
      r.late,
      r.on_leave_days || 0,
      r.avg_hours || '0',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${filters.startDate}-to-${filters.endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <Card className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Generate Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Input label="Start Date" type="date" name="startDate" value={filters.startDate} onChange={(e) => setFilters({...filters, startDate: e.target.value})} />
          <Input label="End Date" type="date" name="endDate" value={filters.endDate} onChange={(e) => setFilters({...filters, endDate: e.target.value})} />
          <div>
            <label className="block text-sm font-medium mb-1">Employee (Optional)</label>
            <select value={filters.employeeId} onChange={(e) => setFilters({...filters, employeeId: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
              <option value="">All Employees</option>
              {employees.map(e => <option key={e.id} value={e.employee_id}>{e.employee_id} - {e.first_name} {e.last_name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-4">
          <Button onClick={generateReport} disabled={loading}>{loading ? 'Generating...' : 'Generate Report'}</Button>
          {report && <Button variant="outline" onClick={exportCSV}>Export CSV</Button>}
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12"><Loader /></div>
      ) : report?.length > 0 ? (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Report Results</h3>
          <p className="text-sm text-gray-600 mb-4">Period: {formatDate(filters.startDate)} to {formatDate(filters.endDate)}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">ID</th>
                  <th className="text-left py-2 px-3">Name</th>
                  <th className="text-center py-2 px-3">Total</th>
                  <th className="text-center py-2 px-3">Present</th>
                  <th className="text-center py-2 px-3">Absent</th>
                  <th className="text-center py-2 px-3">Late</th>
                  <th className="text-center py-2 px-3">Leave</th>
                  <th className="text-center py-2 px-3">Avg Hours</th>
                  <th className="text-center py-2 px-3">%</th>
                </tr>
              </thead>
              <tbody>
                {report.map(r => {
                  const pct = r.total_days > 0 ? Math.round((r.present / r.total_days) * 100) : 0;
                  return (
                    <tr key={r.employee_id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3">{r.employee_id}</td>
                      <td className="py-2 px-3">{r.first_name} {r.last_name}</td>
                      <td className="py-2 px-3 text-center">{r.total_days}</td>
                      <td className="py-2 px-3 text-center text-green-600">{r.present}</td>
                      <td className="py-2 px-3 text-center text-red-600">{r.absent}</td>
                      <td className="py-2 px-3 text-center text-orange-600">{r.late}</td>
                      <td className="py-2 px-3 text-center text-blue-600">{r.on_leave_days || 0}</td>
                      <td className="py-2 px-3 text-center">{r.avg_hours || '0'}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${pct >= 90 ? 'bg-green-100 text-green-800' : pct >= 75 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-6 pt-6 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded p-4">
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-blue-600">{report.length}</p>
            </div>
            <div className="bg-green-50 rounded p-4">
              <p className="text-sm text-gray-600">Avg Attendance</p>
              <p className="text-2xl font-bold text-green-600">{Math.round(report.reduce((s, r) => s + (r.total_days > 0 ? (r.present / r.total_days) * 100 : 0), 0) / report.length)}%</p>
            </div>
            <div className="bg-orange-50 rounded p-4">
              <p className="text-sm text-gray-600">Total Late</p>
              <p className="text-2xl font-bold text-orange-600">{report.reduce((s, r) => s + r.late, 0)}</p>
            </div>
            <div className="bg-red-50 rounded p-4">
              <p className="text-sm text-gray-600">Total Absent</p>
              <p className="text-2xl font-bold text-red-600">{report.reduce((s, r) => s + r.absent, 0)}</p>
            </div>
          </div>
        </Card>
      ) : report && <Card><p className="text-center py-8 text-gray-500">No data found</p></Card>}
    </AdminLayout>
  );
}
