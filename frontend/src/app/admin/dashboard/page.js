'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { adminAPI } from '@/lib/api';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Loader from '@/components/common/Loader';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin' && user.role !== 'hr') {
      router.push('/dashboard');
      return;
    }

    loadDashboard();
  }, [user, router]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboard();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
            <div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
                <Badge variant="danger" className="uppercase text-xs font-bold">
                  {user?.role_name || 'ADMIN'}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Welcome back, {user?.name} - {user?.employee_id}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/profile" className="hidden sm:inline">
                <Button variant="outline" size="sm">Profile</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
          
          {/* Admin Navigation Bar */}
          <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-200 pt-4">
            <Link href="/admin/dashboard">
              <Button variant="primary" size="sm" className="text-xs sm:text-sm">📊 <span className="hidden sm:inline">Dashboard</span></Button>
            </Link>
            <Link href="/admin/employees">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">👥 <span className="hidden sm:inline">Employees</span></Button>
            </Link>
            <Link href="/admin/leaves">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">📝 <span className="hidden sm:inline">Leaves</span></Button>
            </Link>
            <Link href="/admin/reports">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">📊 <span className="hidden sm:inline">Reports</span></Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {stats?.totalEmployees || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Active Staff</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Present Today</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats?.presentToday || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.totalEmployees
                    ? Math.round(
                        (stats.presentToday / stats.totalEmployees) * 100
                      )
                    : 0}
                  % Attendance
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">On Leave</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {stats?.onLeaveToday || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Today</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Late Arrivals</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {stats?.lateToday || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Today</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/admin/employees">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Manage Employees
                  </h3>
                  <p className="text-sm text-gray-600">
                    Add, edit, or view employees
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/leaves">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Leave Approvals</h3>
                  <p className="text-sm text-gray-600">
                    Review pending leave requests
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/reports">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Reports & Analytics
                  </h3>
                  <p className="text-sm text-gray-600">
                    View attendance reports
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Pending Leave Requests */}
        {stats?.pendingLeaveRequests && stats.pendingLeaveRequests.length > 0 && (
          <Card className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Pending Leave Approvals
              </h2>
              <Link href="/admin/leaves">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Employee
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Start Date
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      End Date
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Days
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.pendingLeaveRequests.slice(0, 5).map((request) => (
                    <tr
                      key={request.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {request.employee_name}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {new Date(request.start_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {new Date(request.end_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {request.total_days}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                        {request.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Today's Attendance Summary */}
        {stats?.todayAttendance && stats.todayAttendance.length > 0 && (
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Today's Attendance
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Employee
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Check In
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Check Out
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.todayAttendance.slice(0, 10).map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {record.employee_name}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {record.check_in_time
                          ? new Date(
                              `2000-01-01T${record.check_in_time}`
                            ).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {record.check_out_time
                          ? new Date(
                              `2000-01-01T${record.check_out_time}`
                            ).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={record.status}>{record.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
