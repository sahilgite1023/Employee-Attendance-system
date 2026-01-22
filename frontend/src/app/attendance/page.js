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

export default function AttendancePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadAttendanceData();
    loadStats();
  }, [user, router, filters, pagination.page]);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      const response = await attendanceAPI.getHistory(params);
      const data = response.data.data;

      setAttendance(data.attendance);
      setPagination({
        ...pagination,
        total: data.total,
        totalPages: data.totalPages,
      });
    } catch (error) {
      console.error('Failed to load attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await attendanceAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: '',
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const exportToCSV = () => {
    if (attendance.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Date', 'Check In', 'Check Out', 'Total Hours', 'Status'];
    const rows = attendance.map((record) => [
      formatDate(record.date),
      formatTime(record.check_in_time),
      formatTime(record.check_out_time),
      record.total_hours || '-',
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
    a.download = `attendance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!user) {
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
              Attendance History
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
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">This Month</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.thisMonth?.present || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Days Present</p>
              </div>
            </Card>

            <Card>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Late Arrivals</p>
                <p className="text-3xl font-bold text-orange-600">
                  {stats.thisMonth?.late || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">This Month</p>
              </div>
            </Card>

            <Card>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Absences</p>
                <p className="text-3xl font-bold text-red-600">
                  {stats.thisMonth?.absent || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">This Month</p>
              </div>
            </Card>

            <Card>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Avg. Hours/Day</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.averageHoursPerDay || '0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">This Month</p>
              </div>
            </Card>
          </div>
        )}

        {/* Filters Card */}
        <Card className="mb-8">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
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
                  Status
                </label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="on-time">On Time</option>
                  <option value="late">Late</option>
                  <option value="half-day">Half Day</option>
                  <option value="absent">Absent</option>
                  <option value="on-leave">On Leave</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button variant="primary" onClick={exportToCSV}>
                Export CSV
              </Button>
            </div>
          </div>
        </Card>

        {/* Attendance Table */}
        <Card>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        Day
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
                    {attendance.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="text-center py-12 text-gray-500"
                        >
                          No attendance records found
                        </td>
                      </tr>
                    ) : (
                      attendance.map((record) => (
                        <tr
                          key={record.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {new Date(record.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {new Date(record.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                            })}
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
                            <Badge variant={record.status}>{record.status}</Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
                    of {pagination.total} records
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>

                    {[...Array(pagination.totalPages)].map((_, index) => {
                      const pageNum = index + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === pagination.totalPages ||
                        (pageNum >= pagination.page - 1 &&
                          pageNum <= pagination.page + 1)
                      ) {
                        return (
                          <Button
                            key={pageNum}
                            variant={
                              pagination.page === pageNum ? 'primary' : 'outline'
                            }
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      } else if (
                        pageNum === pagination.page - 2 ||
                        pageNum === pagination.page + 2
                      ) {
                        return <span key={pageNum} className="px-2">...</span>;
                      }
                      return null;
                    })}

                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
