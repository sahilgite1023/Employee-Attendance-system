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
      {message.text && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <p className="text-sm whitespace-pre-line">{message.text}</p>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <Input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <Button onClick={() => setShowAddModal(true)} className="sm:flex-none">+ Add Employee</Button>
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Employee" size="lg" closeOnOverlay={true}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} error={errors.name} required />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} error={errors.email} required />
            <PhoneInput label="Phone" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <select value={form.department} onChange={(e) => setForm({...form, department: e.target.value, designation: ''})} className="w-full px-3 py-2 border rounded-lg">
                <option value="">Select Department</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Designation</label>
              <select value={form.designation} onChange={(e) => setForm({...form, designation: e.target.value})} className="w-full px-3 py-2 border rounded-lg" disabled={!form.department} required>
                <option value="">{form.department ? 'Select Designation' : 'Select Department First'}</option>
                {form.department && departmentDesignations[form.department]?.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select value={form.roleId} onChange={(e) => setForm({...form, roleId: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                <option value="1">Admin</option>
                <option value="3">Employee</option>
              </select>
            </div>
          </div>
          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
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
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-sm font-medium text-gray-900">
                {editingEmployee.first_name} {editingEmployee.last_name}
              </p>
              <p className="mt-1 text-xs text-gray-600">
                {editingEmployee.employee_id} • {editingEmployee.email}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            <Input label="First Name" value={editForm.first_name} onChange={(e) => setEditForm({...editForm, first_name: e.target.value})} error={errors.first_name} required />
            <Input label="Last Name" value={editForm.last_name} onChange={(e) => setEditForm({...editForm, last_name: e.target.value})} error={errors.last_name} required />
            <PhoneInput label="Phone" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} />
            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <select value={editForm.department} onChange={(e) => setEditForm({...editForm, department: e.target.value, designation: ''})} className="w-full px-3 py-2 border rounded-lg">
                <option value="">Select Department</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Designation</label>
              <select value={editForm.designation} onChange={(e) => setEditForm({...editForm, designation: e.target.value})} className="w-full px-3 py-2 border rounded-lg" disabled={!editForm.department} required>
                <option value="">{editForm.department ? 'Select Designation' : 'Select Department First'}</option>
                {editForm.department && departmentDesignations[editForm.department]?.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select value={editForm.role_id} onChange={(e) => setEditForm({...editForm, role_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
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
          <div className="pt-4 border-t">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Face Recognition</label>
                <p className="text-xs text-gray-500">Enroll or reset this employee&apos;s face for check-in verification</p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFaceTargetEmployee(editingEmployee);
                    setShowEditModal(false);
                    setFaceModalKey((k) => k + 1);
                    setShowFaceModal(true);
                  }}
                  disabled={faceLoading}
                >
                  📷 Enroll Face
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
          <div className="pt-4 border-t">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee Status</label>
                <p className="text-xs text-gray-500">Toggle to activate or deactivate this employee</p>
              </div>
              <button
                type="button"
                onClick={() => setEditForm({...editForm, is_active: !editForm.is_active})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  editForm.is_active ? 'bg-green-500' : 'bg-gray-300'
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
                {editForm.is_active ? '✓ Active' : '✗ Inactive'}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="danger" onClick={() => handleDeleteFromModal()} disabled={submitting} className="sm:flex-none">
              🗑️ Delete Permanently
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => { setShowEditModal(false); setEditingEmployee(null); }} className="sm:flex-none">Cancel</Button>
              <Button type="submit" disabled={submitting} className="sm:flex-none">{submitting ? 'Updating...' : 'Save Changes'}</Button>
            </div>
          </div>
        </form>
        )}
      </Modal>

      <Card>
        <h3 className="text-lg font-semibold mb-4">Employees ({filtered.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">ID</th>
                <th className="text-left py-2 px-3">Name</th>
                <th className="text-left py-2 px-3">Email</th>
                <th className="text-left py-2 px-3">Designation</th>
                <th className="text-left py-2 px-3">Department</th>
                <th className="text-left py-2 px-3">Role</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-left py-2 px-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-8 text-gray-500">No employees found</td></tr>
              ) : (
                filtered.map(e => (
                  <tr key={e.id} className={`border-b hover:bg-gray-50 ${!e.is_active ? 'opacity-60' : ''}`}>
                    <td className="py-2 px-3">{e.employee_id}</td>
                    <td className="py-2 px-3">{e.first_name} {e.last_name}</td>
                    <td className="py-2 px-3">{e.email}</td>
                    <td className="py-2 px-3">{e.designation}</td>
                    <td className="py-2 px-3">{e.department || '-'}</td>
                    <td className="py-2 px-3"><Badge variant="info">{e.role}</Badge></td>
                    <td className="py-2 px-3">
                      <Badge variant={e.is_active ? 'success' : 'danger'}>
                        {e.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-2 px-3">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(e)} disabled={loadingEmployeeId === e.id}>
                        ✏️ Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Admin Face Enrollment Modal */}
      <Modal
        isOpen={showFaceModal}
        onClose={() => { setShowFaceModal(false); setFaceTargetEmployee(null); }}
        title={`Enroll Face — ${faceTargetEmployee?.first_name || ''} ${faceTargetEmployee?.last_name || ''}`}
        size="sm"
      >
        <div className="flex flex-col items-center gap-4 py-2">
          <p className="text-sm text-gray-600 text-center">
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