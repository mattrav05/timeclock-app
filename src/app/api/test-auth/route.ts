import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  console.log('🔧 Test Auth Endpoint Called');
  console.log('🔧 Environment variables:');
  console.log('🔧 GOOGLE_SHEETS_CLIENT_EMAIL:', process.env.GOOGLE_SHEETS_CLIENT_EMAIL);
  console.log('🔧 GOOGLE_SHEETS_PRIVATE_KEY length:', process.env.GOOGLE_SHEETS_PRIVATE_KEY?.length);
  console.log('🔧 SPREADSHEET_ID:', process.env.SPREADSHEET_ID);

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    console.log('🔧 Auth object created');

    const sheets = google.sheets({ version: 'v4', auth });
    console.log('🔧 Sheets client created');

    // Try to get basic spreadsheet info first
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: process.env.SPREADSHEET_ID!,
    });

    console.log('🔧 Spreadsheet access successful');
    console.log('🔧 Sheet title:', spreadsheet.data.properties?.title);
    console.log('🔧 Sheet count:', spreadsheet.data.sheets?.length);

    return NextResponse.json({
      success: true,
      title: spreadsheet.data.properties?.title,
      sheets: spreadsheet.data.sheets?.map(s => s.properties?.title),
    });

  } catch (error: any) {
    console.error('🔧 Auth test failed:', error);
    console.error('🔧 Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
    });

    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      status: error.status,
    }, { status: 500 });
  }
}