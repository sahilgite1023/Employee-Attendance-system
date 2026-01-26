'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { adminAPI } from '@/lib/api';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Input from '@/components/common/Input';
import PhoneInput from '@/components/common/PhoneInput';
import Loader from '@/components/common/Loader';

export default function AdminEmployeesPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
    roleId: '3', // Default to employee role
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Department to Designation mapping
  const departmentDesignations = {
    'Engineering': ['Software Engineer', 'Senior Software Engineer', 'Lead Developer', 'Engineering Manager', 'System Architect', 'Tech Lead'],
    'Development': ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Senior Developer', 'Development Lead'],
    'Quality Assurance': ['QA Engineer', 'Senior QA Engineer', 'QA Lead', 'Test Automation Engineer', 'QA Manager'],
    'DevOps': ['DevOps Engineer', 'Senior DevOps Engineer', 'DevOps Lead', 'Site Reliability Engineer', 'Cloud Engineer'],
    'Human Resources': ['HR Manager', 'HR Executive', 'HR Generalist', 'Talent Acquisition Specialist', 'HR Business Partner'],
    'Finance': ['Accountant', 'Senior Accountant', 'Finance Manager', 'Financial Analyst', 'Controller'],
    'Marketing': ['Marketing Manager', 'Marketing Executive', 'Digital Marketing Specialist', 'Content Strategist', 'SEO Specialist'],
    'Sales': ['Sales Manager', 'Sales Executive', 'Account Manager', 'Business Development Manager', 'Sales Representative'],
    'Operations': ['Operations Manager', 'Operations Executive', 'Operations Coordinator', 'Process Manager'],
    'Customer Support': ['Support Engineer', 'Senior Support Engineer', 'Support Manager', 'Customer Success Manager'],
    'Product Management': ['Product Manager', 'Senior Product Manager', 'Product Owner', 'Associate Product Manager'],
    'Design': ['UI/UX Designer', 'Senior Designer', 'Design Lead', 'Graphic Designer', 'Product Designer'],
    'Administration': ['Admin Manager', 'Administrative Assistant', 'Office Manager', 'Executive Assistant'],
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin' && user.role !== 'hr') {
      router.push('/dashboard');
      return;
    }

    loadEmployees();
  }, [user, router]);

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.designation.trim()) {
      newErrors.designation = 'Designation is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If department changes, reset designation
    if (name === 'department') {
      setFormData((prev) => ({
        ...prev,
        department: value,
        designation: '', // Reset designation when department changes
      }));
      // Clear designation error if it exists
      if (errors.designation) {
        setErrors((prev) => ({
          ...prev,
          designation: '',
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Split name into firstName and lastName
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || nameParts[0];

      const employeeData = {
        firstName,
        lastName,
        email: formData.email,
        phone: formData.phone,
        designation: formData.designation,
        department: formData.department,
        roleId: formData.roleId,
      };

      const response = await adminAPI.createEmployee(employeeData);
      const { employee, temporaryPassword } = response.data;
      
      setSuccessMessage(
        `Employee created successfully!\n\nEmployee ID: ${employee.employee_id}\nTemporary Password: ${temporaryPassword}\n\nPlease share these credentials with the employee.`
      );
      setFormData({
        name: '',
        email: '',
        phone: '',
        designation: '',
        department: '',
        roleId: '3',
      });
      setShowCreateModal(false);
      await loadEmployees();
    } catch (error) {
      setErrorMessage(
        error.message || 'Failed to create employee'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this employee? This action cannot be undone.')) {
      return;
    }

    try {
      await adminAPI.deactivateEmployee(id);
      setSuccessMessage('Employee deleted successfully!');
      await loadEmployees();
    } catch (error) {
      setErrorMessage(
        error.message || 'Failed to delete employee'
      );
    }
  };

  const filteredEmployees = employees.filter(
    (emp) => {
      const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
      return (
        fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employee_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  );

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
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Employee Management
            </h1>
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 whitespace-pre-line font-semibold">{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        {/* Search and Add Button */}
        <div className="flex justify-between items-center mb-6">
          <div className="w-64">
            <Input
              type="text"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            Add New Employee
          </Button>
        </div>

        {/* Create Employee Modal */}
        {showCreateModal && (
          <Card className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Add New Employee
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  disabled={submitting}
                />

                <Input
                  label="Email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  disabled={submitting}
                />

                <PhoneInput
                  label="Phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={submitting}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={submitting}
                  >
                    <option value="">Select Department</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Development">Development</option>
                    <option value="Quality Assurance">Quality Assurance</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="Operations">Operations</option>
                    <option value="Customer Support">Customer Support</option>
                    <option value="Product Management">Product Management</option>
                    <option value="Design">Design</option>
                    <option value="Administration">Administration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Designation
                  </label>
                  <select
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.designation ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={submitting || !formData.department}
                  >
                    <option value="">
                      {formData.department ? 'Select Designation' : 'Select Department First'}
                    </option>
                    {formData.department && departmentDesignations[formData.department]?.map((designation) => (
                      <option key={designation} value={designation}>
                        {designation}
                      </option>
                    ))}
                  </select>
                  {errors.designation && (
                    <p className="mt-1 text-sm text-red-500">{errors.designation}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    name="roleId"
                    value={formData.roleId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={submitting}
                  >
                    <option value="1">Admin</option>
                    <option value="2">HR</option>
                    <option value="3">Employee</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  disabled={submitting}
                >
                  Create Employee
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      designation: '',
                      department: '',
                      roleId: '3',
                    });
                    setErrors({});
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Employees Table */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            All Employees ({filteredEmployees.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Employee ID
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Designation
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Department
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Role
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-gray-500">
                      No employees found
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {employee.employee_id}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {employee.first_name} {employee.last_name}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {employee.email}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {employee.designation}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {employee.department || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="info">{employee.role}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={employee.is_active ? 'success' : 'danger'}
                        >
                          {employee.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(employee.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
