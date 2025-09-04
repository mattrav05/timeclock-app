import { NextRequest, NextResponse } from 'next/server';
import { getAllTimeEntries } from '@/lib/googleSheets';
import { validateAdminToken } from '@/lib/adminAuth';
import { stringify } from 'csv-stringify/sync';
import { format, parseISO } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const token = request.cookies.get('admin-token')?.value;
    if (!validateAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    let entries = await getAllTimeEntries();

    // Filter by date range if provided
    if (startDate && endDate) {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      entries = entries.filter(entry => {
        const entryDate = parseISO(entry.date);
        return entryDate >= start && entryDate <= end;
      });
    }

    // Format data for Paychex
    const csvData = entries
      .filter(entry => entry.clockOutTime) // Only completed entries
      .map(entry => ({
        'Employee Name': entry.employeeName,
        'Date': format(parseISO(entry.date), 'MM/dd/yyyy'),
        'Clock In': format(parseISO(entry.clockInTime), 'HH:mm'),
        'Clock Out': format(parseISO(entry.clockOutTime), 'HH:mm'),
        'Hours Worked': entry.hoursWorked.toFixed(2),
        'Pay Code': 'REG', // Regular time
      }));

    const csv = stringify(csvData, {
      header: true,
      columns: ['Employee Name', 'Date', 'Clock In', 'Clock Out', 'Hours Worked', 'Pay Code'],
    });

    const filename = `timesheet_${format(new Date(), 'yyyy-MM-dd')}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json(
      { error: 'Failed to export CSV' },
      { status: 500 }
    );
  }
}