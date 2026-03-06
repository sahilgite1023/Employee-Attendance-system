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
import EmptyState from '@/components/common/EmptyState';
import Alert from '@/components/common/Alert';
import Modal from '@/components/common/Modal';
import LiveClock from '@/components/common/LiveClock';

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
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null); // 'checkin' | 'checkout' | null

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
      const [attendanceRes, balanceRes, historyRes, statsRes] = await Promise.allSettled([
        attendanceAPI.getTodayAttendance(),
        leaveAPI.getBalance(),
        attendanceAPI.getHistory({ limit: 5 }),
        attendanceAPI.getStats(),
      ]);

      if (attendanceRes.status === 'fulfilled') {
        setTodayAttendance(attendanceRes.value?.data?.attendance || null);
      } else {
        console.error('getTodayAttendance failed:', attendanceRes.reason);
      }
      if (balanceRes.status === 'fulfilled') {
        setLeaveBalance(balanceRes.value?.data || null);
      } else {
        console.error('getBalance failed:', balanceRes.reason);
      }
      if (historyRes.status === 'fulfilled') {
        setRecentAttendance(historyRes.value?.data?.records || []);
      } else {
        console.error('getHistory failed:', historyRes.reason);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value?.data || null);
      } else {
        console.error('getStats failed:', statsRes.reason);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      setErrorMessage('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setCheckInLoading(true);
      setErrorMessage('');
      const result = await attendanceAPI.checkIn();
      if (result?.data) {
        setTodayAttendance(result.data);
      }
      await loadDashboardData();
      setSuccessMessage('✓ Checked in successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Check-in error:', error);
      const errorMsg = error?.message || error?.response?.data?.message || 'Failed to check in. Please try again.';
      const errorCode = error?.code || error?.response?.data?.code;
      if (errorCode === 'IP_RESTRICTED') {
        setErrorMessage('🔒 Attendance can only be marked from the office network. Connect to office Wi-Fi and try again.');
      } else {
        setErrorMessage(errorMsg);
      }
      if (errorMsg?.toLowerCase().includes('already checked in')) {
        setTodayAttendance((prev) => prev || { check_in_time: new Date().toISOString(), status: 'present' });
      }
      await loadDashboardData();
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setCheckOutLoading(true);
      setErrorMessage('');
      const result = await attendanceAPI.checkOut();
      if (result?.data) {
        setTodayAttendance(result.data);
      }
      await loadDashboardData();
      setSuccessMessage('✓ Checked out successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Check-out error:', error);
      const errorMsg = error?.message || error?.response?.data?.message || 'Failed to check out. Please try again.';
      const errorCode = error?.code || error?.response?.data?.code;
      if (errorCode === 'IP_RESTRICTED') {
        setErrorMessage('🔒 Attendance can only be marked from the office network. Connect to office Wi-Fi and try again.');
      } else {
        setErrorMessage(errorMsg);
      }
      if (errorMsg?.toLowerCase().includes('already checked out')) {
        setTodayAttendance((prev) => prev ? { ...prev, check_out_time: new Date().toISOString() } : prev);
      }
      await loadDashboardData();
    } finally {
      setCheckOutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader text="Loading your dashboard..." />
      </div>
    );
  }

  const hasCheckedIn = todayAttendance && todayAttendance.check_in_time;
  const hasCheckedOut = todayAttendance && todayAttendance.check_out_time;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="page-header sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="page-title">
                  {getGreeting()}, {user?.first_name || user?.name}!
                </h1>
                <Badge variant="success" className="uppercase">
                  {user?.role_name || user?.role?.toUpperCase() || 'EMPLOYEE'}
                </Badge>
              </div>
              <p className="page-subtitle mt-1">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })} • {user?.employee_id}
                <span className="hidden md:inline"> • {user?.designation}</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <LiveClock />
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
              <Button variant="primary" size="sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Button>
            </Link>
            <Link href="/attendance">
              <Button variant="ghost" size="sm">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Alerts */}
        {successMessage && (
          <Alert type="success" message={successMessage} onClose={() => setSuccessMessage('')} />
        )}
        {errorMessage && (
          <Alert type="danger" message={errorMessage} onClose={() => setErrorMessage('')} />
        )}

        {/* Check-in/Check-out Section */}
        <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Today's Attendance
              </h2>
              {hasCheckedIn ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Check-in:</span>
                    <span className="font-semibold text-primary-700">{formatTime(todayAttendance.check_in_time)}</span>
                  </div>
                  {hasCheckedOut && (
                    <>
                      <div className="flex items-center gap-2 text-gray-700">
                        <svg className="w-5 h-5 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Check-out:</span>
                        <span className="font-semibold text-primary-700">{formatTime(todayAttendance.check_out_time)}</span>
                      </div>
                      {todayAttendance.total_hours && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <svg className="w-5 h-5 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Total Hours:</span>
                          <span className="font-semibold text-primary-700">{todayAttendance.total_hours}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">
                  You haven't checked in today. Click the button to mark your attendance.
                </p>
              )}
            </div>
            <div className="flex gap-3">
              {!hasCheckedIn && (
                <Button
                  variant="success"
                  size="lg"
                  onClick={() => setConfirmAction('checkin')}
                  loading={checkInLoading}
                  disabled={checkInLoading}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  }
                >
                  Check In
                </Button>
              )}
              {hasCheckedIn && !hasCheckedOut && (
                <Button
                  variant="danger"
                  size="lg"
                  onClick={() => setConfirmAction('checkout')}
                  loading={checkOutLoading}
                  disabled={checkOutLoading}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  }
                >
                  Check Out
                </Button>
              )}
              {hasCheckedOut && (
                <div className="flex items-center gap-2 px-6 py-3 bg-success-100 border border-success-200 rounded-lg">
                  <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold text-success-700">Completed</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-card-hover transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Paid Leaves</p>
                <p className="text-3xl font-bold text-info-600">
                  {leaveBalance?.paidLeavesBalance || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Available</p>
              </div>
              <div className="w-12 h-12 bg-info-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-card-hover transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pending Leaves</p>
                <p className="text-3xl font-bold text-warning-600">
                  {leaveBalance?.pendingRequests || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Requests</p>
              </div>
              <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-card-hover transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">This Month</p>
                <p className="text-3xl font-bold text-success-600">
                  {stats?.present_days || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Days Present</p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-card-hover transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Late Arrivals</p>
                <p className="text-3xl font-bold text-danger-600">
                  {stats?.late_days || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total</p>
              </div>
              <div className="w-12 h-12 bg-danger-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/attendance">
            <Card interactive className="h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Attendance History</h3>
                  <p className="text-sm text-gray-600">View your records</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/leave">
            <Card interactive className="h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Leave Management</h3>
                  <p className="text-sm text-gray-600">Apply & track leaves</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/profile">
            <Card interactive className="h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-info-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">My Profile</h3>
                  <p className="text-sm text-gray-600">View & update</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Recent Attendance */}
        <Card 
          title="Recent Attendance" 
          subtitle="Last 5 attendance records"
          noPadding
        >
          {recentAttendance.length === 0 ? (
            <EmptyState
              title="No attendance records"
              description="Your attendance history will appear here once you start checking in."
              icon={
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Total Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAttendance.map((record) => (
                    <tr key={record.id}>
                      <td className="font-medium">
                        {new Date(record.attendance_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td>{formatTime(record.check_in_time) || '-'}</td>
                      <td>{formatTime(record.check_out_time) || '-'}</td>
                      <td className="font-medium">{record.total_hours || '-'}</td>
                      <td>
                        {record.status ? (
                          <Badge status={record.status} />
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>

      {/* Confirmation Modal for Check-In / Check-Out */}
      <Modal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={confirmAction === 'checkin' ? 'Confirm Check-In' : 'Confirm Check-Out'}
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setConfirmAction(null)}
            >
              No, Cancel
            </Button>
            <Button
              variant={confirmAction === 'checkin' ? 'success' : 'danger'}
              loading={confirmAction === 'checkin' ? checkInLoading : checkOutLoading}
              disabled={checkInLoading || checkOutLoading}
              onClick={async () => {
                if (confirmAction === 'checkin') {
                  await handleCheckIn();
                } else {
                  await handleCheckOut();
                }
                setConfirmAction(null);
              }}
            >
              Yes, {confirmAction === 'checkin' ? 'Check In' : 'Check Out'}
            </Button>
          </>
        }
      >
        <div className="text-center py-4">
          <div className={`mx-auto flex items-center justify-center w-14 h-14 rounded-full ${confirmAction === 'checkin' ? 'bg-success-100' : 'bg-danger-100'} mb-4`}>
            {confirmAction === 'checkin' ? (
              <svg className="w-7 h-7 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            ) : (
              <svg className="w-7 h-7 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            )}
          </div>
          <p className="text-gray-700 text-lg">
            Are you sure you want to <span className="font-semibold">{confirmAction === 'checkin' ? 'Check-In' : 'Check-Out'}</span>?
          </p>
          <p className="text-gray-500 text-sm mt-2">
            {confirmAction === 'checkin'
              ? 'This will record your attendance start time for today.'
              : 'This will record your attendance end time for today.'}
          </p>
        </div>
      </Modal>
    </div>
  );
}
