import { NextRequest, NextResponse } from 'next/server';
import { getSheetData, updateSheet } from '@/lib/googleSheets';
import { validateAdminToken } from '@/lib/adminAuth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const token = request.cookies.get('admin-token')?.value;
    if (!validateAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Get all employees
    const employees = await getSheetData('Employees');
    const employeeIndex = employees.findIndex((emp: any) => emp.id === id);
    
    if (employeeIndex === -1) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Mark as inactive instead of actually deleting (to preserve historical data)
    const rowNumber = employeeIndex + 2; // +2 for header row and 1-based indexing
    await updateSheet('Employees', `C${rowNumber}`, [['false']]); // Set isActive to false

    return NextResponse.json({
      success: true,
      message: 'Employee deactivated successfully'
    });

  } catch (error) {
    console.error('Delete employee error:', error);
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    );
  }
}