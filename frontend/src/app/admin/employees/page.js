'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { adminAPI, faceAPI } from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Input from '@/components/common/Input';
import Alert from '@/components/common/Alert';
import PhoneInput from '@/components/common/PhoneInput';
import Modal from '@/components/common/Modal';
import Loader from '@/components/common/Loader';

const FaceCapture = lazy(() => import('@/components/common/FaceCapture'));

const departments = ['Engineering', 'Development', 'Quality Assurance', 'DevOps', 'Human Resources', 'Finance', 'Marketing', 'Sales', 'Operations', 'Customer Support', 'Product Management', 'Design', 'Administration'];

const departmentDesignations = {
  'Engineering': ['Software Engineer', 'Senior Software Engineer', 'Lead Developer', 'Engineering Manager'],
  'Development': ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Senior Developer'],
  'Quality Assurance': ['QA Engineer', 'Senior QA Engineer', 'QA Lead'],
  'DevOps': ['DevOps Engineer', 'Senior DevOps Engineer', 'DevOps Lead'],
  'Human Resources': ['HR Manager', 'HR Executive', 'HR Generalist'],
  'Finance': ['Accountant', 'Senior Accountant', 'Finance Manager'],
  'Marketing': ['Marketing Manager', 'Marketing Executive'],
  'Sales': ['Sales Manager', 'Sales Executive', 'Account Manager'],
  'Operations': ['Operations Manager', 'Operations Executive'],
  'Customer Support': ['Support Engineer', 'Support Manager'],
  'Product Management': ['Product Manager', 'Senior Product Manager'],
  'Design': ['UI/UX Designer', 'Senior Designer'],
  'Administration': ['Admin Manager', 'Administrative Assistant'],
};

export default function AdminEmployeesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingEmployeeId, setLoadingEmployeeId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalLoading, setEditModalLoading] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', designation: '', department: '', roleId: '3' });
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', phone: '', designation: '', department: '', role_id: '', password: '', is_active: true });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Face enrollment state (admin can enroll on behalf of employee)
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceModalKey, setFaceModalKey] = useState(0);
  const [faceLoading, setFaceLoading] = useState(false);
  const [faceTargetEmployee, setFaceTargetEmployee] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      router.push(user ? '/dashboard' : '/login');
      return;
    }
    loadEmployees();
  }, [user, router, authLoading]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getEmployees();
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.designation) {
      setErrors({ name: !form.name, email: !form.email, designation: !form.designation });
      return;
    }

    setSubmitting(true);
    try {
      const [firstName, ...lastNameParts] = form.name.trim().split(' ');
      const response = await adminAPI.createEmployee({
        firstName,
        lastName: lastNameParts.join(' ') || firstName,
        email: form.email,
        phone: form.phone,
        designation: form.designation,
        department: form.department,
        roleId: form.roleId,
      });
      setMessage({ type: 'success', text: `Employee created! ID: ${response.data.employee.employee_id}, Password: ${response.data.temporaryPassword}` });
      setForm({ name: '', email: '', phone: '', designation: '', department: '', roleId: '3' });
      setShowAddModal(false);
      loadEmployees();
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to create employee' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (employee) => {
    setLoadingEmployeeId(employee.id);
    setErrors({});
    setEditModalLoading(true);
    setShowEditModal(true);

    try {
      const response = await adminAPI.getEmployeeById(employee.id);
      const employeeDetails = response.data.employee;

      setEditingEmployee(employeeDetails);
      setEditForm({
        first_name: employeeDetails.first_name,
        last_name: employeeDetails.last_name,
        phone: employeeDetails.phone || '',
        designation: employeeDetails.designation,
        department: employeeDetails.department || '',
        role_id: employeeDetails.role === 'admin' ? '1' : '3',
        password: employeeDetails.temporary_password || '',
        is_active: employeeDetails.is_active,
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to load employee details' });
      setShowEditModal(false);
    } finally {
      setLoadingEmployeeId(null);
      setEditModalLoading(false);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.first_name || !editForm.last_name || !editForm.designation || (editForm.password && editForm.password.length < 6)) {
      setErrors({
        first_name: !editForm.first_name ? 'First name is required' : '',
        last_name: !editForm.last_name ? 'Last name is required' : '',
        designation: !editForm.designation ? 'Designation is required' : '',
        password: editForm.password && editForm.password.length < 6 ? 'Password must be at least 6 characters long' : '',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Update employee details
      await adminAPI.updateEmployee(editingEmployee.id, {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        phone: editForm.phone,
        designation: editForm.designation,
        department: editForm.department,
        role_id: editForm.role_id,
        ...(editForm.password ? { password: editForm.password } : {}),
        is_active: editForm.is_active,
      });

      setMessage({ type: 'success', text: 'Employee updated successfully!' });
      setShowEditModal(false);
      setEditingEmployee(null);
      loadEmployees();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update employee' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFromModal = async () => {
    if (!confirm(`Delete ${editingEmployee.first_name} ${editingEmployee.last_name} permanently?\n\nThis will remove all their data including attendance and leave records. This action cannot be undone.`)) return;
    
    setSubmitting(true);
    try {
      await adminAPI.deactivateEmployee(editingEmployee.id);
      setMessage({ type: 'success', text: 'Employee deleted permanently' });
      setShowEditModal(false);
      setEditingEmployee(null);
      loadEmployees();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete employee' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminFaceEnroll = async (descriptor) => {
    if (!faceTargetEmployee) return;
    setFaceLoading(true);
    try {
      await faceAPI.adminEnroll(faceTargetEmployee.id, descriptor);
      setShowFaceModal(false);
      setMessage({ type: 'success', text: `Face enrolled for ${faceTargetEmployee.first_name} ${faceTargetEmployee.last_name}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setShowFaceModal(false);
      setMessage({ type: 'error', text: err?.message || 'Failed to enroll face' });
    } finally {
      setFaceLoading(false);
    }
  };

  const handleAdminRemoveFace = async () => {
    if (!editingEmployee) return;
    if (!confirm(`Remove face enrollment for ${editingEmployee.first_name} ${editingEmployee.last_name}?`)) return;
    setFaceLoading(true);
    try {
      await faceAPI.adminRemove(editingEmployee.id);
      setMessage({ type: 'success', text: 'Face enrollment removed' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to remove face enrollment' });
    } finally {
      setFaceLoading(false);
    }
  };

  const filtered = employees    .filter((e) =>
      `${e.first_name} ${e.last_name} ${e.employee_id} ${e.email}`.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (a.is_active === b.is_active) return 0;
      return a.is_active ? -1 : 1;
    });

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
        {message.text && (
          <Alert
            type={message.type === 'success' ? 'success' : 'danger'}
            message={message.text}
            onClose={() => setMessage({ type: '', text: '' })}
          />
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Employees</h2>
            <p className="page-subtitle mt-1">Manage your team members and their access.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full sm:w-64">
              <Input
                type="text"
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>
            <Button onClick={() => setShowAddModal(true)} icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            }>Add Employee</Button>
          </div>
        </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Employee" size="lg" closeOnOverlay={true}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} error={errors.name} required />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} error={errors.email} required />
            <PhoneInput label="Phone" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
              <select value={form.department} onChange={(e) => setForm({...form, department: e.target.value, designation: ''})} className="input">
                <option value="">Select Department</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Designation</label>
              <select value={form.designation} onChange={(e) => setForm({...form, designation: e.target.value})} className="input" disabled={!form.department} required>
                <option value="">{form.department ? 'Select Designation' : 'Select Department First'}</option>
                {form.department && departmentDesignations[form.department]?.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
              <select value={form.roleId} onChange={(e) => setForm({...form, roleId: e.target.value})} className="input">
                <option value="1">Admin</option>
                <option value="3">Employee</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Employee'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditingEmployee(null); setEditModalLoading(false); }} title="Edit Employee Details" size="lg" closeOnOverlay={true}>
        {editModalLoading ? (
          <div className="flex min-h-[160px] items-center justify-center">
            <Loader />
          </div>
        ) : (
        <form onSubmit={handleUpdateSubmit} className="space-y-5">
          {editingEmployee && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">
                {editingEmployee.first_name} {editingEmployee.last_name}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {editingEmployee.employee_id} • {editingEmployee.email}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            <Input label="First Name" value={editForm.first_name} onChange={(e) => setEditForm({...editForm, first_name: e.target.value})} error={errors.first_name} required />
            <Input label="Last Name" value={editForm.last_name} onChange={(e) => setEditForm({...editForm, last_name: e.target.value})} error={errors.last_name} required />
            <PhoneInput label="Phone" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
              <select value={editForm.department} onChange={(e) => setEditForm({...editForm, department: e.target.value, designation: ''})} className="input">
                <option value="">Select Department</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Designation</label>
              <select value={editForm.designation} onChange={(e) => setEditForm({...editForm, designation: e.target.value})} className="input" disabled={!editForm.department} required>
                <option value="">{editForm.department ? 'Select Designation' : 'Select Department First'}</option>
                {editForm.department && departmentDesignations[editForm.department]?.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
              <select value={editForm.role_id} onChange={(e) => setEditForm({...editForm, role_id: e.target.value})} className="input">
                <option value="1">Admin</option>
                <option value="3">Employee</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <Input
                label="Current Password"
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                error={errors.password}
                helpText="Admins can view and update the employee's current password here."
              />
            </div>
          </div>

          {/* Face Recognition */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Face Recognition</label>
                <p className="text-xs text-slate-500">Enroll or reset this employee&apos;s face for check-in verification</p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setFaceTargetEmployee(editingEmployee);
                    setShowEditModal(false);
                    setFaceModalKey((k) => k + 1);
                    setShowFaceModal(true);
                  }}
                  disabled={faceLoading}
                >
                  Enroll Face
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAdminRemoveFace}
                  disabled={faceLoading}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>

          {/* Status Toggle */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee Status</label>
                <p className="text-xs text-slate-500">Toggle to activate or deactivate this employee</p>
              </div>
              <button
                type="button"
                onClick={() => setEditForm({...editForm, is_active: !editForm.is_active})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  editForm.is_active ? 'bg-success-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    editForm.is_active ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="mt-2">
              <Badge variant={editForm.is_active ? 'success' : 'danger'}>
                {editForm.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="danger" onClick={() => handleDeleteFromModal()} disabled={submitting} className="sm:flex-none">
              Delete Permanently
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="secondary" onClick={() => { setShowEditModal(false); setEditingEmployee(null); }} className="sm:flex-none">Cancel</Button>
              <Button type="submit" disabled={submitting} className="sm:flex-none">{submitting ? 'Updating...' : 'Save Changes'}</Button>
            </div>
          </div>
        </form>
        )}
      </Modal>

      <Card title={`Employees (${filtered.length})`} noPadding>
        <div className="table-container border-0">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-12 text-slate-500">No employees found</td></tr>
              ) : (
                filtered.map(e => (
                  <tr key={e.id} className={!e.is_active ? 'opacity-60' : ''}>
                    <td className="font-medium text-slate-900">{e.employee_id}</td>
                    <td>{e.first_name} {e.last_name}</td>
                    <td className="text-slate-500">{e.email}</td>
                    <td>{e.designation}</td>
                    <td>{e.department || '-'}</td>
                    <td><Badge variant="info">{e.role}</Badge></td>
                    <td>
                      <Badge variant={e.is_active ? 'success' : 'danger'}>
                        {e.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <Button variant="secondary" size="sm" onClick={() => handleEdit(e)} disabled={loadingEmployeeId === e.id}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      </div>

      {/* Admin Face Enrollment Modal */}
      <Modal
        isOpen={showFaceModal}
        onClose={() => { setShowFaceModal(false); setFaceTargetEmployee(null); }}
        title={`Enroll Face — ${faceTargetEmployee?.first_name || ''} ${faceTargetEmployee?.last_name || ''}`}
        size="sm"
      >
        <div className="flex flex-col items-center gap-4 py-2">
          <p className="text-sm text-slate-500 text-center">
            Have the employee look directly at the camera. Hold still while we capture their face.
          </p>
          <Suspense fallback={<div className="flex items-center justify-center h-40"><Loader text="Loading camera…" /></div>}>
            <FaceCapture
              key={faceModalKey}
              mode="enroll"
              enrollSamples={5}
              onCapture={handleAdminFaceEnroll}
              onError={(msg) => {
                setShowFaceModal(false);
                setMessage({ type: 'error', text: msg });
              }}
              onCancel={() => setShowFaceModal(false)}
            />
          </Suspense>
        </div>
      </Modal>
    </AdminLayout>
  );
}