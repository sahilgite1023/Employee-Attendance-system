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
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Alert from '@/components/common/Alert';

export default function SecuritySettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [networks, setNetworks] = useState([]);
  const [ipLogs, setIpLogs] = useState([]);
  const [logsPagination, setLogsPagination] = useState({ page: 1, totalPages: 1, totalRecords: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [formData, setFormData] = useState({ label: '', ip_or_cidr: '' });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('networks'); // 'networks' | 'logs'
  const [logFilter, setLogFilter] = useState({ allowed: '', action: '' });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'admin') { router.push('/dashboard'); return; }
    loadData();
  }, [user, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [networksRes, logsRes] = await Promise.allSettled([
        adminAPI.getNetworks(),
        adminAPI.getIpLogs({ page: 1, limit: 30 }),
      ]);
      if (networksRes.status === 'fulfilled') setNetworks(networksRes.value.data || []);
      if (logsRes.status === 'fulfilled') {
        setIpLogs(logsRes.value.data?.logs || []);
        setLogsPagination(logsRes.value.data?.pagination || { page: 1, totalPages: 1, totalRecords: 0 });
      }
    } catch (err) {
      console.error('Failed to load security data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async (page = 1) => {
    try {
      const res = await adminAPI.getIpLogs({ page, limit: 30, ...logFilter });
      setIpLogs(res.data?.logs || []);
      setLogsPagination(res.data?.pagination || { page: 1, totalPages: 1, totalRecords: 0 });
    } catch (err) {
      console.error('Failed to load logs:', err);
    }
  };

  const handleAddNetwork = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg('');
      await adminAPI.addNetwork(formData);
      setSuccessMsg('Network added successfully!');
      setShowAddModal(false);
      setFormData({ label: '', ip_or_cidr: '' });
      await loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to add network');
    } finally {
      setSaving(false);
    }
  };

  const handleEditNetwork = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg('');
      await adminAPI.updateNetwork(selectedNetwork.id, formData);
      setSuccessMsg('Network updated successfully!');
      setShowEditModal(false);
      setSelectedNetwork(null);
      setFormData({ label: '', ip_or_cidr: '' });
      await loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to update network');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNetwork = async () => {
    try {
      setSaving(true);
      await adminAPI.deleteNetwork(selectedNetwork.id);
      setSuccessMsg('Network deleted successfully!');
      setShowDeleteModal(false);
      setSelectedNetwork(null);
      await loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to delete network');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (network) => {
    try {
      await adminAPI.toggleNetwork(network.id);
      setSuccessMsg(`Network ${network.active ? 'disabled' : 'enabled'} successfully!`);
      await loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to toggle network');
    }
  };

  const openEdit = (network) => {
    setSelectedNetwork(network);
    setFormData({ label: network.label, ip_or_cidr: network.ip_or_cidr });
    setShowEditModal(true);
  };

  const openDelete = (network) => {
    setSelectedNetwork(network);
    setShowDeleteModal(true);
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
                  🔒 Security Settings
                </h1>
                <Badge variant="danger" className="uppercase text-xs font-bold">ADMIN</Badge>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Manage office networks & IP security for attendance
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/profile" className="hidden sm:inline">
                <Button variant="outline" size="sm">Profile</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
            </div>
          </div>

          {/* Admin Navigation Bar */}
          <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-200 pt-4">
            <Link href="/admin/dashboard">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">📊 <span className="hidden sm:inline">Dashboard</span></Button>
            </Link>
            <Link href="/admin/employees">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">👥 <span className="hidden sm:inline">Employees</span></Button>
            </Link>
            <Link href="/admin/attendance">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">📋 <span className="hidden sm:inline">Attendance</span></Button>
            </Link>
            <Link href="/admin/leaves">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">🌴 <span className="hidden sm:inline">Leaves</span></Button>
            </Link>
            <Link href="/admin/reports">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">📊 <span className="hidden sm:inline">Reports</span></Button>
            </Link>
            <Link href="/admin/security">
              <Button variant="primary" size="sm" className="text-xs sm:text-sm">🔒 <span className="hidden sm:inline">Security</span></Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {successMsg && <Alert type="success" message={successMsg} className="mb-4" />}
        {errorMsg && <Alert type="error" message={errorMsg} className="mb-4" />}

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'networks' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('networks')}
          >
            🌐 Allowed Networks
          </Button>
          <Button
            variant={activeTab === 'logs' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => { setActiveTab('logs'); loadLogs(1); }}
          >
            📋 IP Access Logs
          </Button>
        </div>

        {/* =================== NETWORKS TAB =================== */}
        {activeTab === 'networks' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Allowed Office Networks</h2>
              <Button variant="primary" size="sm" onClick={() => { setFormData({ label: '', ip_or_cidr: '' }); setShowAddModal(true); }}>
                + Add Network
              </Button>
            </div>

            {networks.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="text-5xl mb-4">🔓</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Networks Configured</h3>
                <p className="text-gray-600 mb-4">
                  All check-in/check-out attempts will be <strong>blocked</strong> until you add at least one allowed network.
                </p>
                <Button variant="primary" onClick={() => { setFormData({ label: '', ip_or_cidr: '' }); setShowAddModal(true); }}>
                  + Add Your First Network
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4">
                {networks.map((network) => (
                  <Card key={network.id} className={`p-4 ${!network.active ? 'opacity-60' : ''}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${network.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <div>
                          <div className="font-semibold text-gray-900">{network.label}</div>
                          <div className="text-sm text-gray-500 font-mono">{network.ip_or_cidr}</div>
                        </div>
                        <Badge variant={network.active ? 'success' : 'warning'}>
                          {network.active ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleToggle(network)}>
                          {network.active ? '🔴 Disable' : '🟢 Enable'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEdit(network)}>
                          ✏️ Edit
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => openDelete(network)}>
                          🗑️ Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Info Box */}
            <Card className="mt-6 p-4 bg-blue-50 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">ℹ️ How IP Restriction Works</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Employees can only Check-In / Check-Out from IPs listed above.</li>
                <li>Supports single IPs (e.g. <code className="bg-blue-100 px-1 rounded">103.45.210.12</code>) and CIDR ranges (e.g. <code className="bg-blue-100 px-1 rounded">192.168.1.0/24</code>).</li>
                <li>If no networks are configured, ALL attendance is blocked (secure default).</li>
                <li>All attempts (allowed + blocked) are logged in the IP Access Logs tab.</li>
              </ul>
            </Card>
          </div>
        )}

        {/* =================== LOGS TAB =================== */}
        {activeTab === 'logs' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                IP Access Logs 
                <span className="text-sm font-normal text-gray-500 ml-2">({logsPagination.totalRecords} total)</span>
              </h2>
              <div className="flex gap-2">
                <select
                  className="text-sm border rounded px-2 py-1"
                  value={logFilter.allowed}
                  onChange={(e) => { setLogFilter(f => ({ ...f, allowed: e.target.value })); }}
                >
                  <option value="">All Status</option>
                  <option value="true">Allowed</option>
                  <option value="false">Blocked</option>
                </select>
                <select
                  className="text-sm border rounded px-2 py-1"
                  value={logFilter.action}
                  onChange={(e) => { setLogFilter(f => ({ ...f, action: e.target.value })); }}
                >
                  <option value="">All Actions</option>
                  <option value="CHECK_IN">Check-In</option>
                  <option value="CHECK_OUT">Check-Out</option>
                </select>
                <Button variant="outline" size="sm" onClick={() => loadLogs(1)}>
                  🔍 Filter
                </Button>
              </div>
            </div>

            {ipLogs.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-gray-600">No access logs found.</p>
              </Card>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {ipLogs.map((log) => (
                      <tr key={log.id} className={!log.allowed ? 'bg-red-50' : ''}>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {log.first_name ? `${log.first_name} ${log.last_name}` : <span className="text-gray-400">Unknown</span>}
                          {log.employee_code && <span className="text-xs text-gray-400 ml-1">({log.employee_code})</span>}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant={log.action === 'CHECK_IN' ? 'primary' : 'warning'}>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-700">{log.ip_address}</td>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant={log.allowed ? 'success' : 'danger'}>
                            {log.allowed ? '✅ Allowed' : '🚫 Blocked'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{log.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {logsPagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logsPagination.currentPage <= 1}
                  onClick={() => loadLogs(logsPagination.currentPage - 1)}
                >
                  ← Prev
                </Button>
                <span className="flex items-center text-sm text-gray-600">
                  Page {logsPagination.currentPage} of {logsPagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logsPagination.currentPage >= logsPagination.totalPages}
                  onClick={() => loadLogs(logsPagination.currentPage + 1)}
                >
                  Next →
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* =================== ADD MODAL =================== */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          title="Add Allowed Network"
          onClose={() => setShowAddModal(false)}
        >
          <form onSubmit={handleAddNetwork} className="space-y-4">
            <Input
              label="Network Label"
              placeholder="e.g. Main Office Network"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              required
            />
            <Input
              label="IP Address or CIDR"
              placeholder="e.g. 103.45.210.12 or 192.168.1.0/24"
              value={formData.ip_or_cidr}
              onChange={(e) => setFormData({ ...formData, ip_or_cidr: e.target.value })}
              required
            />
            <div className="bg-gray-50 p-3 rounded text-xs text-gray-600">
              <strong>Examples:</strong><br />
              • Single IP: <code>103.45.210.12</code><br />
              • Subnet: <code>192.168.1.0/24</code> (covers 192.168.1.0 – 192.168.1.255)<br />
              • Subnet: <code>10.0.0.0/8</code> (covers all 10.x.x.x)
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={saving}>
                {saving ? 'Adding...' : 'Add Network'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* =================== EDIT MODAL =================== */}
      {showEditModal && (
        <Modal
          isOpen={showEditModal}
          title="Edit Network"
          onClose={() => { setShowEditModal(false); setSelectedNetwork(null); }}
        >
          <form onSubmit={handleEditNetwork} className="space-y-4">
            <Input
              label="Network Label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              required
            />
            <Input
              label="IP Address or CIDR"
              value={formData.ip_or_cidr}
              onChange={(e) => setFormData({ ...formData, ip_or_cidr: e.target.value })}
              required
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" type="button" onClick={() => { setShowEditModal(false); setSelectedNetwork(null); }}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* =================== DELETE MODAL =================== */}
      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          title="Delete Network"
          onClose={() => { setShowDeleteModal(false); setSelectedNetwork(null); }}
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete <strong>{selectedNetwork?.label}</strong> ({selectedNetwork?.ip_or_cidr})?
            </p>
            <p className="text-sm text-red-600">
              ⚠️ Employees using this network will no longer be able to check in/out from it.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowDeleteModal(false); setSelectedNetwork(null); }}>Cancel</Button>
              <Button variant="danger" onClick={handleDeleteNetwork} disabled={saving}>
                {saving ? 'Deleting...' : 'Delete Network'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
