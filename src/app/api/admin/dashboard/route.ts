import { NextRequest, NextResponse } from 'next/server';
import { getAllEmployees, getAllTimeEntries } from '@/lib/googleSheets';
import { isThisWeek } from '@/lib/utils';
import { validateAdminToken } from '@/lib/adminAuth';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const token = request.cookies.get('admin-token')?.value;
    if (!validateAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allEmployees = await getAllEmployees();
    const employees = allEmployees.filter(emp => emp.isActive); // Only include active employees

    const allEntries = await getAllTimeEntries();
    
    // Get currently clocked in employees
    const clockedInEmployees = employees.filter(emp => emp.currentStatus === 'clocked_in');
    
    // Calculate today's total hours
    const todayString = format(new Date(), 'yyyy-MM-dd');
    const todayEntries = allEntries.filter(entry => entry.date === todayString);
    const todayTotalHours = todayEntries.reduce((sum, entry) => sum + (entry.hoursWorked || 0), 0);
    
    // Calculate this week's total hours
    const weekEntries = allEntries.filter(entry => isThisWeek(entry.clockInTime));
    const weekTotalHours = weekEntries.reduce((sum, entry) => sum + (entry.hoursWorked || 0), 0);
    
    // Get employee summaries
    const employeeSummaries = employees.map(emp => {
      const empEntries = allEntries.filter(e => e.employeeId === emp.id);
      const empWeekEntries = empEntries.filter(e => isThisWeek(e.clockInTime));
      const empTodayEntries = empEntries.filter(e => e.date === todayString);
      
      // Debug logging for Blake
      if (emp.id === 'blake-hutcherson') {
        console.log('🔍 Blake Debug:', {
          todayString,
          allEntriesDates: empEntries.map(e => ({ date: e.date, hours: e.hoursWorked })),
          todayEntries: empTodayEntries.map(e => ({ date: e.date, hours: e.hoursWorked })),
          todayHours: empTodayEntries.reduce((sum, e) => sum + (e.hoursWorked || 0), 0)
        });
      }
      
      return {
        id: emp.id,
        name: emp.name,
        status: emp.currentStatus,
        lastClockIn: emp.lastClockIn,
        lastClockOut: emp.lastClockOut,
        todayHours: empTodayEntries.reduce((sum, e) => sum + (e.hoursWorked || 0), 0),
        weekHours: empWeekEntries.reduce((sum, e) => sum + (e.hoursWorked || 0), 0),
      };
    });

    return NextResponse.json({
      stats: {
        totalEmployees: employees.length,
        activeEmployees: employees.filter(e => e.isActive).length,
        currentlyClockedIn: clockedInEmployees.length,
        todayTotalHours,
        weekTotalHours,
      },
      clockedInEmployees: clockedInEmployees.map(emp => ({
        id: emp.id,
        name: emp.name,
        clockInTime: emp.lastClockIn,
      })),
      employeeSummaries,
      recentEntries: allEntries
        .sort((a, b) => new Date(b.clockInTime).getTime() - new Date(a.clockInTime).getTime())
        .slice(0, 20),
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}