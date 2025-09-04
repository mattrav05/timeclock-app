import { NextRequest, NextResponse } from 'next/server';
import { getTimeEntriesByEmployee, getEmployeeByName } from '@/lib/googleSheets';
import { isThisWeek } from '@/lib/utils';
import { subDays, startOfDay } from 'date-fns';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const { employeeId } = await params;
    
    // Get all entries for the employee
    const allEntries = await getTimeEntriesByEmployee(employeeId);
    
    // Calculate stats
    const today = startOfDay(new Date());
    const sevenDaysAgo = subDays(today, 7);
    
    const todayEntries = allEntries.filter(entry => 
      startOfDay(new Date(entry.date)).getTime() === today.getTime()
    );
    
    const weekEntries = allEntries.filter(entry => 
      isThisWeek(entry.clockInTime)
    );
    
    const recentEntries = allEntries
      .filter(entry => new Date(entry.date) >= sevenDaysAgo)
      .sort((a, b) => new Date(b.clockInTime).getTime() - new Date(a.clockInTime).getTime())
      .slice(0, 10);
    
    const todayHours = todayEntries.reduce((sum, entry) => sum + (entry.hoursWorked || 0), 0);
    const weekHours = weekEntries.reduce((sum, entry) => sum + (entry.hoursWorked || 0), 0);
    
    // Get current status
    const activeEntry = allEntries.find(entry => !entry.clockOutTime);
    
    return NextResponse.json({
      entries: recentEntries,
      stats: {
        todayHours,
        weekHours,
        totalEntries: allEntries.length,
      },
      currentStatus: activeEntry ? {
        clockedIn: true,
        clockInTime: activeEntry.clockInTime,
        location: {
          lat: activeEntry.locationLat,
          lng: activeEntry.locationLng,
        }
      } : {
        clockedIn: false
      }
    });
    
  } catch (error) {
    console.error('Timesheet error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timesheet data' },
      { status: 500 }
    );
  }
}