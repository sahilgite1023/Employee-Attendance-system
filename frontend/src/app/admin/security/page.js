'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { adminAPI } from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Loader from '@/components/common/Loader';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Alert from '@/components/common/Alert';

export default function SecuritySettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
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
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      router.push(user ? '/dashboard' : '/login');
      return;
    }
    loadData();
  }, [user, router, authLoading]);

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
        {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}
        {errorMsg && <Alert type="danger" message={errorMsg} onClose={() => setErrorMsg('')} />}

        <div>
          <h2 className="text-xl font-bold text-slate-900">Security Settings</h2>
          <p className="page-subtitle mt-1">Manage office networks &amp; IP security for attendance.</p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
          <button
            onClick={() => setActiveTab('networks')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'networks'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Allowed Networks
          </button>
          <button
            onClick={() => { setActiveTab('logs'); loadLogs(1); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'logs'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            IP Access Logs
          </button>
        </div>

        {/* =================== NETWORKS TAB =================== */}
        {activeTab === 'networks' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-semibold text-slate-900">Allowed Office Networks</h3>
              <Button variant="primary" size="sm" onClick={() => { setFormData({ label: '', ip_or_cidr: '' }); setShowAddModal(true); }}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
              >
                Add Network
              </Button>
            </div>

            {networks.length === 0 ? (
              <Card className="text-center py-12">
                <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 text-slate-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">No Networks Configured</h4>
                <p className="text-slate-500 mb-4 max-w-sm mx-auto">
                  All check-in/check-out attempts will be <strong>blocked</strong> until you add at least one allowed network.
                </p>
                <Button variant="primary" onClick={() => { setFormData({ label: '', ip_or_cidr: '' }); setShowAddModal(true); }}>
                  Add Your First Network
                </Button>
              </Card>
            ) : (
              <div className="grid gap-3">
                {networks.map((network) => (
                  <Card key={network.id} className={`p-4 ${!network.active ? 'opacity-60' : ''}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${network.active ? 'bg-success-500' : 'bg-slate-300'}`} />
                        <div>
                          <div className="font-semibold text-slate-900">{network.label}</div>
                          <div className="text-sm text-slate-400 font-mono">{network.ip_or_cidr}</div>
                        </div>
                        <Badge variant={network.active ? 'success' : 'gray'}>
                          {network.active ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => handleToggle(network)}>
                          {network.active ? 'Disable' : 'Enable'}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => openEdit(network)}>Edit</Button>
                        <Button variant="danger" size="sm" onClick={() => openDelete(network)}>Delete</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <Card className="bg-primary-50 border-primary-100">
              <h4 className="font-semibold text-primary-900 mb-2">How IP Restriction Works</h4>
              <ul className="text-sm text-primary-800 space-y-1 list-disc list-inside">
                <li>Employees can only Check-In / Check-Out from IPs listed above.</li>
                <li>Supports single IPs (e.g. <code className="bg-primary-100 px-1 rounded">103.45.210.12</code>) and CIDR ranges (e.g. <code className="bg-primary-100 px-1 rounded">192.168.1.0/24</code>).</li>
                <li>If no networks are configured, ALL attendance is blocked (secure default).</li>
                <li>All attempts (allowed + blocked) are logged in the IP Access Logs tab.</li>
              </ul>
            </Card>
          </div>
        )}

        {/* =================== LOGS TAB =================== */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h3 className="text-base font-semibold text-slate-900">
                IP Access Logs
                <span className="text-sm font-normal text-slate-400 ml-2">({logsPagination.totalRecords} total)</span>
              </h3>
              <div className="flex gap-2 flex-wrap">
                <select
                  className="input text-sm py-1.5"
                  value={logFilter.allowed}
                  onChange={(e) => setLogFilter(f => ({ ...f, allowed: e.target.value }))}
                >
                  <option value="">All Status</option>
                  <option value="true">Allowed</option>
                  <option value="false">Blocked</option>
                </select>
                <select
                  className="input text-sm py-1.5"
                  value={logFilter.action}
                  onChange={(e) => setLogFilter(f => ({ ...f, action: e.target.value }))}
                >
                  <option value="">All Actions</option>
                  <option value="CHECK_IN">Check-In</option>
                  <option value="CHECK_OUT">Check-Out</option>
                </select>
                <Button variant="secondary" size="sm" onClick={() => loadLogs(1)}>Filter</Button>
              </div>
            </div>

            {ipLogs.length === 0 ? (
              <Card className="text-center py-12">
                <p className="text-slate-500">No access logs found.</p>
              </Card>
            ) : (
              <Card noPadding>
                <div className="table-container border-0">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Employee</th>
                        <th>Action</th>
                        <th>IP Address</th>
                        <th>Status</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ipLogs.map((log) => (
                        <tr key={log.id} className={!log.allowed ? 'bg-danger-50/50' : ''}>
                          <td className="whitespace-nowrap text-slate-600">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td>
                            {log.first_name ? `${log.first_name} ${log.last_name}` : <span className="text-slate-400">Unknown</span>}
                            {log.employee_code && <span className="text-xs text-slate-400 ml-1">({log.employee_code})</span>}
                          </td>
                          <td>
                            <Badge variant={log.action === 'CHECK_IN' ? 'primary' : 'warning'}>
                              {log.action}
                            </Badge>
                          </td>
                          <td className="font-mono text-slate-600">{log.ip_address}</td>
                          <td>
                            <Badge variant={log.allowed ? 'success' : 'danger'}>
                              {log.allowed ? 'Allowed' : 'Blocked'}
                            </Badge>
                          </td>
                          <td className="text-slate-400 max-w-xs truncate">{log.reason || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {logsPagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={logsPagination.currentPage <= 1}
                  onClick={() => loadLogs(logsPagination.currentPage - 1)}
                >
                  ← Prev
                </Button>
                <span className="text-sm text-slate-500">
                  Page {logsPagination.currentPage} of {logsPagination.totalPages}
                </span>
                <Button
                  variant="secondary"
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
      </div>

      {/* Modals */}
      {showAddModal && (
        <Modal isOpen={showAddModal} title="Add Allowed Network" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddNetwork} className="space-y-4">
            <Input label="Network Label" placeholder="e.g. Main Office Network" value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} required />
            <Input label="IP Address or CIDR" placeholder="e.g. 103.45.210.12 or 192.168.1.0/24" value={formData.ip_or_cidr} onChange={(e) => setFormData({ ...formData, ip_or_cidr: e.target.value })} required />
            <div className="bg-slate-50 ring-1 ring-inset ring-slate-100 p-3 rounded-xl text-xs text-slate-500">
              <strong>Examples:</strong> Single IP: <code>103.45.210.12</code> · Subnet: <code>192.168.1.0/24</code>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Adding...' : 'Add Network'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {showEditModal && (
        <Modal isOpen={showEditModal} title="Edit Network" onClose={() => { setShowEditModal(false); setSelectedNetwork(null); }}>
          <form onSubmit={handleEditNetwork} className="space-y-4">
            <Input label="Network Label" value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} required />
            <Input label="IP Address or CIDR" value={formData.ip_or_cidr} onChange={(e) => setFormData({ ...formData, ip_or_cidr: e.target.value })} required />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" type="button" onClick={() => { setShowEditModal(false); setSelectedNetwork(null); }}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {showDeleteModal && (
        <Modal isOpen={showDeleteModal} title="Delete Network" onClose={() => { setShowDeleteModal(false); setSelectedNetwork(null); }}>
          <div className="space-y-4">
            <p className="text-slate-700">
              Are you sure you want to delete <strong>{selectedNetwork?.label}</strong> ({selectedNetwork?.ip_or_cidr})?
            </p>
            <p className="text-sm text-danger-600">
              Employees using this network will no longer be able to check in/out from it.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => { setShowDeleteModal(false); setSelectedNetwork(null); }}>Cancel</Button>
              <Button variant="danger" onClick={handleDeleteNetwork} disabled={saving}>{saving ? 'Deleting...' : 'Delete Network'}</Button>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
