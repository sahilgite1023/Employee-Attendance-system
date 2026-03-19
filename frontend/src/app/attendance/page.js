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
import AttendanceCalendar from '@/components/common/AttendanceCalendar';
import AttendanceDonut from '@/components/common/AttendanceDonut';

export default function AttendancePage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [viewMode, setViewMode] = useState('calendar');
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
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    loadAttendanceData();
    loadStats();
    loadAllRecordsForCalendar();
  }, [user, router, authLoading, filters, pagination.page]);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      const response = await attendanceAPI.getHistory(params);
      const data = response.data;

      setAttendance(data.records || []);
      setPagination({
        ...pagination,
        total: data.pagination?.totalRecords || 0,
        totalPages: data.pagination?.totalPages || 0,
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
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadAllRecordsForCalendar = async () => {
    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const response = await attendanceAPI.getHistory({
        limit: 200,
        startDate: threeMonthsAgo.toISOString().split('T')[0],
      });
      setAllRecords(response.data?.records || []);
    } catch (error) {
      console.error('Failed to load calendar records:', error);
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
      formatDate(record.attendance_date),
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
      {/* Sticky Header with Navigation */}
      <header className="page-header sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="page-title">Attendance</h1>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </Button>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="mt-4 flex gap-2 border-t border-gray-200 pt-4 overflow-x-auto">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Button>
            </Link>
            <Link href="/attendance">
              <Button variant="primary" size="sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Attendance
              </Button>
            </Link>
            <Link href="/leave">
              <Button variant="ghost" size="sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Leave
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost" size="sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-green-100 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Present</p>
                  <p className="text-2xl font-bold text-green-600">{stats.present_days || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-yellow-100 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Late</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.late_days || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-red-100 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Absent</p>
                  <p className="text-2xl font-bold text-red-600">{stats.absent_days || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Avg Hours</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.avg_hours || '0.0'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="inline-flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span>Calendar</span>
              </span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                <span>Table</span>
              </span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader />
          </div>
        ) : (
          <>
            {/* Calendar View */}
            {viewMode === 'calendar' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <AttendanceCalendar records={allRecords} />
                </div>
                <div>
                  <AttendanceDonut
                    present={stats?.present_days || 0}
                    late={stats?.late_days || 0}
                    absent={stats?.absent_days || 0}
                    leave={stats?.leave_days || 0}
                  />
                </div>
              </div>
            )}

            {/* Table View */}
            {viewMode === 'table' && (
              <>
                {/* Filters Card */}
                <Card className="mb-6">
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
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
                    <Button variant="outline" onClick={clearFilters}>
                      Clear
                    </Button>
                  </div>
                </Card>

                {/* Table */}
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Day</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Check In</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Check Out</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Hours</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center py-12 text-gray-500">
                              No attendance records found
                            </td>
                          </tr>
                        ) : (
                          attendance.map((record) => (
                            <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4 text-sm text-gray-900">
                                {new Date(record.attendance_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {new Date(record.attendance_date).toLocaleDateString('en-US', { weekday: 'short' })}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-900">{formatTime(record.check_in_time)}</td>
                              <td className="py-3 px-4 text-sm text-gray-900">{formatTime(record.check_out_time)}</td>
                              <td className="py-3 px-4 text-sm text-gray-900">{record.total_hours || '-'}</td>
                              <td className="py-3 px-4">
                                {record.status ? (
                                  <Badge variant={record.status}>{record.status}</Badge>
                                ) : (
                                  <span className="text-gray-400 text-sm">-</span>
                                )}
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
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1}>
                          Previous
                        </Button>
                        {[...Array(pagination.totalPages)].map((_, index) => {
                          const pageNum = index + 1;
                          if (pageNum === 1 || pageNum === pagination.totalPages || (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)) {
                            return (
                              <Button key={pageNum} variant={pagination.page === pageNum ? 'primary' : 'outline'} onClick={() => handlePageChange(pageNum)}>
                                {pageNum}
                              </Button>
                            );
                          } else if (pageNum === pagination.page - 2 || pageNum === pagination.page + 2) {
                            return <span key={pageNum} className="px-2">...</span>;
                          }
                          return null;
                        })}
                        <Button variant="outline" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}>
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
