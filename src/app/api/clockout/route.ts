import { NextRequest, NextResponse } from 'next/server';
import { 
  getEmployeeByName, 
  updateEmployeeStatus,
  getActiveTimeEntry,
  updateTimeEntry,
  getSheetData
} from '@/lib/googleSheets';
import { validateEmployeeToken } from '@/lib/adminAuth';
import { calculateHours } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { latitude, longitude } = body;

    // Validate authentication token
    const token = request.cookies.get('employee-token')?.value;
    const tokenValidation = validateEmployeeToken(token);
    
    if (!tokenValidation.isValid || !tokenValidation.employeeId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get employee by authenticated ID (more secure)
    const employees = await getSheetData('Employees');
    const employee = employees.find((emp: any) => emp.id === tokenValidation.employeeId);
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Get active time entry
    const activeEntry = await getActiveTimeEntry(employee.id);
    if (!activeEntry) {
      return NextResponse.json({ 
        error: 'No active clock in found. Please clock in first.' 
      }, { status: 400 });
    }

    // Calculate hours worked
    const now = new Date().toISOString();
    const hoursWorked = calculateHours(activeEntry.clockInTime, now);

    // Update time entry
    await updateTimeEntry(employee.id, activeEntry.clockInTime, {
      clockOutTime: now,
      hoursWorked,
    });

    // Update employee status
    await updateEmployeeStatus(employee.id, 'clocked_out', now);

    return NextResponse.json({
      success: true,
      message: 'Clocked out successfully',
      clockOutTime: now,
      hoursWorked,
      clockInTime: activeEntry.clockInTime,
    });

  } catch (error) {
    console.error('Clock out error:', error);
    return NextResponse.json(
      { error: 'Failed to clock out. Please try again.' },
      { status: 500 }
    );
  }
}