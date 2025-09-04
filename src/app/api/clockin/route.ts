import { NextRequest, NextResponse } from 'next/server';
import { 
  getEmployeeByName, 
  addTimeEntry, 
  updateEmployeeStatus,
  getDefaultJobSite,
  getActiveTimeEntry,
  getSheetData,
  isIPAllowed
} from '@/lib/googleSheets';
import { validateEmployeeToken } from '@/lib/adminAuth';
import { isWithinRadius } from '@/lib/utils';
import { format } from 'date-fns';

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

    if (!employee.isActive) {
      return NextResponse.json({ error: 'Employee is not active' }, { status: 403 });
    }

    // Check if already clocked in
    const activeEntry = await getActiveTimeEntry(employee.id);
    if (activeEntry) {
      return NextResponse.json({ 
        error: 'Already clocked in. Please clock out first.' 
      }, { status: 400 });
    }

    // Check if on allowed network first (WiFi detection)
    let clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                   request.headers.get('cf-connecting-ip') ||
                   request.headers.get('x-real-ip') || 
                   'unknown';
    
    // Handle localhost connections - get public IP
    if (clientIp === '::1' || clientIp === '127.0.0.1' || clientIp === 'unknown') {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        clientIp = data.ip;
      } catch (error) {
        console.error('Failed to fetch public IP:', error);
      }
    }
    
    const onAllowedNetwork = await isIPAllowed(clientIp);
    
    // Get job site for reference even if using network verification
    const jobSite = await getDefaultJobSite();
    
    // If not on allowed network, verify GPS location
    if (!onAllowedNetwork) {
      if (!jobSite) {
        return NextResponse.json({ error: 'No job site configured' }, { status: 500 });
      }

      const withinRadius = isWithinRadius(
        latitude,
        longitude,
        jobSite.latitude,
        jobSite.longitude,
        jobSite.radius
      );

      if (!withinRadius) {
        return NextResponse.json({ 
          error: `You must be within ${jobSite.radius} meters of ${jobSite.name} to clock in, or connected to the office WiFi.`,
          jobSite: {
            name: jobSite.name,
            address: jobSite.address,
            radius: jobSite.radius
          },
          clientIp,
          allowedNetworkCheck: false
        }, { status: 403 });
      }
    }

    // Create time entry
    const now = new Date().toISOString();
    const date = format(new Date(), 'yyyy-MM-dd');

    await addTimeEntry({
      employeeId: employee.id,
      employeeName: employee.name,
      clockInTime: now,
      date,
      locationLat: latitude,
      locationLng: longitude,
      isEdited: false,
    });

    // Update employee status
    await updateEmployeeStatus(employee.id, 'clocked_in', now);

    return NextResponse.json({
      success: true,
      message: onAllowedNetwork ? 'Clocked in successfully (Office Network)' : 'Clocked in successfully',
      clockInTime: now,
      location: {
        latitude,
        longitude,
        verifiedBy: onAllowedNetwork ? 'network' : 'gps',
        clientIp: onAllowedNetwork ? clientIp : undefined
      }
    });

  } catch (error) {
    console.error('Clock in error:', error);
    return NextResponse.json(
      { error: 'Failed to clock in. Please try again.' },
      { status: 500 }
    );
  }
}