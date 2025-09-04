import { NextRequest, NextResponse } from 'next/server';
import { getSheetData } from '@/lib/googleSheets';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, password } = body;

    if (!employeeId || !password) {
      return NextResponse.json({ error: 'Employee ID and password are required' }, { status: 400 });
    }

    // Get employee data from Employees sheet
    const employees = await getSheetData('Employees');
    const employee = employees.find((emp: any) => emp.id === employeeId);

    if (!employee) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check if employee is active (getSheetData converts to boolean)
    if (!employee.isActive) {
      return NextResponse.json({ error: 'Account is inactive' }, { status: 403 });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, employee.password || '');
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create session token
    const token = Buffer.from(`${employeeId}:${Date.now()}`).toString('base64');

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      employee: {
        id: employee.id,
        name: employee.name,
        currentStatus: employee.currentStatus
      }
    });

    // Set session cookie
    response.cookies.set('employee-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
    });

    response.cookies.set('employee-id', employeeId, {
      httpOnly: false, // Allow client-side access for this one
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return response;

  } catch (error) {
    console.error('Employee auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  });

  response.cookies.delete('employee-token');
  response.cookies.delete('employee-id');

  return response;
}