import { NextRequest, NextResponse } from 'next/server';
import { getAdminPassword } from '@/lib/googleSheets';
import { google } from 'googleapis';

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

    // Try to authenticate with Google
    let authSuccess = false;
    let sheetsAccess = false;
    let sheetData: any = null;
    let adminPassword = 'NOT_FOUND';
    let errorDetails: any = null;

    try {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      authSuccess = true;
      console.log('✅ Google auth successful');

      // Try to read the spreadsheet
      const spreadsheetId = process.env.SPREADSHEET_ID!;

      // Get all sheet names
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId,
      });

      const sheetNames = spreadsheet.data.sheets?.map(s => s.properties?.title) || [];
      console.log('📊 Found sheets:', sheetNames);

      // Try to get admin password
      if (sheetNames.includes('Settings')) {
        const settingsData = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: 'Settings!A:B',
        });

        const rows = settingsData.data.values || [];
        const adminRow = rows.find((row: any) => row[0] === 'adminPassword');

        if (adminRow) {
          adminPassword = adminRow[1];
          console.log('✅ Found admin password in Settings sheet');
        } else {
          console.log('⚠️ No adminPassword row in Settings sheet');
        }

        sheetData = {
          settings: rows,
        };
      } else if (sheetNames.includes('AdminSettings')) {
        const adminSettingsData = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: 'AdminSettings!A:B',
        });

        const rows = adminSettingsData.data.values || [];
        const adminRow = rows.find((row: any) => row[0] === 'adminPassword');

        if (adminRow) {
          adminPassword = adminRow[1];
          console.log('✅ Found admin password in AdminSettings sheet');
        }

        sheetData = {
          adminSettings: rows,
        };
      }

      sheetsAccess = true;

    } catch (error: any) {
      console.error('❌ Error accessing sheets:', error);
      errorDetails = {
        message: error.message,
        code: error.code,
        status: error.status,
      };
    }

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
      authentication: {
        googleAuth: authSuccess,
        sheetsAccess: sheetsAccess,
      },
      passwordInfo: {
        fromSheets: adminPassword,
        fromHelper: helperPassword,
        match: adminPassword === helperPassword,
      },
      sheetData: sheetData,
      errors: {
        sheets: errorDetails,
        helper: helperError,
      },
      testPasswords: {
        admin123: adminPassword === 'admin123',
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