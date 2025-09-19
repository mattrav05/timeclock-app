'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { formatTime, formatHoursForDisplay } from '@/lib/utils';

interface TimeEntry {
  employeeId: string;
  employeeName: string;
  clockInTime: string;
  clockOutTime: string;
  date: string;
  hoursWorked: number;
  isEdited: boolean;
  editedBy?: string;
  notes?: string;
}

interface Employee {
  id: string;
  name: string;
  currentStatus: 'clocked_in' | 'clocked_out';
}

function WeeklyTimecardAdmin({
  entries,
  employeeName,
  onEditEntry,
  onDeleteEntry,
  onAddEntry
}: {
  entries: TimeEntry[],
  employeeName: string,
  onEditEntry: (entry: TimeEntry) => void,
  onDeleteEntry: (entry: TimeEntry) => void,
  onAddEntry: (date: Date) => void
}) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const today = new Date();
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday start

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    return {
      date: day,
      dayName: format(day, 'EEE'),
      dayNumber: format(day, 'd'),
      dayDate: format(day, 'MMM d'),
      isToday: isSameDay(day, today),
      entries: entries
        .filter(entry => {
          if (!entry.date) return false;
          try {
            const entryDate = new Date(entry.date + 'T00:00:00');
            return !isNaN(entryDate.getTime()) && isSameDay(entryDate, day);
          } catch (error) {
            console.warn('Invalid entry date:', entry.date);
            return false;
          }
        })
        .sort((a, b) => {
          const dateA = a.clockInTime ? new Date(a.clockInTime).getTime() : 0;
          const dateB = b.clockInTime ? new Date(b.clockInTime).getTime() : 0;
          return dateA - dateB;
        })
    };
  });

  const getTotalHours = (dayEntries: TimeEntry[]) => {
    return dayEntries.reduce((total, entry) => total + (entry.hoursWorked || 0), 0);
  };

  const getWeekTotal = () => {
    return weekDays.reduce((total, day) => total + getTotalHours(day.entries), 0);
  };

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
        <button
          onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
          className="p-2 rounded-lg bg-white border hover:bg-gray-50"
        >
          ← Previous Week
        </button>

        <div className="text-center">
          <h3 className="font-bold text-gray-900">
            {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </h3>
          <p className="text-sm text-gray-600">
            Week Total: <span className="font-semibold">{formatHoursForDisplay(getWeekTotal())}</span>
          </p>
        </div>

        <button
          onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
          className="p-2 rounded-lg bg-white border hover:bg-gray-50"
        >
          Next Week →
        </button>
      </div>

      {/* Timecard Grid */}
      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {weekDays.map((day, index) => (
            <div key={index} className="p-3 text-center border-r last:border-r-0">
              <div className="font-semibold text-gray-900">{day.dayName}</div>
              <div className={`text-lg font-bold ${day.isToday ? 'text-blue-600' : 'text-gray-600'}`}>
                {day.dayNumber}
              </div>
              <div className="text-xs text-gray-500">{day.dayDate}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 min-h-[400px]">
          {weekDays.map((day, index) => {
            const totalHours = getTotalHours(day.entries);

            return (
              <div
                key={index}
                className={`p-2 border-r last:border-r-0 ${day.isToday ? 'bg-blue-50' : ''}`}
              >
                {/* Add Entry Button */}
                <button
                  onClick={() => onAddEntry(day.date)}
                  className="w-full mb-2 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                >
                  + Add Entry
                </button>

                {/* Daily Total */}
                {totalHours > 0 && (
                  <div className="bg-white rounded-lg p-2 border shadow-sm mb-2">
                    <div className="text-sm font-bold text-gray-900">
                      {formatHoursForDisplay(totalHours)}
                    </div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                )}

                {/* Time Entries */}
                <div className="space-y-1">
                  {day.entries.map((entry, entryIndex) => (
                    <div
                      key={entryIndex}
                      className="bg-white rounded p-2 text-xs border shadow-sm hover:shadow-md cursor-pointer group"
                      onClick={() => onEditEntry(entry)}
                    >
                      {entry.isEdited && (
                        <div className="bg-yellow-100 text-yellow-800 rounded px-1 py-0.5 text-xs mb-1">
                          Edited
                        </div>
                      )}

                      <div className="flex justify-between items-start mb-1">
                        <div className="font-semibold text-green-700">IN</div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteEntry(entry);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </div>
                      <div className="font-bold text-gray-900">
                        {formatTime(entry.clockInTime)}
                      </div>

                      {entry.clockOutTime && (
                        <>
                          <div className="font-semibold text-red-700 mt-1">OUT</div>
                          <div className="font-bold text-gray-900">
                            {formatTime(entry.clockOutTime)}
                          </div>

                          <div className="mt-1 bg-blue-100 text-blue-800 rounded px-1 py-0.5 font-semibold">
                            {formatHoursForDisplay(entry.hoursWorked)}
                          </div>
                        </>
                      )}

                      {entry.notes && (
                        <div className="mt-1 text-xs text-gray-600 italic">
                          {entry.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Edit Modal Component
function EditEntryModal({
  entry,
  onSave,
  onClose
}: {
  entry: TimeEntry | null,
  onSave: (entry: TimeEntry) => void,
  onClose: () => void
}) {
  const [formData, setFormData] = useState<TimeEntry | null>(null);

  useEffect(() => {
    if (entry) {
      setFormData({ ...entry });
    }
  }, [entry]);

  if (!entry || !formData) return null;

  const handleSave = () => {
    if (formData) {
      // Convert datetime-local format to ISO format
      const clockInISO = formData.clockInTime ? new Date(formData.clockInTime).toISOString() : '';
      const clockOutISO = formData.clockOutTime ? new Date(formData.clockOutTime).toISOString() : '';

      onSave({
        ...formData,
        clockInTime: clockInISO,
        clockOutTime: clockOutISO,
        originalClockInTime: entry.clockInTime // Keep original for API update
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Edit Time Entry</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Clock In Time</label>
            <input
              type="datetime-local"
              value={formData.clockInTime.slice(0, 16)}
              onChange={(e) => setFormData({ ...formData, clockInTime: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Clock Out Time</label>
            <input
              type="datetime-local"
              value={formData.clockOutTime?.slice(0, 16) || ''}
              onChange={(e) => setFormData({ ...formData, clockOutTime: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              placeholder="Add admin notes..."
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Entry Modal Component
function AddEntryModal({
  date,
  employeeName,
  employeeId,
  onSave,
  onClose
}: {
  date: Date | null,
  employeeName: string,
  employeeId: string,
  onSave: (entry: Partial<TimeEntry>) => void,
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    date: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    clockInTime: '',
    clockOutTime: '',
    notes: ''
  });

  if (!date) return null;

  const handleSave = () => {
    // Convert datetime-local format to ISO format
    const clockInISO = formData.clockInTime ? new Date(formData.clockInTime).toISOString() : '';
    const clockOutISO = formData.clockOutTime ? new Date(formData.clockOutTime).toISOString() : '';

    onSave({
      employeeId,
      employeeName,
      date: formData.date,
      clockInTime: clockInISO,
      clockOutTime: clockOutISO,
      notes: formData.notes,
      isEdited: true,
      editedBy: 'admin'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Add Time Entry</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Clock In Time</label>
            <input
              type="datetime-local"
              value={formData.clockInTime}
              onChange={(e) => setFormData({ ...formData, clockInTime: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Clock Out Time</label>
            <input
              type="datetime-local"
              value={formData.clockOutTime}
              onChange={(e) => setFormData({ ...formData, clockOutTime: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              placeholder="Add notes about this manual entry..."
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Add Entry
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeTimecardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [addingEntryDate, setAddingEntryDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);

      // Fetch employee details
      const empRes = await fetch(`/api/admin/employees/${id}`);
      if (!empRes.ok) throw new Error('Failed to fetch employee');
      const empData = await empRes.json();
      setEmployee(empData.employee);

      // Fetch timecard entries
      const entriesRes = await fetch(`/api/admin/employees/${id}/timecard`);
      if (!entriesRes.ok) throw new Error('Failed to fetch timecard');
      const entriesData = await entriesRes.json();
      setEntries(entriesData.entries);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry);
  };

  const handleSaveEdit = async (updatedEntry: TimeEntry) => {
    try {
      const res = await fetch(`/api/admin/employees/${id}/timecard`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit', entryData: updatedEntry })
      });

      if (!res.ok) throw new Error('Failed to update entry');

      await fetchEmployeeData();
      setEditingEntry(null);
    } catch (err) {
      alert('Failed to update entry');
    }
  };

  const handleDeleteEntry = async (entry: TimeEntry) => {
    if (!confirm('Are you sure you want to delete this time entry?')) return;

    try {
      const res = await fetch(`/api/admin/employees/${id}/timecard`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          entryData: { clockInTime: entry.clockInTime }
        })
      });

      if (!res.ok) throw new Error('Failed to delete entry');

      await fetchEmployeeData();
    } catch (err) {
      alert('Failed to delete entry');
    }
  };

  const handleAddEntry = async (entry: Partial<TimeEntry>) => {
    try {
      const res = await fetch(`/api/admin/employees/${id}/timecard`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', entryData: entry })
      });

      if (!res.ok) throw new Error('Failed to add entry');

      await fetchEmployeeData();
      setAddingEntryDate(null);
    } catch (err) {
      alert('Failed to add entry');
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Clock In', 'Clock Out', 'Hours Worked', 'Notes'];
    const rows = entries.map(e => [
      e.date,
      formatTime(e.clockInTime),
      e.clockOutTime ? formatTime(e.clockOutTime) : '',
      e.hoursWorked.toString(),
      e.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${employee?.name.replace(/\s+/g, '-')}-timecard-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!employee) return <div className="p-8">Employee not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <button
              onClick={() => router.back()}
              className="text-sm text-blue-600 hover:text-blue-800 mb-2"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{employee.name}</h1>
            <p className="text-sm text-gray-500">Employee ID: {employee.id}</p>
            <p className="text-sm">
              Status:
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                employee.currentStatus === 'clocked_in'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {employee.currentStatus === 'clocked_in' ? 'Clocked In' : 'Clocked Out'}
              </span>
            </p>
          </div>

          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Timecard */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Timecard</h2>
        <WeeklyTimecardAdmin
          entries={entries}
          employeeName={employee.name}
          onEditEntry={handleEditEntry}
          onDeleteEntry={handleDeleteEntry}
          onAddEntry={(date) => setAddingEntryDate(date)}
        />
      </div>

      {/* Edit Modal */}
      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          onSave={handleSaveEdit}
          onClose={() => setEditingEntry(null)}
        />
      )}

      {/* Add Modal */}
      {addingEntryDate && (
        <AddEntryModal
          date={addingEntryDate}
          employeeName={employee.name}
          employeeId={employee.id}
          onSave={handleAddEntry}
          onClose={() => setAddingEntryDate(null)}
        />
      )}
    </div>
  );
}