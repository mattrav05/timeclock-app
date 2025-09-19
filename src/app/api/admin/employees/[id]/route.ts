import { NextRequest, NextResponse } from 'next/server';
import { getAllEmployees } from '@/lib/googleSheets';
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
    const employees = await getAllEmployees();
    const employee = employees.find(emp => emp.id === employeeId);

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({ employee });

  } catch (error) {
    console.error('Get employee error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee data' },
      { status: 500 }
    );
  }
}