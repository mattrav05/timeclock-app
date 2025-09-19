'use client';

import { useState, useEffect } from 'react';
import { formatTime, formatHoursForDisplay, getCurrentPosition } from '@/lib/utils';
import { format, startOfWeek, addDays, isSameDay, isSameWeek } from 'date-fns';

interface TimeEntry {
  clockInTime: string;
  clockOutTime: string;
  date: string;
  hoursWorked: number;
}

interface EmployeeData {
  entries: TimeEntry[];
  stats: {
    todayHours: number;
    weekHours: number;
  };
  currentStatus: {
    clockedIn: boolean;
    clockInTime?: string;
  };
}

function WeeklyTimecard({ entries }: { entries: TimeEntry[] }) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const today = new Date();
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday start
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    return {
      date: day,
      dayName: format(day, 'EEE'),
      dayNumber: format(day, 'd'),
      isToday: isSameDay(day, today),
      entries: entries
        .filter(entry => {
          const entryDate = new Date(entry.date + 'T00:00:00');
          return isSameDay(entryDate, day);
        })
        .sort((a, b) => new Date(a.clockInTime).getTime() - new Date(b.clockInTime).getTime())
    };
  });

  const getTotalHours = (dayEntries: TimeEntry[]) => {
    return dayEntries.reduce((total, entry) => total + (entry.hoursWorked || 0), 0);
  };

  const getWeekTotal = () => {
    return weekDays.reduce((total, day) => total + getTotalHours(day.entries), 0);
  };

  const goToPreviousWeek = () => {
    setCurrentWeek(addDays(currentWeek, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addDays(currentWeek, 7));
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  const isCurrentWeek = isSameWeek(currentWeek, today, { weekStartsOn: 1 });

  return (
    <div className="space-y-4">
      {/* Navigation Header */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 md:p-4">
        <button
          onClick={goToPreviousWeek}
          className="p-2 rounded-lg bg-white border hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="text-center flex-1">
          <h3 className="font-bold text-gray-900 text-sm md:text-base">
            {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </h3>
          <p className="text-xs md:text-sm text-gray-600">
            Week Total: <span className="font-semibold">{formatHoursForDisplay(getWeekTotal())}</span>
          </p>
        </div>

        <div className="flex space-x-2">
          {!isCurrentWeek && (
            <button
              onClick={goToCurrentWeek}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Today
            </button>
          )}
          <button
            onClick={goToNextWeek}
            className="p-2 rounded-lg bg-white border hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Timecard Grid */}
      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        {/* Header Row */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {weekDays.map((day, index) => (
            <div key={index} className="p-2 md:p-3 text-center border-r last:border-r-0">
              <div className="font-semibold text-gray-900 text-xs md:text-sm">{day.dayName}</div>
              <div className={`text-sm md:text-lg font-bold mt-1 ${
                day.isToday 
                  ? 'text-blue-600' 
                  : getTotalHours(day.entries) > 0 
                    ? 'text-green-600' 
                    : 'text-gray-400'
              }`}>
                {day.dayNumber}
              </div>
              <div className="text-xs text-gray-500 mt-1 hidden md:block">
                {format(day.date, 'MMM d')}
              </div>
            </div>
          ))}
        </div>

        {/* Content Row */}
        <div className="grid grid-cols-7 min-h-[200px] md:min-h-[280px]">
          {weekDays.map((day, index) => {
            const totalHours = getTotalHours(day.entries);
            const hasEntries = day.entries.length > 0;
            
            return (
              <div 
                key={index} 
                className={`p-1 md:p-2 border-r last:border-r-0 overflow-hidden ${
                  day.isToday ? 'bg-blue-50' : hasEntries ? 'bg-green-50' : ''
                }`}
              >
                {/* Daily Total */}
                <div className="text-center mb-2 md:mb-3">
                  {totalHours > 0 ? (
                    <div className="bg-white rounded-lg p-2 border shadow-sm mx-1">
                      <div className="text-xs md:text-sm font-bold text-gray-900 leading-tight">
                        {formatHoursForDisplay(totalHours)}
                      </div>
                      <div className="text-xs text-gray-500 hidden md:block mt-0.5">Total</div>
                    </div>
                  ) : (
                    <div className="text-gray-300 text-xs md:text-sm py-2">-</div>
                  )}
                </div>

                {/* Time Entries */}
                <div className="space-y-1 overflow-hidden">
                  {day.entries.slice(0, 4).map((entry, entryIndex) => (
                    <div key={entryIndex} className="bg-white rounded p-1.5 text-xs border shadow-sm">
                      {/* Clock In */}
                      <div className="flex items-center justify-center mb-1">
                        <div className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs font-medium">
                          IN
                        </div>
                      </div>
                      <div className="font-bold text-gray-900 text-center text-sm">
                        {formatTime(entry.clockInTime)}
                      </div>
                      
                      {/* Clock Out */}
                      <div className="flex items-center justify-center mt-2 mb-1">
                        {entry.clockOutTime ? (
                          <div className="bg-red-100 text-red-800 rounded-full px-2 py-0.5 text-xs font-medium">
                            OUT
                          </div>
                        ) : (
                          <div className="bg-green-500 text-white rounded-full px-2 py-0.5 text-xs font-bold animate-pulse">
                            ACTIVE
                          </div>
                        )}
                      </div>
                      <div className="font-bold text-gray-900 text-center text-sm">
                        {entry.clockOutTime ? formatTime(entry.clockOutTime) : (
                          <span className="text-green-600 font-bold">On Clock</span>
                        )}
                      </div>
                      
                      {/* Hours */}
                      {entry.hoursWorked > 0 && (
                        <div className="mt-2 text-center">
                          <div className="bg-blue-100 text-blue-800 rounded px-2 py-0.5 text-xs font-semibold">
                            {formatHoursForDisplay(entry.hoursWorked)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {day.entries.length > 4 && (
                    <div className="text-center text-xs text-gray-500 py-1">
                      +{day.entries.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Week Summary Footer */}
        <div className="bg-gray-50 border-t p-3 md:p-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-1 md:space-y-0">
            <div className="text-xs md:text-sm text-gray-600">
              Week of {format(weekStart, 'MMMM d, yyyy')}
            </div>
            <div className="font-bold text-base md:text-lg text-gray-900">
              Total: {formatHoursForDisplay(getWeekTotal())}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [locationPermission, setLocationPermission] = useState<'pending' | 'granted' | 'denied' | 'prompt'>('pending');
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  // Check location permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        setLocationPermission(result.state as 'granted' | 'denied' | 'prompt');
      });
    }
  }, []);

  // Check for existing session
  useEffect(() => {
    const checkSession = async () => {
      const savedId = document.cookie
        .split('; ')
        .find(row => row.startsWith('employee-id='))
        ?.split('=')[1];
        
      if (savedId) {
        try {
          const res = await fetch(`/api/timesheet/${savedId}`);
          if (res.ok) {
            const data = await res.json();
            setEmployeeId(savedId);
            setIsLoggedIn(true);
            setEmployeeData(data);
            // Get employee name from data
            if (data.entries.length > 0) {
              setEmployeeName(data.entries[0].employeeName);
            }
          }
        } catch (err) {
          console.error('Session check failed:', err);
        }
      }
    };
    
    checkSession();
  }, []);

  // Update elapsed time when clocked in
  useEffect(() => {
    if (employeeData?.currentStatus?.clockedIn && employeeData.currentStatus.clockInTime) {
      const updateElapsed = () => {
        const clockIn = new Date(employeeData.currentStatus.clockInTime!);
        const now = new Date();
        const diff = now.getTime() - clockIn.getTime();
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setElapsedTime(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      };

      updateElapsed();
      const interval = setInterval(updateElapsed, 1000);
      return () => clearInterval(interval);
    }
  }, [employeeData?.currentStatus]);

  const fetchEmployeeData = async (empId: string) => {
    try {
      const res = await fetch(`/api/timesheet/${empId}`);
      if (res.ok) {
        const data = await res.json();
        setEmployeeData(data);
      }
    } catch (err) {
      console.error('Failed to fetch employee data:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setEmployeeName(data.employee.name);
      setIsLoggedIn(true);
      await fetchEmployeeData(employeeId);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const position = await getCurrentPosition();
      
      const res = await fetch('/api/clockin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to clock in');
      }

      setSuccess('Clocked in successfully!');
      await fetchEmployeeData(employeeId);
    } catch (err: any) {
      setError(err.message || 'Failed to clock in');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const position = await getCurrentPosition();
      
      const res = await fetch('/api/clockout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to clock out');
      }

      setSuccess(`Clocked out successfully! Worked ${formatHoursForDisplay(data.hoursWorked)}`);
      await fetchEmployeeData(employeeId);
    } catch (err: any) {
      setError(err.message || 'Failed to clock out');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
      setIsLoggedIn(false);
      setEmployeeName('');
      setEmployeeId('');
      setPassword('');
      setEmployeeData(null);
    } catch (err) {
      console.error('Logout failed:', err);
      // Force logout anyway
      setIsLoggedIn(false);
      setEmployeeName('');
      setEmployeeId('');
      setPassword('');
      setEmployeeData(null);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">TimeTracker</h1>
            
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-2">
                  Employee ID
                </label>
                <input
                  type="text"
                  id="employeeId"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-white text-black placeholder-gray-400"
                  placeholder="e.g., john-smith"
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-white text-black"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const isClockedIn = employeeData?.currentStatus?.clockedIn;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{employeeName}</h1>
              <p className="text-sm text-gray-500">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Logout
            </button>
          </div>

          {/* Status */}
          <div className={`p-4 rounded-lg border-2 ${
            isClockedIn 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  {isClockedIn ? (
                    <div className="bg-green-500 text-white rounded-full px-3 py-1 text-sm font-bold animate-pulse">
                      🟢 CLOCKED IN
                    </div>
                  ) : (
                    <div className="bg-red-500 text-white rounded-full px-3 py-1 text-sm font-bold">
                      🔴 CLOCKED OUT
                    </div>
                  )}
                </div>
                {isClockedIn && employeeData?.currentStatus?.clockInTime && (
                  <p className="text-sm font-semibold text-gray-700">
                    Since {formatTime(employeeData.currentStatus.clockInTime)}
                  </p>
                )}
              </div>
              {isClockedIn && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-600">Time Elapsed</p>
                  <p className="text-2xl font-mono font-bold text-green-600 bg-white rounded px-2 py-1 border">
                    {elapsedTime}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clock In/Out Button */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {locationPermission === 'denied' && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg text-sm">
              Location access is required. Please enable it in your browser settings.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          <button
            onClick={isClockedIn ? handleClockOut : handleClockIn}
            disabled={loading}
            className={`w-full py-6 px-4 rounded-lg font-bold text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isClockedIn
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {loading ? 'Processing...' : isClockedIn ? 'Clock Out' : 'Clock In'}
          </button>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Your Hours</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatHoursForDisplay(employeeData?.stats?.todayHours || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatHoursForDisplay(employeeData?.stats?.weekHours || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Weekly Timecard */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Timecard</h2>
          {employeeData?.entries && employeeData.entries.length > 0 ? (
            <WeeklyTimecard entries={employeeData.entries} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No time entries found</p>
              <p className="text-sm">Clock in to start tracking your time</p>
            </div>
          )}
        </div>

        {/* Recent Entries */}
        {employeeData?.entries && employeeData.entries.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">All Time Entries</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {employeeData.entries.map((entry, index) => (
                <div key={index} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {format(new Date(entry.date), 'EEE, MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatTime(entry.clockInTime)} - {entry.clockOutTime ? formatTime(entry.clockOutTime) : 'Active'}
                      </p>
                    </div>
                    <div className="text-right">
                      {entry.hoursWorked > 0 ? (
                        <p className="font-medium text-gray-900">
                          {formatHoursForDisplay(entry.hoursWorked)}
                        </p>
                      ) : (
                        <span className="text-green-600 font-medium text-sm">Active</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
