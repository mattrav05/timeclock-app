'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDateTime, formatHoursForDisplay } from '@/lib/utils';
import { format } from 'date-fns';

interface DashboardData {
  stats: {
    totalEmployees: number;
    activeEmployees: number;
    currentlyClockedIn: number;
    todayTotalHours: number;
    weekTotalHours: number;
  };
  clockedInEmployees: Array<{
    id: string;
    name: string;
    clockInTime: string;
  }>;
  employeeSummaries: Array<{
    id: string;
    name: string;
    status: string;
    todayHours: number;
    weekHours: number;
  }>;
  recentEntries: Array<{
    employeeId: string;
    employeeName: string;
    clockInTime: string;
    clockOutTime: string;
    date: string;
    hoursWorked: number;
  }>;
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await res.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const weekAgo = format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      
      const res = await fetch(`/api/admin/export-csv?startDate=${weekAgo}&endDate=${today}`);
      if (!res.ok) throw new Error('Export failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timesheet_${today}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export CSV');
    } finally {
      setExportLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
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

      setMessage(`Employee ${data.name} added successfully! ID: ${data.employeeId}`);
      setNewEmployee({ name: '', password: '' });
      setShowEmployeeForm(false);
      setTimeout(() => setMessage(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to add employee');
      setTimeout(() => setError(''), 5000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load dashboard data</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-500">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
            </div>
            <div className="flex gap-4">
              <a
                href="/admin/employees"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Manage Employees
              </a>
              <a
                href="/admin/networks"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Networks
              </a>
              <button
                onClick={() => setShowEmployeeForm(!showEmployeeForm)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {showEmployeeForm ? 'Cancel' : 'Quick Add'}
              </button>
              <button
                onClick={handleExportCSV}
                disabled={exportLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {exportLoading ? 'Exporting...' : 'Export CSV'}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Add Employee Form */}
        {showEmployeeForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Employee</h2>
            <form onSubmit={handleAddEmployee} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
                  placeholder="e.g., John Smith"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={newEmployee.password}
                  onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
                  placeholder="Create a secure password"
                  required
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold" style={{ color: '#000000' }}>👥 Employee Management</h3>
              <p className="text-sm" style={{ color: '#000000' }}>Add new employees, edit passwords, manage access</p>
            </div>
            <a
              href="/admin/employees"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-lg"
            >
              Open Employee Manager →
            </a>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-sm text-gray-500">Total Employees</p>
            <p className="text-3xl font-bold text-gray-900">{dashboardData.stats.totalEmployees}</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-sm text-gray-500">Active Employees</p>
            <p className="text-3xl font-bold text-gray-900">{dashboardData.stats.activeEmployees}</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-sm text-gray-500">Currently Clocked In</p>
            <p className="text-3xl font-bold text-green-600">{dashboardData.stats.currentlyClockedIn}</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-sm text-gray-500">Today's Hours</p>
            <p className="text-3xl font-bold text-gray-900">
              {dashboardData.stats.todayTotalHours.toFixed(1)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-sm text-gray-500">Week's Hours</p>
            <p className="text-3xl font-bold text-gray-900">
              {dashboardData.stats.weekTotalHours.toFixed(1)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Currently Clocked In */}
          {dashboardData.clockedInEmployees.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Currently Clocked In</h2>
              <div className="space-y-3">
                {dashboardData.clockedInEmployees.map(emp => (
                  <div key={emp.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-gray-900">{emp.name}</span>
                    <span className="text-sm text-gray-600">
                      Since {formatDateTime(emp.clockInTime)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Employee Summary */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Employee Summary</h2>
              <a
                href="/admin/employees"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                ✏️ Edit Employees
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Name</th>
                    <th className="text-center py-2 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-600">Today</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-600">Week</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.employeeSummaries.map(emp => (
                    <tr key={emp.id} className="border-b">
                      <td className="py-2 text-sm font-semibold" style={{ color: '#000000' }}>
                        <a
                          href={`/admin/employees/${emp.id}/timecard`}
                          className="hover:text-blue-600 hover:underline cursor-pointer"
                        >
                          {emp.name}
                        </a>
                      </td>
                      <td className="py-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          emp.status === 'clocked_in' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {emp.status === 'clocked_in' ? 'In' : 'Out'}
                        </span>
                      </td>
                      <td className="py-2 text-right text-sm font-semibold" style={{ color: '#000000' }}>{emp.todayHours.toFixed(1)}h</td>
                      <td className="py-2 text-right text-sm font-semibold" style={{ color: '#000000' }}>{emp.weekHours.toFixed(1)}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Time Entries */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Time Entries</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Employee</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Clock In</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Clock Out</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Hours</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recentEntries.map((entry, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 text-sm text-black font-medium">{entry.employeeName}</td>
                    <td className="py-2 text-sm text-black">
                      {entry.date ? (() => {
                        try {
                          const date = new Date(entry.date);
                          return isNaN(date.getTime()) ? entry.date : format(date, 'MMM d');
                        } catch {
                          return entry.date;
                        }
                      })() : ''}
                    </td>
                    <td className="py-2 text-sm text-black">{formatDateTime(entry.clockInTime)}</td>
                    <td className="py-2 text-sm text-black">
                      {entry.clockOutTime ? formatDateTime(entry.clockOutTime) : 
                        <span className="text-green-600 font-medium">Active</span>}
                    </td>
                    <td className="py-2 text-right text-sm text-black font-medium">
                      {entry.hoursWorked > 0 ? `${entry.hoursWorked.toFixed(2)}h` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}