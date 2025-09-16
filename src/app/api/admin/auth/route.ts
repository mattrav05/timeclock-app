import { NextRequest, NextResponse } from 'next/server';
import { getAdminPassword } from '@/lib/googleSheets';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    console.log('🔐 Auth attempt received');
    console.log('📝 Provided password:', password);

    if (!password) {
      console.log('❌ No password provided');
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    console.log('📊 Fetching admin password from Google Sheets...');
    const adminPassword = await getAdminPassword();
    console.log('✅ Admin password retrieved:', adminPassword);
    console.log('🔍 Password comparison:');
    console.log('  - Provided:', password);
    console.log('  - Expected:', adminPassword);
    console.log('  - Match:', password === adminPassword);

    // For simplicity, we're doing plain text comparison
    // In production, you should hash the stored password
    const isValid = password === adminPassword;

    if (!isValid) {
      console.log('❌ Authentication failed - passwords do not match');
      return NextResponse.json({
        error: 'Invalid password',
        debug: {
          provided: password,
          expected: adminPassword,
          match: false
        }
      }, { status: 401 });
    }

    // Create a simple token (in production, use JWT)
    const token = Buffer.from(`admin:${Date.now()}`).toString('base64');

    const response = NextResponse.json({ 
      success: true,
      message: 'Authentication successful'
    });

    // Set cookie
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    console.log('✅ Authentication successful!');
    return response;

  } catch (error) {
    console.error('❌ Admin auth error:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      {
        error: 'Authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ 
    success: true,
    message: 'Logged out successfully'
  });
  
  response.cookies.delete('admin-token');
  
  return response;
}