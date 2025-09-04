import { google } from 'googleapis';

// Public endpoint to initialize admin password
export async function GET() {
  try {
    console.log('🔧 Setting up admin password...');
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SPREADSHEET_ID;
    
    // Check if Settings sheet exists and has admin password
    let hasAdminPassword = false;
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Settings!A:B',
      });
      
      const rows = response.data.values;
      if (rows && rows.length > 0) {
        hasAdminPassword = rows.some(row => row[0] === 'adminPassword');
      }
    } catch (error) {
      console.log('Settings sheet does not exist, creating...');
    }
    
    if (hasAdminPassword) {
      return Response.json({ 
        success: true, 
        message: 'Admin password already configured',
        alreadyExists: true
      });
    }
    
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
    
    // Add the admin password
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Settings!A:B',
      valueInputOption: 'RAW',
      requestBody: {
        values: [['adminPassword', 'admin123']]
      }
    });
    
    console.log('✅ Admin password set to: admin123');
    return Response.json({ 
      success: true, 
      message: 'Admin password configured successfully!',
      password: 'admin123'
    });
    
  } catch (error) {
    console.error('Error setting up admin password:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
}