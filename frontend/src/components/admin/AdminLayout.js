'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/employees', label: 'Employees', icon: '👥' },
    { href: '/admin/attendance', label: 'Attendance', icon: '📋' },
    { href: '/admin/leaves', label: 'Leaves', icon: '🌴' },
    { href: '/admin/reports', label: 'Reports', icon: '📊' },
    { href: '/admin/security', label: 'Security', icon: '🔒' },
    { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
                <Badge variant="danger" className="uppercase text-xs font-bold">
                  ADMIN
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                {user?.first_name} {user?.last_name} - {user?.employee_id}
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
          
          <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-200 pt-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? 'primary' : 'outline'}
                  size="sm"
                  className="text-xs sm:text-sm"
                >
                  {item.icon} <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {children}
      </main>
    </div>
  );
}
