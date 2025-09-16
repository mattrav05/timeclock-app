import { NextRequest, NextResponse } from 'next/server';
import { getAdminPassword } from '@/lib/googleSheets';

export async function GET(request: NextRequest) {
  console.log('🔍 Password check diagnostic endpoint called');

  try {
    // Check environment variables
    const envCheck = {
      hasPrivateKey: !!process.env.GOOGLE_SHEETS_PRIVATE_KEY,
      hasClientEmail: !!process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      hasSpreadsheetId: !!process.env.SPREADSHEET_ID,
      spreadsheetId: process.env.SPREADSHEET_ID?.substring(0, 10) + '...',
    };

    console.log('📋 Environment check:', envCheck);

    // Try using the helper function
    let helperPassword = 'ERROR';
    let helperError: any = null;

    try {
      helperPassword = await getAdminPassword();
      console.log('✅ Helper function returned:', helperPassword);
    } catch (error: any) {
      console.error('❌ Helper function error:', error);
      helperError = error.message;
    }

    return NextResponse.json({
      status: 'diagnostic',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      passwordInfo: {
        fromHelper: helperPassword,
        helperMatchesAdmin123: helperPassword === 'admin123',
      },
      errors: {
        helper: helperError,
      },
      testPasswords: {
        helperMatchesAdmin123: helperPassword === 'admin123',
      }
    });

  } catch (error: any) {
    console.error('❌ Diagnostic error:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}