'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { adminAPI } from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Loader from '@/components/common/Loader';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    loadDashboard();
  }, [user, router, authLoading]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboard();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <p className="text-sm text-gray-600">Total Employees</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {stats?.totalEmployees || 0}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-gray-600">Present Today</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {stats?.presentToday || 0}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-gray-600">On Leave</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {stats?.onLeaveToday || 0}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-gray-600">Late Arrivals</p>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {stats?.lateToday || 0}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Link href="/admin/employees">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <h3 className="font-semibold text-gray-900">Manage Employees</h3>
            <p className="text-sm text-gray-600 mt-1">Add, edit, or view</p>
          </Card>
        </Link>

        <Link href="/admin/leaves">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <h3 className="font-semibold text-gray-900">Leave Approvals</h3>
            <p className="text-sm text-gray-600 mt-1">Review requests</p>
          </Card>
        </Link>

        <Link href="/admin/attendance">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <h3 className="font-semibold text-gray-900">Attendance</h3>
            <p className="text-sm text-gray-600 mt-1">View daily records</p>
          </Card>
        </Link>

        <Link href="/admin/reports">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <h3 className="font-semibold text-gray-900">Reports</h3>
            <p className="text-sm text-gray-600 mt-1">View analytics</p>
          </Card>
        </Link>
      </div>

      {stats?.pendingLeaveRequests && stats.pendingLeaveRequests.length > 0 && (
        <Card className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Pending Leave Approvals</h2>
            <Link href="/admin/leaves">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Employee</th>
                  <th className="text-left py-2 px-3">Start</th>
                  <th className="text-left py-2 px-3">End</th>
                  <th className="text-left py-2 px-3">Days</th>
                </tr>
              </thead>
              <tbody>
                {stats.pendingLeaveRequests.slice(0, 5).map((req) => (
                  <tr key={req.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">{req.employee_name}</td>
                    <td className="py-2 px-3">{new Date(req.start_date).toLocaleDateString()}</td>
                    <td className="py-2 px-3">{new Date(req.end_date).toLocaleDateString()}</td>
                    <td className="py-2 px-3">{req.total_days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </AdminLayout>
  );
}
