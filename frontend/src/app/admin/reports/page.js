'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { adminAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Loader from '@/components/common/Loader';

export default function AdminReportsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    employeeId: '',
  });
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role_name !== 'admin' && user.role_name !== 'hr') {
      router.push('/dashboard');
      return;
    }

    loadEmployees();
  }, [user, router]);

  const loadEmployees = async () => {
    try {
      const response = await adminAPI.getAllEmployees();
      setEmployees(response.data.data);
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const generateReport = async () => {
    if (!filters.startDate || !filters.endDate) {
      alert('Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      const response = await adminAPI.getAttendanceReport(filters);
      setReport(response.data.data);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!report || report.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = [
      'Employee ID',
      'Employee Name',
      'Total Days',
      'Present',
      'Absent',
      'Late',
      'On Leave',
      'Average Hours',
    ];

    const rows = report.map((record) => [
      record.employee_id,
      record.employee_name,
      record.total_days,
      record.present_days,
      record.absent_days,
      record.late_days,
      record.on_leave_days,
      record.avg_hours_worked || '0',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${filters.startDate}-to-${filters.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Attendance Reports
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
        {/* Filters Card */}
        <Card className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Generate Report
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Input
              label="Start Date"
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />

            <Input
              label="End Date"
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee (Optional)
              </label>
              <select
                name="employeeId"
                value={filters.employeeId}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.employee_id}>
                    {emp.employee_id} - {emp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button
              variant="primary"
              onClick={generateReport}
              loading={loading}
              disabled={loading}
            >
              Generate Report
            </Button>
            {report && (
              <Button variant="outline" onClick={exportToCSV}>
                Export to CSV
              </Button>
            )}
          </div>
        </Card>

        {/* Report Results */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        ) : report && report.length > 0 ? (
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Report Results
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Period: {formatDate(filters.startDate)} to{' '}
              {formatDate(filters.endDate)}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Employee ID
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Name
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">
                      Total Days
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">
                      Present
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">
                      Absent
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">
                      Late
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">
                      On Leave
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">
                      Avg. Hours
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">
                      Attendance %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.map((record) => {
                    const attendancePercentage =
                      record.total_days > 0
                        ? Math.round(
                            (record.present_days / record.total_days) * 100
                          )
                        : 0;

                    return (
                      <tr
                        key={record.employee_id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {record.employee_id}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {record.employee_name}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 text-center">
                          {record.total_days}
                        </td>
                        <td className="py-3 px-4 text-sm text-green-600 text-center font-medium">
                          {record.present_days}
                        </td>
                        <td className="py-3 px-4 text-sm text-red-600 text-center font-medium">
                          {record.absent_days}
                        </td>
                        <td className="py-3 px-4 text-sm text-orange-600 text-center font-medium">
                          {record.late_days}
                        </td>
                        <td className="py-3 px-4 text-sm text-blue-600 text-center font-medium">
                          {record.on_leave_days}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 text-center">
                          {record.avg_hours_worked || '0'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              attendancePercentage >= 90
                                ? 'bg-green-100 text-green-800'
                                : attendancePercentage >= 75
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {attendancePercentage}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary Stats */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Summary Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Employees</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {report.length}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Avg. Attendance</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {Math.round(
                      report.reduce(
                        (sum, r) =>
                          sum +
                          (r.total_days > 0
                            ? (r.present_days / r.total_days) * 100
                            : 0),
                        0
                      ) / report.length
                    )}
                    %
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Late</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {report.reduce((sum, r) => sum + r.late_days, 0)}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Absent</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {report.reduce((sum, r) => sum + r.absent_days, 0)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ) : report && report.length === 0 ? (
          <Card>
            <p className="text-center py-12 text-gray-500">
              No data found for the selected period
            </p>
          </Card>
        ) : null}
      </main>
    </div>
  );
}
