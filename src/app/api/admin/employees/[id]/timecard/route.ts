import { NextRequest, NextResponse } from 'next/server';
import {
  getTimeEntriesByEmployee,
  updateTimeEntry,
  addTimeEntry,
  getSheetData,
  updateSheet,
  findRowByColumn,
  addAuditLogEntry,
  getAllEmployees
} from '@/lib/googleSheets';
import { validateAdminToken } from '@/lib/adminAuth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('admin-token')?.value;
    if (!validateAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: employeeId } = await params;
    const entries = await getTimeEntriesByEmployee(employeeId);

    return NextResponse.json({ entries });

  } catch (error) {
    console.error('Get timecard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timecard data' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('admin-token')?.value;
    if (!validateAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, entryData } = body;
    const { id: employeeId } = await params;

    if (action === 'edit') {
      const { originalClockInTime, ...updates } = entryData;

      // Get original entry for audit log
      const originalEntries = await getTimeEntriesByEmployee(employeeId);
      const originalEntry = originalEntries.find(entry => entry.clockInTime === originalClockInTime);

      // Calculate hours worked if both times are provided
      if (updates.clockInTime && updates.clockOutTime) {
        const clockIn = new Date(updates.clockInTime);
        const clockOut = new Date(updates.clockOutTime);
        updates.hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
      }

      // Mark as edited by admin
      updates.isEdited = true;
      updates.editedBy = 'admin';

      await updateTimeEntry(employeeId, originalClockInTime, updates);

      // Get employee name for audit log
      const employees = await getAllEmployees();
      const employee = employees.find(emp => emp.id === employeeId);

      // Add audit log entry
      await addAuditLogEntry({
        adminUser: 'admin',
        action: 'edit_time_entry',
        employeeId,
        employeeName: employee?.name || 'Unknown',
        details: `Modified time entry for ${originalEntry?.date || 'unknown date'}`,
        originalData: JSON.stringify(originalEntry),
        newData: JSON.stringify({ ...originalEntry, ...updates })
      });

      return NextResponse.json({
        success: true,
        message: 'Time entry updated successfully'
      });

    } else if (action === 'add') {
      // Calculate hours worked
      const clockIn = new Date(entryData.clockInTime);
      const clockOut = new Date(entryData.clockOutTime);
      const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

      const newEntry = {
        ...entryData,
        employeeId,
        hoursWorked,
        isEdited: true,
        editedBy: 'admin'
      };

      await addTimeEntry(newEntry);

      // Get employee name for audit log
      const employees = await getAllEmployees();
      const employee = employees.find(emp => emp.id === employeeId);

      // Add audit log entry
      await addAuditLogEntry({
        adminUser: 'admin',
        action: 'add_time_entry',
        employeeId,
        employeeName: employee?.name || 'Unknown',
        details: `Added manual time entry for ${entryData.date}`,
        newData: JSON.stringify(newEntry)
      });

      return NextResponse.json({
        success: true,
        message: 'Time entry added successfully'
      });

    } else if (action === 'delete') {
      // Find and delete the time entry
      const data = await getSheetData('TimeEntries');
      const rowIndex = data.findIndex((row: any) =>
        row.employeeId === employeeId &&
        row.clockInTime === entryData.clockInTime
      );

      if (rowIndex === -1) {
        return NextResponse.json({ error: 'Time entry not found' }, { status: 404 });
      }

      const originalEntry = data[rowIndex];
      const rowNumber = rowIndex + 2; // +2 for header row and 1-based indexing

      // Clear the row by setting all values to empty
      const emptyValues = [['', '', '', '', '', '', '', '', '', '', '']];
      await updateSheet('TimeEntries', `A${rowNumber}:K${rowNumber}`, emptyValues);

      // Get employee name for audit log
      const employees = await getAllEmployees();
      const employee = employees.find(emp => emp.id === employeeId);

      // Add audit log entry
      await addAuditLogEntry({
        adminUser: 'admin',
        action: 'delete_time_entry',
        employeeId,
        employeeName: employee?.name || 'Unknown',
        details: `Deleted time entry for ${originalEntry.date || 'unknown date'}`,
        originalData: JSON.stringify(originalEntry)
      });

      return NextResponse.json({
        success: true,
        message: 'Time entry deleted successfully'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Update timecard error:', error);
    return NextResponse.json(
      { error: 'Failed to update timecard' },
      { status: 500 }
    );
  }
}