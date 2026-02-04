'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceAPI, leaveAPI } from '@/lib/api';
import { formatTime, getGreeting } from '@/lib/utils';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Loader from '@/components/common/Loader';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [stats, setStats] = useState(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkOutLoading, setCheckOutLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role === 'admin') {
      router.push('/admin/dashboard');
      return;
    }

    loadDashboardData();
  }, [user, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [attendanceRes, balanceRes, historyRes, statsRes] = await Promise.all([
        attendanceAPI.getTodayAttendance(),
        leaveAPI.getBalance(),
        attendanceAPI.getHistory({ limit: 5 }),
        attendanceAPI.getStats(),
      ]);

      setTodayAttendance(attendanceRes?.data?.attendance || null);
      setLeaveBalance(balanceRes?.data || null);
      setRecentAttendance(historyRes?.data?.records || []);
      setStats(statsRes?.data || null);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setCheckInLoading(true);
      await attendanceAPI.checkIn();
      await loadDashboardData();
      alert('✓ Checked in successfully!');
    } catch (error) {
      console.error('Check-in error:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to check in. Please check your connection and try again.';
      alert(errorMessage);
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setCheckOutLoading(true);
      await attendanceAPI.checkOut();
      await loadDashboardData();
      alert('✓ Checked out successfully!');
    } catch (error) {
      console.error('Check-out error:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to check out. Please check your connection and try again.';
      alert(errorMessage);
    } finally {
      setCheckOutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const hasCheckedIn = todayAttendance && todayAttendance.check_in_time;
  const hasCheckedOut = todayAttendance && todayAttendance.check_out_time;
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {getGreeting()}, {user?.first_name}!
                </h1>
                <Badge variant="success" className="uppercase text-xs font-bold px-2 sm:px-3 py-1">
                  {user?.role?.toUpperCase() || 'EMPLOYEE'}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                <span className="hidden sm:inline">{new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}</span>
                <span className="sm:hidden">{new Date().toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}</span> • {user?.employee_id}
                <span className="hidden md:inline"> • {user?.designation}</span>
              </p>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm text-gray-600">Time:</span>
                <span className="text-sm sm:text-lg font-semibold text-blue-600">
                  {currentTime}
                </span>
              </div>
              <Link href="/profile" className="hidden sm:inline">
                <Button variant="outline" size="sm">Profile</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
          
          {/* Employee Navigation Bar */}
          <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-200 pt-4">
            <Link href="/dashboard">
              <Button variant="primary" size="sm" className="text-xs sm:text-sm">🏠 <span className="hidden sm:inline">Dashboard</span></Button>
            </Link>
            <Link href="/attendance">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">📋 <span className="hidden sm:inline">Attendance</span></Button>
            </Link>
            <Link href="/leave">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">🌴 <span className="hidden sm:inline">Leave</span></Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">👤 <span className="hidden sm:inline">Profile</span></Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Check-in/Check-out Section */}
        <Card className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Today's Attendance
              </h2>
              {hasCheckedIn && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    Check-in: <span className="font-medium">{formatTime(todayAttendance.check_in_time)}</span>
                  </p>
                  {hasCheckedOut && (
                    <p className="text-sm text-gray-600">
                      Check-out: <span className="font-medium">{formatTime(todayAttendance.check_out_time)}</span>
                    </p>
                  )}
                  {todayAttendance.total_hours ? (
                    <p className="text-sm text-gray-600">
                      Total Hours: <span className="font-medium">{todayAttendance.total_hours}</span>
                    </p>
                  ) : null}
                </div>
              )}
              {!hasCheckedIn && (
                <p className="text-sm text-gray-500">
                  You haven't checked in today
                </p>
              )}
            </div>
            <div className="flex gap-2 sm:gap-4">
              {!hasCheckedIn && (
                <Button
                  variant="primary"
                  onClick={handleCheckIn}
                  loading={checkInLoading}
                  disabled={checkInLoading}
                  className="px-6 sm:px-8 w-full sm:w-auto"
                >
                  Check In
                </Button>
              )}
              {hasCheckedIn && !hasCheckedOut && (
                <Button
                  variant="danger"
                  onClick={handleCheckOut}
                  loading={checkOutLoading}
                  disabled={checkOutLoading}
                  className="px-6 sm:px-8 w-full sm:w-auto"
                >
                  Check Out
                </Button>
              )}
              {hasCheckedOut && (
                <Badge variant="success">Completed</Badge>
              )}
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid Leaves</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {leaveBalance?.paidLeavesBalance || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Available</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Leaves</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {leaveBalance?.pendingRequests || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Requests</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats?.present_days || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Days Present</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Late Arrivals</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {stats?.late_days || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/attendance">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Attendance History</h3>
                  <p className="text-sm text-gray-600">View your attendance records</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/leave">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Leave Management</h3>
                  <p className="text-sm text-gray-600">Apply for or view leaves</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/profile">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">My Profile</h3>
                  <p className="text-sm text-gray-600">View and update profile</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Recent Attendance */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Attendance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
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
                {recentAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">
                      No attendance records found
                    </td>
                  </tr>
                ) : (
                  recentAttendance.map((record) => (
                    <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {new Date(record.attendance_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
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
        </Card>
      </main>
    </div>
  );
}
