import { google } from 'googleapis';

export async function GET() {
  try {
    console.log('🔧 Debug: Checking Google Sheets configuration...');
    
    // Log environment variables (safely)
    console.log('Environment check:');
    console.log('- CLIENT_EMAIL:', process.env.GOOGLE_SHEETS_CLIENT_EMAIL ? 'SET' : 'MISSING');
    console.log('- PRIVATE_KEY:', process.env.GOOGLE_SHEETS_PRIVATE_KEY ? 'SET (length: ' + process.env.GOOGLE_SHEETS_PRIVATE_KEY.length + ')' : 'MISSING');
    console.log('- SPREADSHEET_ID:', process.env.SPREADSHEET_ID ? 'SET' : 'MISSING');
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SPREADSHEET_ID;

    // List all sheets
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId
    });
    
    const sheetNames = spreadsheet.data.sheets?.map(s => s.properties?.title) || [];
    console.log('Available sheets:', sheetNames);

    let adminPassword = 'NOT_FOUND';
    
    // Check AdminSettings first
    if (sheetNames.includes('AdminSettings')) {
      try {
        const adminSettings = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: 'AdminSettings!A:B',
        });
        
        const rows = adminSettings.data.values || [];
        const adminRow = rows.find((row: any) => row[0] === 'adminPassword');
        if (adminRow) {
          adminPassword = adminRow[1];
          console.log('✅ Found admin password in AdminSettings');
        }
      } catch (error) {
        console.log('❌ Error reading AdminSettings:', error);
      }
    }
    
    // Check Settings if not found
    if (adminPassword === 'NOT_FOUND' && sheetNames.includes('Settings')) {
      try {
        const settings = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: 'Settings!A:B',
        });
        
        const rows = settings.data.values || [];
        const adminRow = rows.find((row: any) => row[0] === 'adminPassword');
        if (adminRow) {
          adminPassword = adminRow[1];
          console.log('✅ Found admin password in Settings');
        }
      } catch (error) {
        console.log('❌ Error reading Settings:', error);
      }
    }

    return Response.json({
      success: true,
      sheetNames,
      adminPasswordFound: adminPassword !== 'NOT_FOUND',
      adminPassword: adminPassword === 'NOT_FOUND' ? 'NOT_FOUND' : 'FOUND',
      environmentVariables: {
        client_email: !!process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: !!process.env.GOOGLE_SHEETS_PRIVATE_KEY,
        spreadsheet_id: !!process.env.SPREADSHEET_ID
      }
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}