import { NextRequest, NextResponse } from 'next/server';
import { getAdminPassword } from '@/lib/googleSheets';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const adminPassword = await getAdminPassword();
    
    // For simplicity, we're doing plain text comparison
    // In production, you should hash the stored password
    const isValid = password === adminPassword;

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
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

    return response;

  } catch (error) {
    console.error('Admin auth error:', error);
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
  
  response.cookies.delete('admin-token');
  
  return response;
}