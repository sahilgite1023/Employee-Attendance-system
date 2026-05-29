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
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Reports</h2>
          <p className="page-subtitle mt-1">Generate and export attendance analytics.</p>
        </div>

        <Card title="Generate Report">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Input label="Start Date" type="date" name="startDate" value={filters.startDate} onChange={(e) => setFilters({...filters, startDate: e.target.value})} />
            <Input label="End Date" type="date" name="endDate" value={filters.endDate} onChange={(e) => setFilters({...filters, endDate: e.target.value})} />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Employee (Optional)</label>
              <select value={filters.employeeId} onChange={(e) => setFilters({...filters, employeeId: e.target.value})} className="input">
                <option value="">All Employees</option>
                {employees.map(e => <option key={e.id} value={e.employee_id}>{e.employee_id} - {e.first_name} {e.last_name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={generateReport} disabled={loading}>{loading ? 'Generating...' : 'Generate Report'}</Button>
            {report && <Button variant="secondary" onClick={exportCSV}>Export CSV</Button>}
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12"><Loader /></div>
        ) : report?.length > 0 ? (
          <Card title="Report Results" subtitle={`Period: ${formatDate(filters.startDate)} to ${formatDate(filters.endDate)}`}>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th className="text-center">Total</th>
                    <th className="text-center">Present</th>
                    <th className="text-center">Absent</th>
                    <th className="text-center">Late</th>
                    <th className="text-center">Leave</th>
                    <th className="text-center">Avg Hours</th>
                    <th className="text-center">%</th>
                  </tr>
                </thead>
                <tbody>
                  {report.map(r => {
                    const pct = r.total_days > 0 ? Math.round((r.present / r.total_days) * 100) : 0;
                    return (
                      <tr key={r.employee_id}>
                        <td className="font-medium text-slate-900">{r.employee_id}</td>
                        <td>{r.first_name} {r.last_name}</td>
                        <td className="text-center tabular-nums">{r.total_days}</td>
                        <td className="text-center tabular-nums text-success-600 font-medium">{r.present}</td>
                        <td className="text-center tabular-nums text-danger-600 font-medium">{r.absent}</td>
                        <td className="text-center tabular-nums text-warning-600 font-medium">{r.late}</td>
                        <td className="text-center tabular-nums text-primary-600 font-medium">{r.on_leave_days || 0}</td>
                        <td className="text-center tabular-nums">{r.avg_hours || '0'}</td>
                        <td className="text-center">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${pct >= 90 ? 'bg-success-50 text-success-700 ring-1 ring-inset ring-success-200' : pct >= 75 ? 'bg-warning-50 text-warning-700 ring-1 ring-inset ring-warning-200' : 'bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-200'}`}>
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-primary-50 ring-1 ring-inset ring-primary-100 rounded-2xl p-4">
                <p className="text-sm text-slate-500">Total Employees</p>
                <p className="text-2xl font-bold text-primary-600 tabular-nums">{report.length}</p>
              </div>
              <div className="bg-success-50 ring-1 ring-inset ring-success-100 rounded-2xl p-4">
                <p className="text-sm text-slate-500">Avg Attendance</p>
                <p className="text-2xl font-bold text-success-600 tabular-nums">{Math.round(report.reduce((s, r) => s + (r.total_days > 0 ? (r.present / r.total_days) * 100 : 0), 0) / report.length)}%</p>
              </div>
              <div className="bg-warning-50 ring-1 ring-inset ring-warning-100 rounded-2xl p-4">
                <p className="text-sm text-slate-500">Total Late</p>
                <p className="text-2xl font-bold text-warning-600 tabular-nums">{report.reduce((s, r) => s + r.late, 0)}</p>
              </div>
              <div className="bg-danger-50 ring-1 ring-inset ring-danger-100 rounded-2xl p-4">
                <p className="text-sm text-slate-500">Total Absent</p>
                <p className="text-2xl font-bold text-danger-600 tabular-nums">{report.reduce((s, r) => s + r.absent, 0)}</p>
              </div>
            </div>
          </Card>
        ) : report && <Card><p className="text-center py-8 text-slate-500">No data found</p></Card>}
      </div>
    </AdminLayout>
  );
}
