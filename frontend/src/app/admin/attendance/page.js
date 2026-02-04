'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceAPI } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Input from '@/components/common/Input';
import Loader from '@/components/common/Loader';

export default function AdminAttendancePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    department: '',
    status: '',
  });
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    loadAttendance();
  }, [user, router, filters]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.date) params.date = filters.date;
      if (filters.department) params.department = filters.department;
      if (filters.status) params.status = filters.status;

      const response = await attendanceAPI.getAll(params);
      setAttendanceRecords(response.data || []);

      // Extract unique departments
      const uniqueDepts = [...new Set(response.data?.map(r => r.department).filter(Boolean))];
      setDepartments(uniqueDepts);
    } catch (error) {
      console.error('Failed to load attendance:', error);
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReset = () => {
    setFilters({
      date: new Date().toISOString().split('T')[0],
      department: '',
      status: '',
    });
  };

  const exportToCSV = () => {
    if (!attendanceRecords || attendanceRecords.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = [
      'Employee ID',
      'Employee Name',
      'Department',
      'Date',
      'Check In',
      'Check Out',
      'Total Hours',
      'Status',
    ];

    const rows = attendanceRecords.map((record) => [
      record.employee_id,
      `${record.first_name} ${record.last_name}`,
      record.department || '',
      record.attendance_date,
      formatTime(record.check_in_time),
      formatTime(record.check_out_time),
      record.total_hours || '0',
      record.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${filters.date}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return 'success';
      case 'late':
        return 'warning';
      case 'absent':
        return 'danger';
      case 'half-day':
        return 'info';
      case 'on-leave':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const calculateStats = () => {
    if (!attendanceRecords || attendanceRecords.length === 0) {
      return {
        total: 0,
        present: 0,
        late: 0,
        absent: 0,
        onLeave: 0,
      };
    }

    return {
      total: attendanceRecords.length,
      present: attendanceRecords.filter(r => r.status === 'present').length,
      late: attendanceRecords.filter(r => r.status === 'late' || r.is_late).length,
      absent: attendanceRecords.filter(r => r.status === 'absent').length,
      onLeave: attendanceRecords.filter(r => r.status === 'on-leave').length,
    };
  };

  const stats = calculateStats();

  if (loading && !attendanceRecords.length) {
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Attendance Management
            </h1>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/admin/dashboard">
                <Button variant="outline" size="sm">Back to Dashboard</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>

          {/* Admin Navigation Bar */}
          <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-200 pt-4">
            <Link href="/admin/dashboard">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">📊 Dashboard</Button>
            </Link>
            <Link href="/admin/employees">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">👥 Employees</Button>
            </Link>
            <Link href="/admin/attendance">
              <Button variant="primary" size="sm" className="text-xs sm:text-sm">📋 Attendance</Button>
            </Link>
            <Link href="/admin/leaves">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">🌴 Leaves</Button>
            </Link>
            <Link href="/admin/reports">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">📊 Reports</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.total}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600">Present</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.present}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600">Late</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.late}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600">Absent</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.absent}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600">On Leave</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{stats.onLeave}</p>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Date"
              type="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                name="department"
                value={filters.department}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
                <option value="half-day">Half Day</option>
                <option value="on-leave">On Leave</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                Reset
              </Button>
              <Button variant="primary" onClick={exportToCSV} className="flex-1">
                Export CSV
              </Button>
            </div>
          </div>
        </Card>

        {/* Attendance Table */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Attendance Records
            </h2>
            {loading && (
              <div className="flex items-center gap-2">
                <Loader size="sm" />
                <span className="text-sm text-gray-600">Loading...</span>
              </div>
            )}
          </div>

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
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Department
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Check In
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Check Out
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Total Hours
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-gray-500">
                      No attendance records found for the selected date
                    </td>
                  </tr>
                ) : (
                  attendanceRecords.map((record) => (
                    <tr
                      key={`${record.employee_id}-${record.attendance_date}`}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {record.employee_id}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {record.first_name} {record.last_name}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {record.department || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {formatDate(record.attendance_date)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {formatTime(record.check_in_time)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {formatTime(record.check_out_time)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {record.total_hours || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusColor(record.status)}>
                          {record.status}
                          {record.is_late && record.status === 'present' ? ' (Late)' : ''}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Info */}
          {attendanceRecords.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {attendanceRecords.length} records for {formatDate(filters.date)}
              </p>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
