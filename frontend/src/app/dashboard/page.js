'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceAPI, leaveAPI, faceAPI } from '@/lib/api';
import { formatTime, getGreeting } from '@/lib/utils';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Loader from '@/components/common/Loader';
import EmptyState from '@/components/common/EmptyState';
import Alert from '@/components/common/Alert';
import Modal from '@/components/common/Modal';
import StatCard from '@/components/common/StatCard';
import LiveClock from '@/components/common/LiveClock';
import WorkingTimer from '@/components/common/WorkingTimer';
import EmployeeLayout from '@/components/common/EmployeeLayout';

// Lazy-load FaceCapture so face-api models are only fetched when needed
const FaceCapture = lazy(() => import('@/components/common/FaceCapture'));

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
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
  const [currentSession, setCurrentSession] = useState(null); // live session data for timer

  // Face verification state
  const [faceEnabled, setFaceEnabled] = useState(false);   // whether feature is on
  const [faceEnrolled, setFaceEnrolled] = useState(false); // whether this user has enrolled
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceModalKey, setFaceModalKey] = useState(0); // remount FaceCapture on retry

  useEffect(() => {
    if (authLoading) return; // Wait for auth check to complete
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role === 'admin') {
      router.push('/admin/dashboard');
      return;
    }

    loadDashboardData();
    loadFaceStatus();
  }, [user, router, authLoading]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [attendanceRes, balanceRes, historyRes, statsRes, sessionRes] = await Promise.allSettled([
        attendanceAPI.getTodayAttendance(),
        leaveAPI.getBalance(),
        attendanceAPI.getHistory({ limit: 5 }),
        attendanceAPI.getStats(),
        attendanceAPI.getCurrentSession(),
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
      if (sessionRes.status === 'fulfilled') {
        setCurrentSession(sessionRes.value?.data || null);
      } else {
        console.error('getCurrentSession failed:', sessionRes.reason);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      setErrorMessage('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load face verification status (is feature on? is user enrolled?)
  const loadFaceStatus = async () => {
    try {
      const res = await faceAPI.getStatus();
      if (res?.data) {
        setFaceEnabled(res.data.featureEnabled || false);
        setFaceEnrolled(res.data.enrolled || false);
      }
    } catch {
      // Non-critical — face status failure shouldn't break the dashboard
    }
  };

  // Called when Check In button is clicked
  const handleCheckInClick = () => {
    if (faceEnabled) {
      // Open face verification modal instead of simple confirm
      setFaceModalKey((k) => k + 1); // remount FaceCapture fresh
      setShowFaceModal(true);
    } else {
      setConfirmAction('checkin');
    }
  };

  // Called after face verification succeeds with the captured descriptor
  const handleFaceVerified = async (descriptor) => {
    setShowFaceModal(false);
    await handleCheckIn(descriptor);
  };

  const handleCheckIn = async (faceDescriptor) => {
    try {
      setCheckInLoading(true);
      setErrorMessage('');
      const payload = faceDescriptor ? { faceDescriptor } : {};
      const result = await attendanceAPI.checkIn(payload);
      if (result?.data) {
        setTodayAttendance(result.data);
      }
      await loadDashboardData();
      setSuccessMessage('✓ Checked in successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Check-in error:', error);
      const errorMsg = error?.message || 'Failed to check in. Please try again.';
      const errorCode = error?.code;
      if (errorCode === 'IP_RESTRICTED') {
        setErrorMessage('🔒 Attendance can only be marked from the office network. Connect to office Wi-Fi and try again.');
      } else if (errorCode === 'FACE_MISMATCH') {
        setErrorMessage('🔍 Face not recognized. Please ensure good lighting and face the camera directly, then try again.');
      } else if (errorCode === 'FACE_NOT_ENROLLED') {
        setErrorMessage('📷 Your face is not enrolled yet. Please go to your Profile page to set up face recognition.');
      } else if (errorCode === 'FACE_REQUIRED') {
        setErrorMessage('📷 Face verification is required. Please allow camera access and try again.');
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
      <EmployeeLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader text="Loading your dashboard..." />
        </div>
      </EmployeeLayout>
    );
  }

  const hasCheckedIn = todayAttendance && todayAttendance.check_in_time;
  const hasCheckedOut = todayAttendance && todayAttendance.check_out_time;

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Greeting hero */}
        <div className="card flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-primary-50 ring-1 ring-inset ring-primary-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-primary-600">
                {user?.first_name?.charAt(0)?.toUpperCase()}{user?.last_name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {getGreeting()}, {user?.first_name || user?.name}!
                </h1>
                <span className="badge badge-primary uppercase">
                  {user?.role_name || user?.role?.toUpperCase() || 'EMPLOYEE'}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                <span className="mx-1.5 text-slate-300">·</span>
                {user?.employee_id}
                {user?.designation && (
                  <><span className="mx-1.5 text-slate-300 hidden md:inline">·</span><span className="hidden md:inline">{user?.designation}</span></>
                )}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 bg-slate-50 ring-1 ring-inset ring-slate-200 rounded-2xl px-5 py-3">
            <LiveClock />
          </div>
        </div>

        {/* Alerts */}
        {successMessage && (
          <Alert type="success" message={successMessage} onClose={() => setSuccessMessage('')} />
        )}
        {errorMessage && (
          <Alert type="danger" message={errorMessage} onClose={() => setErrorMessage('')} />
        )}

        {/* Check-in/Check-out Section */}
        <Card>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Today&apos;s Attendance
                </h2>
                {hasCheckedIn ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-700">
                      <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Check-in:</span>
                      <span className="font-semibold text-primary-700 tabular-nums">{formatTime(todayAttendance.check_in_time)}</span>
                    </div>
                    {hasCheckedOut && (
                      <>
                        <div className="flex items-center gap-2 text-slate-700">
                          <svg className="w-5 h-5 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Check-out:</span>
                          <span className="font-semibold text-primary-700 tabular-nums">{formatTime(todayAttendance.check_out_time)}</span>
                        </div>
                        {todayAttendance.total_hours && (
                          <div className="flex items-center gap-2 text-slate-700">
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
                  <p className="text-slate-500">
                    You haven&apos;t checked in today. Click the button to mark your attendance.
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-3">
                {!hasCheckedIn && (
                  <Button
                    variant="success"
                    size="lg"
                    onClick={handleCheckInClick}
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
                  <div className="flex items-center gap-2 px-6 py-3 bg-success-50 border border-success-200 rounded-xl">
                    <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold text-success-700">Day Complete</span>
                  </div>
                )}
              </div>
            </div>

            {/* Live Working Timer */}
            {hasCheckedIn && !hasCheckedOut && currentSession?.sessionStatus === 'OPEN' && (
              <WorkingTimer
                checkInTime={currentSession.session?.check_in_time || todayAttendance.check_in_time}
                serverDurationSeconds={currentSession.liveDurationSeconds || 0}
                serverTime={currentSession.serverTime}
              />
            )}
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Paid Leaves"
            value={leaveBalance?.paidLeavesBalance || 0}
            subtitle="Available"
            color="info"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatCard
            title="Pending Leaves"
            value={leaveBalance?.pendingRequests || 0}
            subtitle="Requests"
            color="warning"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="This Month"
            value={stats?.present_days || 0}
            subtitle="Days Present"
            color="success"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Late Arrivals"
            value={stats?.late_days || 0}
            subtitle="Total"
            color="danger"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/attendance">
            <Card interactive className="h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-50 ring-1 ring-inset ring-primary-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Attendance History</h3>
                  <p className="text-sm text-slate-500">View your records</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/leave">
            <Card interactive className="h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-success-50 ring-1 ring-inset ring-success-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Leave Management</h3>
                  <p className="text-sm text-slate-500">Apply &amp; track leaves</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/profile">
            <Card interactive className="h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-info-50 ring-1 ring-inset ring-info-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">My Profile</h3>
                  <p className="text-sm text-slate-500">View &amp; update</p>
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
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Face Verification Modal (shown when face feature is enabled) */}
      <Modal
        isOpen={showFaceModal}
        onClose={() => { setShowFaceModal(false); setCheckInLoading(false); }}
        title="Face Verification"
        size="sm"
      >
        <div className="flex flex-col items-center gap-4 py-2">
          <p className="text-sm text-slate-500 text-center">
            {faceEnrolled
              ? 'Look at the camera to verify your identity and check in.'
              : 'Your face is not enrolled. Please go to your Profile page to set up face recognition first.'}
          </p>

          {faceEnrolled ? (
            <Suspense fallback={<div className="flex items-center justify-center h-40"><Loader text="Loading camera…" /></div>}>
              <FaceCapture
                key={faceModalKey}
                mode="verify"
                onCapture={handleFaceVerified}
                onError={(msg) => {
                  setShowFaceModal(false);
                  setErrorMessage(msg);
                }}
                onCancel={() => setShowFaceModal(false)}
              />
            </Suspense>
          ) : (
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowFaceModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => router.push('/profile')}>Go to Profile</Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Confirmation Modal for Check-In (when face is disabled) / Check-Out */}
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
          <div className={`mx-auto flex items-center justify-center w-14 h-14 rounded-full ${confirmAction === 'checkin' ? 'bg-success-50 ring-1 ring-inset ring-success-100' : 'bg-danger-50 ring-1 ring-inset ring-danger-100'} mb-4`}>
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
          <p className="text-slate-700 text-lg">
            Are you sure you want to <span className="font-semibold">{confirmAction === 'checkin' ? 'Check-In' : 'Check-Out'}</span>?
          </p>
          <p className="text-slate-500 text-sm mt-2">
            {confirmAction === 'checkin'
              ? 'This will record your attendance start time for today.'
              : 'This will record your attendance end time for today.'}
          </p>
        </div>
      </Modal>
    </EmployeeLayout>
  );
}
