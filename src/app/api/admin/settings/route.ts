import { google } from 'googleapis';

export async function POST(request: Request) {
  try {
    const { setting, value } = await request.json();
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SPREADSHEET_ID;
    
    // Ensure Settings sheet exists
    try {
      await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Settings!A1:B1',
      });
    } catch (error) {
      console.log('Creating Settings sheet...');
      // Create Settings sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: { title: 'Settings' }
            }
          }]
        }
      });
      
      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Settings!A1:B1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [['setting', 'value']]
        }
      });
    }
    
    // Add the setting
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Settings!A:B',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[setting, value]]
      }
    });
    
    console.log(`✅ Setting added: ${setting} = ${value}`);
    return Response.json({ success: true, message: `Setting '${setting}' added successfully` });
    
  } catch (error: any) {
    console.error('Error adding setting:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}