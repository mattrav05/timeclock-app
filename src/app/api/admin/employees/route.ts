import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllEmployees, 
  appendToSheet, 
  updateSheet, 
  findRowByColumn,
  getSheetData 
} from '@/lib/googleSheets';
import { validateAdminToken } from '@/lib/adminAuth';
import bcrypt from 'bcryptjs';

// Get all employees (admin only)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value;
    if (!validateAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get raw data to include passwords
    const employeesData = await getSheetData('Employees');
    const employees = employeesData
      .filter((row: any) => row.isActive?.toLowerCase() === 'true') // Only return active employees
      .map((row: any) => ({
        id: row.id,
        name: row.name,
        isActive: row.isActive?.toLowerCase() === 'true',
        currentStatus: row.currentStatus,
        lastClockIn: row.lastClockIn || '',
        lastClockOut: row.lastClockOut || '',
        password: row.displayPassword || row.password || 'password123' // Show display password for admin viewing
      }));

    return NextResponse.json({ employees });

  } catch (error) {
    console.error('Get employees error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

// Add new employee (admin only)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value;
    if (!validateAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, password } = body;

    if (!name || !password) {
      return NextResponse.json({ error: 'Name and password are required' }, { status: 400 });
    }

    // Generate employee ID
    const employeeId = name.toLowerCase().replace(/\s+/g, '-');
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Add to Employees sheet
    const values = [[
      employeeId,
      name,
      'true', // isActive
      'clocked_out', // currentStatus
      '', // lastClockIn
      '', // lastClockOut
      '0', // totalHoursThisWeek
      hashedPassword, // password (hashed)
      password // displayPassword (plain text for admin viewing)
    ]];

    await appendToSheet('Employees', values);

    return NextResponse.json({
      success: true,
      message: 'Employee added successfully',
      employeeId,
      name
    });

  } catch (error) {
    console.error('Add employee error:', error);
    return NextResponse.json(
      { error: 'Failed to add employee' },
      { status: 500 }
    );
  }
}

// Update employee (admin only)
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value;
    if (!validateAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { employeeId, name, isActive, password } = body;

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    const rowNumber = await findRowByColumn('Employees', 'id', employeeId);
    if (rowNumber === -1) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Get current employee data first
    const employees = await getSheetData('Employees');
    const currentEmployee = employees.find((emp: any) => emp.id === employeeId);
    
    if (!currentEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Prepare complete row with updates
    const updateValues = [
      currentEmployee.id, // Keep existing ID
      name || currentEmployee.name, // Update name or keep existing
      isActive !== undefined ? (isActive ? 'true' : 'false') : currentEmployee.isActive, // Update status
      currentEmployee.currentStatus, // Keep existing status
      currentEmployee.lastClockIn || '', // Keep existing
      currentEmployee.lastClockOut || '', // Keep existing
      currentEmployee.totalHoursThisWeek || '0', // Keep existing
      password ? await bcrypt.hash(password, 10) : currentEmployee.password, // Update password or keep existing
      password || currentEmployee.displayPassword || 'password123' // Update display password or keep existing
    ];

    // Update the complete row including display password column
    const range = `A${rowNumber}:I${rowNumber}`;
    await updateSheet('Employees', range, [updateValues]);

    return NextResponse.json({
      success: true,
      message: 'Employee updated successfully'
    });

  } catch (error) {
    console.error('Update employee error:', error);
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    );
  }
}