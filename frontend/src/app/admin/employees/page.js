'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { adminAPI } from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Input from '@/components/common/Input';
import PhoneInput from '@/components/common/PhoneInput';
import Loader from '@/components/common/Loader';

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
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', designation: '', department: '', roleId: '3' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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
      setShowModal(false);
      loadEmployees();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to create employee' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this employee permanently?')) return;
    try {
      await adminAPI.deactivateEmployee(id);
      setMessage({ type: 'success', text: 'Employee deleted' });
      loadEmployees();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete employee' });
    }
  };

  const filtered = employees.filter(e => 
    `${e.first_name} ${e.last_name} ${e.employee_id} ${e.email}`.toLowerCase().includes(search.toLowerCase())
  );

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

      <div className="flex justify-between items-center mb-6">
        <Input
          type="text"
          placeholder="Search employees..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Button onClick={() => setShowModal(true)}>Add Employee</Button>
      </div>

      {showModal && (
        <Card className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Add New Employee</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Full Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} error={errors.name} />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} error={errors.email} />
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
                <select value={form.designation} onChange={(e) => setForm({...form, designation: e.target.value})} className="w-full px-3 py-2 border rounded-lg" disabled={!form.department}>
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
            <div className="flex gap-4">
              <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create'}</Button>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

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
                <th className="text-left py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-8 text-gray-500">No employees found</td></tr>
              ) : (
                filtered.map(e => (
                  <tr key={e.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">{e.employee_id}</td>
                    <td className="py-2 px-3">{e.first_name} {e.last_name}</td>
                    <td className="py-2 px-3">{e.email}</td>
                    <td className="py-2 px-3">{e.designation}</td>
                    <td className="py-2 px-3">{e.department || '-'}</td>
                    <td className="py-2 px-3"><Badge variant="info">{e.role}</Badge></td>
                    <td className="py-2 px-3"><Badge variant={e.is_active ? 'success' : 'danger'}>{e.is_active ? 'Active' : 'Inactive'}</Badge></td>
                    <td className="py-2 px-3"><Button variant="danger" size="sm" onClick={() => handleDelete(e.id)}>Delete</Button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminLayout>
  );
}
