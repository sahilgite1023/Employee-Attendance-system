'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceAPI } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Input from '@/components/common/Input';
import Loader from '@/components/common/Loader';
import StatCard from '@/components/common/StatCard';
import EmployeeLayout from '@/components/common/EmployeeLayout';
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
      <EmployeeLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader />
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="page-title">Attendance</h1>
            <p className="page-subtitle mt-1">Track your check-ins, hours and attendance status.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={exportToCSV} icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }>
            Export CSV
          </Button>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Present"
              value={stats.present_days || 0}
              color="success"
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
            />
            <StatCard
              title="Late"
              value={stats.late_days || 0}
              color="warning"
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <StatCard
              title="Absent"
              value={stats.absent_days || 0}
              color="danger"
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
            />
            <StatCard
              title="Avg Hours"
              value={stats.avg_hours || '0.0'}
              color="info"
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
          </div>
        )}

        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <div className="inline-flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span>Calendar</span>
              </span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2">
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
                        <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                        <select
                          name="status"
                          value={filters.status}
                          onChange={handleFilterChange}
                          className="input"
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
                    <Button variant="secondary" onClick={clearFilters}>
                      Clear
                    </Button>
                  </div>
                </Card>

                {/* Table */}
                <Card noPadding>
                  <div className="table-container border-0">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Day</th>
                          <th>Check In</th>
                          <th>Check Out</th>
                          <th>Hours</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center py-12 text-slate-500">
                              No attendance records found
                            </td>
                          </tr>
                        ) : (
                          attendance.map((record) => (
                            <tr key={record.id}>
                              <td className="font-medium text-slate-900">
                                {new Date(record.attendance_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="text-slate-500">
                                {new Date(record.attendance_date).toLocaleDateString('en-US', { weekday: 'short' })}
                              </td>
                              <td className="tabular-nums">{formatTime(record.check_in_time)}</td>
                              <td className="tabular-nums">{formatTime(record.check_out_time)}</td>
                              <td className="tabular-nums">{record.total_hours || '-'}</td>
                              <td>
                                {record.status ? (
                                  <Badge variant={record.status}>{record.status}</Badge>
                                ) : (
                                  <span className="text-slate-400 text-sm">-</span>
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
                    <div className="flex items-center justify-between p-4 border-t border-slate-200">
                      <div className="text-sm text-slate-500">
                        Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" size="sm" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1}>
                          Previous
                        </Button>
                        {[...Array(pagination.totalPages)].map((_, index) => {
                          const pageNum = index + 1;
                          if (pageNum === 1 || pageNum === pagination.totalPages || (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)) {
                            return (
                              <Button key={pageNum} size="sm" variant={pagination.page === pageNum ? 'primary' : 'secondary'} onClick={() => handlePageChange(pageNum)}>
                                {pageNum}
                              </Button>
                            );
                          } else if (pageNum === pagination.page - 2 || pageNum === pagination.page + 2) {
                            return <span key={pageNum} className="px-2 text-slate-400">...</span>;
                          }
                          return null;
                        })}
                        <Button variant="secondary" size="sm" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}>
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
      </div>
    </EmployeeLayout>
  );
}
