'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI, faceAPI } from '@/lib/api';
import { getInitials } from '@/lib/utils';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Alert from '@/components/common/Alert';
import Badge from '@/components/common/Badge';
import EmployeeLayout from '@/components/common/EmployeeLayout';
import Loader from '@/components/common/Loader';
import Modal from '@/components/common/Modal';

const FaceCapture = lazy(() => import('@/components/common/FaceCapture'));

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Face enrollment state
  const [faceEnrolled, setFaceEnrolled] = useState(false);
  const [faceEnrolledAt, setFaceEnrolledAt] = useState(null);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceModalKey, setFaceModalKey] = useState(0);
  const [faceLoading, setFaceLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    loadFaceStatus();
  }, [user, router, authLoading]);

  const loadFaceStatus = async () => {
    try {
      const res = await faceAPI.getStatus();
      setFaceEnrolled(res?.data?.enrolled || false);
      setFaceEnrolledAt(res?.data?.enrolledAt || null);
    } catch {
      // Non-critical
    }
  };

  const handleFaceEnrolled = async (descriptor) => {
    setFaceLoading(true);
    try {
      await faceAPI.enroll(descriptor);
      setShowFaceModal(false);
      setFaceEnrolled(true);
      setFaceEnrolledAt(new Date().toISOString());
      setSuccessMessage('✓ Face enrolled successfully! You can now use face verification to check in.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setShowFaceModal(false);
      setErrorMessage(err?.message || 'Failed to save face enrollment. Please try again.');
    } finally {
      setFaceLoading(false);
    }
  };

  const handleRemoveFace = async () => {
    if (!confirm('Remove your face enrollment? You will need to re-enroll to use face check-in.')) return;
    setFaceLoading(true);
    try {
      await faceAPI.remove();
      setFaceEnrolled(false);
      setFaceEnrolledAt(null);
      setSuccessMessage('Face enrollment removed.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err?.message || 'Failed to remove face enrollment.');
    } finally {
      setFaceLoading(false);
    }
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
    setErrorMessage('');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!validatePasswordForm()) {
      return;
    }

    setLoading(true);

    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setSuccessMessage('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowChangePassword(false);
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Change password error:', error);
      setErrorMessage(
        error?.message || error?.response?.data?.message || 'Failed to change password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page header */}
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle mt-1">Manage your personal information and security.</p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <Alert type="success" message={successMessage} onClose={() => setSuccessMessage('')} />
        )}
        {errorMessage && (
          <Alert type="danger" message={errorMessage} onClose={() => setErrorMessage('')} />
        )}

        {/* Profile Information Card */}
        <Card>
          {/* Header row: avatar + name + designation */}
          <div className="flex items-center gap-4 pb-6 mb-6 border-b border-slate-100">
            <div className="flex-shrink-0">
              {user.profile_photo ? (
                <img
                  src={user.profile_photo}
                  alt={user.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-1 ring-slate-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-primary-50 ring-1 ring-inset ring-primary-100 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary-600">
                    {getInitials(user.first_name, user.last_name) || user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-900 truncate">
                {user.first_name} {user.last_name}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">{user.designation}</p>
              <div className="mt-2">
                <Badge variant={user.is_active ? 'success' : 'danger'}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Fields grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {[
              { label: 'Employee ID', value: user.employee_id },
              { label: 'Email', value: user.email },
              { label: 'Phone', value: user.phone || 'Not provided' },
              { label: 'Department', value: user.department || 'Not specified' },
              { label: 'Role', value: user.role, capitalize: true },
              { label: 'Reporting Manager', value: user.reporting_manager || 'Not assigned' },
              {
                label: 'Date of Joining',
                value: user.date_of_joining
                  ? new Date(user.date_of_joining).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'Not specified',
              },
            ].map((field) => (
              <div key={field.label} className="border-b border-slate-100 pb-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">{field.label}</label>
                <p className={`text-sm text-slate-900 mt-1.5 font-medium ${field.capitalize ? 'capitalize' : ''}`}>
                  {field.value}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Leave Balance Card */}
        <Card title="Leave Balance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-primary-50 ring-1 ring-inset ring-primary-100 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Paid Leaves</p>
                  <p className="text-3xl font-bold text-primary-600 mt-1 tabular-nums">
                    {user.paid_leaves_balance || 0}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Days Available</p>
                </div>
                <svg className="w-12 h-12 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div className="bg-warning-50 ring-1 ring-inset ring-warning-100 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Unpaid Leaves</p>
                  <p className="text-3xl font-bold text-warning-600 mt-1 tabular-nums">
                    {user.unpaid_leaves_taken || 0}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Days Taken</p>
                </div>
                <svg className="w-12 h-12 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </Card>

        {/* Face Recognition Card */}
        <Card>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Face Recognition</h2>
              <p className="text-sm text-slate-500 mt-1">
                Enroll your face to enable face verification during check-in.
              </p>
            </div>
            <Badge variant={faceEnrolled ? 'success' : 'gray'}>
              {faceEnrolled ? 'Enrolled' : 'Not enrolled'}
            </Badge>
          </div>

          {faceEnrolled && faceEnrolledAt && (
            <p className="text-xs text-slate-400 mb-4">
              Enrolled on {new Date(faceEnrolledAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}

          <div className="flex gap-3">
            <Button
              variant={faceEnrolled ? 'secondary' : 'primary'}
              onClick={() => { setFaceModalKey((k) => k + 1); setShowFaceModal(true); }}
              loading={faceLoading}
              disabled={faceLoading}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            >
              {faceEnrolled ? 'Re-enroll Face' : 'Enroll Face'}
            </Button>
            {faceEnrolled && (
              <Button
                variant="danger"
                onClick={handleRemoveFace}
                loading={faceLoading}
                disabled={faceLoading}
              >
                Remove
              </Button>
            )}
          </div>
        </Card>

        {/* Change Password Card */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-900">Security</h2>
            {!showChangePassword && (
              <Button
                variant="secondary"
                onClick={() => setShowChangePassword(true)}
              >
                Change Password
              </Button>
            )}
          </div>

          {showChangePassword && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                error={errors.currentPassword}
                disabled={loading}
              />

              <Input
                label="New Password"
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                error={errors.newPassword}
                disabled={loading}
              />

              <Input
                label="Confirm New Password"
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                error={errors.confirmPassword}
                disabled={loading}
              />

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  disabled={loading}
                >
                  Update Password
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                    setErrors({});
                    setErrorMessage('');
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>

      {/* Face Enrollment Modal */}
      <Modal
        isOpen={showFaceModal}
        onClose={() => setShowFaceModal(false)}
        title="Enroll Your Face"
        size="sm"
      >
        <div className="flex flex-col items-center gap-4 py-2">
          <p className="text-sm text-slate-500 text-center">
            Look directly at the camera and hold still. We&apos;ll capture several frames to build an accurate profile.
          </p>
          <Suspense fallback={<div className="flex items-center justify-center h-40"><Loader text="Loading camera…" /></div>}>
            <FaceCapture
              key={faceModalKey}
              mode="enroll"
              enrollSamples={5}
              onCapture={handleFaceEnrolled}
              onError={(msg) => {
                setShowFaceModal(false);
                setErrorMessage(msg);
              }}
              onCancel={() => setShowFaceModal(false)}
            />
          </Suspense>
        </div>
      </Modal>
    </EmployeeLayout>
  );
}
