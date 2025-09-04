import { NextRequest, NextResponse } from 'next/server';
import { 
  getSheetData,
  appendToSheet, 
  updateSheet, 
  findRowByColumn 
} from '@/lib/googleSheets';
import { validateAdminToken } from '@/lib/adminAuth';

// Get all networks
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value;
    if (!validateAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const networksData = await getSheetData('AllowedNetworks');
      const networks = networksData.map((row: any) => ({
        id: row.id,
        name: row.name,
        ipAddress: row.ipAddress,
        isActive: row.isActive?.toLowerCase() === 'true',
        notes: row.notes || ''
      }));
      
      return NextResponse.json({ networks });
    } catch (error) {
      // Sheet might not exist yet
      return NextResponse.json({ networks: [] });
    }

  } catch (error) {
    console.error('Get networks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch networks' },
      { status: 500 }
    );
  }
}

// Add new network
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value;
    if (!validateAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, ipAddress } = body;

    if (!name || !ipAddress) {
      return NextResponse.json({ error: 'Name and IP address are required' }, { status: 400 });
    }

    // Generate network ID
    const networkId = name.toLowerCase().replace(/\s+/g, '-');

    // Add to AllowedNetworks sheet
    const values = [[
      networkId,
      name,
      ipAddress,
      'true', // isActive
      `Added ${new Date().toISOString()}` // notes
    ]];

    await appendToSheet('AllowedNetworks', values);

    return NextResponse.json({
      success: true,
      message: 'Network added successfully',
      networkId,
      name
    });

  } catch (error) {
    console.error('Add network error:', error);
    return NextResponse.json(
      { error: 'Failed to add network' },
      { status: 500 }
    );
  }
}

// Update network status
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value;
    if (!validateAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { networkId, isActive } = body;

    if (!networkId) {
      return NextResponse.json({ error: 'Network ID is required' }, { status: 400 });
    }

    const rowNumber = await findRowByColumn('AllowedNetworks', 'id', networkId);
    if (rowNumber === -1) {
      return NextResponse.json({ error: 'Network not found' }, { status: 404 });
    }

    // Update the isActive status
    await updateSheet('AllowedNetworks', `D${rowNumber}`, [[isActive ? 'true' : 'false']]);

    return NextResponse.json({
      success: true,
      message: 'Network updated successfully'
    });

  } catch (error) {
    console.error('Update network error:', error);
    return NextResponse.json(
      { error: 'Failed to update network' },
      { status: 500 }
    );
  }
}