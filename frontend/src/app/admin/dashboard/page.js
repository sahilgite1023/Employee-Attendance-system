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
import StatCard from '@/components/common/StatCard';
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
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Employees"
            value={stats?.totalEmployees || 0}
            color="primary"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-3-6.5" /></svg>}
          />
          <StatCard
            title="Present Today"
            value={stats?.presentToday || 0}
            color="success"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard
            title="On Leave"
            value={stats?.onLeaveToday || 0}
            color="warning"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          />
          <StatCard
            title="Late Arrivals"
            value={stats?.lateToday || 0}
            color="danger"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { href: '/admin/employees', title: 'Manage Employees', desc: 'Add, edit, or view', color: 'primary', d: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-3-6.5' },
            { href: '/admin/leaves', title: 'Leave Approvals', desc: 'Review requests', color: 'success', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
            { href: '/admin/attendance', title: 'Attendance', desc: 'View daily records', color: 'info', d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { href: '/admin/reports', title: 'Reports', desc: 'View analytics', color: 'accent', d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <Card interactive className="h-full">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    item.color === 'primary' ? 'bg-primary-50 text-primary-600 ring-1 ring-inset ring-primary-100' :
                    item.color === 'success' ? 'bg-success-50 text-success-600 ring-1 ring-inset ring-success-100' :
                    item.color === 'info' ? 'bg-info-50 text-info-600 ring-1 ring-inset ring-info-100' :
                    'bg-accent-50 text-accent-600 ring-1 ring-inset ring-accent-100'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.d} /></svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {stats?.pendingLeaveRequests && stats.pendingLeaveRequests.length > 0 && (
          <Card title="Pending Leave Approvals" noPadding headerAction={
            <Link href="/admin/leaves">
              <Button variant="secondary" size="sm">View All</Button>
            </Link>
          }>
            <div className="table-container border-0">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Days</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.pendingLeaveRequests.slice(0, 5).map((req) => (
                    <tr key={req.id}>
                      <td className="font-medium text-slate-900">{req.employee_name}</td>
                      <td>{new Date(req.start_date).toLocaleDateString()}</td>
                      <td>{new Date(req.end_date).toLocaleDateString()}</td>
                      <td className="tabular-nums">{req.total_days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
