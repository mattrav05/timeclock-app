'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Employee {
  id: string;
  name: string;
  isActive: boolean;
  currentStatus: string;
  lastClockIn?: string;
  lastClockOut?: string;
  password?: string;
}

export default function EmployeeManagementPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', password: '' });
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', password: '', isActive: true });
  const [viewPasswords, setViewPasswords] = useState<{ [key: string]: boolean }>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/admin/employees');
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }
        throw new Error('Failed to fetch employees');
      }
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmployee),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add employee');
      }

      setMessage(`✅ Employee ${data.name} added successfully! Login ID: ${data.employeeId}`);
      setNewEmployee({ name: '', password: '' });
      setShowAddForm(false);
      await fetchEmployees();
      
      setTimeout(() => setMessage(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to add employee');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleUpdateEmployee = async (employeeId: string) => {
    setError('');
    setMessage('');

    const updateData: any = { employeeId };
    
    // Only include fields that were changed
    if (editForm.name) updateData.name = editForm.name;
    if (editForm.password) updateData.password = editForm.password;
    updateData.isActive = editForm.isActive; // Always include status since it's always defined

    try {
      const res = await fetch('/api/admin/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update employee');
      }

      setMessage('✅ Employee updated successfully!');
      setEditingEmployee(null);
      setEditForm({ name: '', password: '', isActive: true });
      await fetchEmployees();
      
      setTimeout(() => setMessage(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to update employee');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleDeleteEmployee = async (employeeId: string, employeeName: string) => {
    if (!confirm(`Are you sure you want to delete ${employeeName}? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/employees/${employeeId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete employee');
      }

      setMessage(`✅ Employee ${employeeName} deleted successfully!`);
      await fetchEmployees();
      
      setTimeout(() => setMessage(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete employee');
      setTimeout(() => setError(''), 5000);
    }
  };

  const togglePasswordView = (employeeId: string) => {
    setViewPasswords(prev => ({
      ...prev,
      [employeeId]: !prev[employeeId]
    }));
  };

  const startEdit = (employee: Employee) => {
    setEditingEmployee(employee.id);
    setEditForm({
      name: employee.name,
      password: '',
      isActive: employee.isActive
    });
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4" style={{ color: '#000000' }}>Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#000000' }}>Employee Management</h1>
              <p style={{ color: '#666666' }}>Manage all employee accounts, passwords, and access</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                {showAddForm ? '✕ Cancel' : '+ Add New Employee'}
              </button>
              <a
                href="/admin"
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
              >
                ← Back to Dashboard
              </a>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 rounded-lg">
            <p style={{ color: '#000000' }} className="font-medium">{message}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 rounded-lg">
            <p style={{ color: '#000000' }} className="font-medium">{error}</p>
          </div>
        )}

        {/* Add Employee Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#000000' }}>Add New Employee</h2>
            <form onSubmit={handleAddEmployee}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                    placeholder="e.g., John Smith"
                    required
                  />
                  <p className="text-xs mt-1" style={{ color: '#666666' }}>
                    ID will be auto-generated (e.g., john-smith)
                  </p>
                </div>
                
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Password *
                  </label>
                  <input
                    type="text"
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                    placeholder="Enter secure password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setNewEmployee({ ...newEmployee, password: generateRandomPassword() })}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                  >
                    Generate Random Password
                  </button>
                </div>
                
                <div className="lg:col-span-2 flex items-end gap-2">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    Add Employee
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewEmployee({ name: '', password: '' });
                    }}
                    className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Employees Table */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#000000' }}>
            Current Employees ({employees.length})
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-3 font-medium" style={{ color: '#000000' }}>Employee ID</th>
                  <th className="text-left py-3 px-3 font-medium" style={{ color: '#000000' }}>Name</th>
                  <th className="text-left py-3 px-3 font-medium" style={{ color: '#000000' }}>Password</th>
                  <th className="text-center py-3 px-3 font-medium" style={{ color: '#000000' }}>Status</th>
                  <th className="text-center py-3 px-3 font-medium" style={{ color: '#000000' }}>Currently</th>
                  <th className="text-center py-3 px-3 font-medium" style={{ color: '#000000' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-3">
                      <span className="font-mono text-sm" style={{ color: '#000000', fontWeight: 600 }}>
                        {employee.id}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {editingEmployee === employee.id ? (
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          style={{ color: '#000000' }}
                          placeholder="Enter new name"
                        />
                      ) : (
                        <span style={{ color: '#000000', fontWeight: 600 }}>{employee.name}</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {editingEmployee === employee.id ? (
                        <input
                          type="text"
                          value={editForm.password}
                          onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                          className="w-32 px-2 py-1 border border-gray-300 rounded"
                          style={{ color: '#000000' }}
                          placeholder="New password"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm" style={{ color: '#000000' }}>
                            {viewPasswords[employee.id] ? (employee.password || 'password123') : '••••••••'}
                          </span>
                          <button
                            onClick={() => togglePasswordView(employee.id)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            {viewPasswords[employee.id] ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {editingEmployee === employee.id ? (
                        <select
                          value={editForm.isActive ? 'active' : 'inactive'}
                          onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'active' })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                          style={{ color: '#000000' }}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          employee.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {employee.isActive ? '✓ Active' : '✕ Inactive'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        employee.currentStatus === 'clocked_in' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100'
                      }`} style={{ color: employee.currentStatus === 'clocked_in' ? undefined : '#000000' }}>
                        {employee.currentStatus === 'clocked_in' ? '🟢 In' : '⚪ Out'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex justify-center gap-2">
                        {editingEmployee === employee.id ? (
                          <>
                            <button
                              onClick={() => handleUpdateEmployee(employee.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 font-medium"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingEmployee(null);
                                setEditForm({ name: '', password: '', isActive: true });
                              }}
                              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 font-medium"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(employee)}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(employee.id, employee.name)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 font-medium"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {employees.length === 0 && (
            <div className="text-center py-12">
              <p style={{ color: '#666666' }} className="text-lg">No employees found</p>
              <p style={{ color: '#666666' }} className="text-sm mt-2">Add your first employee using the button above</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <h3 className="font-bold mb-2" style={{ color: '#000000' }}>📝 Quick Guide:</h3>
          <ul className="space-y-1 text-sm" style={{ color: '#000000' }}>
            <li>• <strong>Employee ID</strong> is auto-generated from name (e.g., John Smith → john-smith)</li>
            <li>• <strong>Password</strong> can be viewed by clicking "Show" - share with employee securely</li>
            <li>• <strong>Edit</strong> to change name, password, or active status</li>
            <li>• <strong>Delete</strong> permanently removes employee (cannot be undone)</li>
            <li>• Employees use their ID + password to login at the main page</li>
          </ul>
        </div>
      </div>
    </div>
  );
}