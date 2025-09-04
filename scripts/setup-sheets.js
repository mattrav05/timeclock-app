const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupGoogleSheets() {
  console.log('🚀 Google Sheets Setup Wizard');
  console.log('================================\n');

  console.log('📋 Prerequisites:');
  console.log('1. Google account');
  console.log('2. Google Cloud Console access (https://console.cloud.google.com)\n');

  console.log('📝 Follow these steps:\n');
  console.log('Step 1: Create Google Cloud Project');
  console.log('  - Go to https://console.cloud.google.com');
  console.log('  - Create new project named "timetracker-' + Math.random().toString(36).substring(7) + '"');
  console.log('  - Note the project ID\n');

  await question('Press Enter when you have created the project...');

  console.log('\nStep 2: Enable APIs');
  console.log('  - In your project, go to "APIs & Services" > "Library"');
  console.log('  - Search and enable: Google Sheets API');
  console.log('  - Search and enable: Google Drive API\n');

  await question('Press Enter when APIs are enabled...');

  console.log('\nStep 3: Create Service Account');
  console.log('  - Go to "APIs & Services" > "Credentials"');
  console.log('  - Click "Create Credentials" > "Service Account"');
  console.log('  - Name: timetracker-service');
  console.log('  - Click "Create and Continue"');
  console.log('  - Skip optional steps, click "Done"\n');

  await question('Press Enter when service account is created...');

  console.log('\nStep 4: Generate JSON Key');
  console.log('  - Click on your service account');
  console.log('  - Go to "Keys" tab');
  console.log('  - Click "Add Key" > "Create new key"');
  console.log('  - Choose JSON format');
  console.log('  - Save the downloaded file\n');

  const keyPath = await question('Enter the path to your downloaded JSON key file: ');

  let credentials;
  try {
    const keyFile = fs.readFileSync(keyPath.trim(), 'utf8');
    credentials = JSON.parse(keyFile);
  } catch (error) {
    console.error('❌ Error reading key file:', error.message);
    process.exit(1);
  }

  console.log('\n✅ Key file loaded successfully!');
  console.log('Service Account Email:', credentials.client_email);

  // Initialize Google Sheets API
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const drive = google.drive({ version: 'v3', auth });

  console.log('\n📊 Creating Google Spreadsheet...');

  try {
    // Create the spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: 'TimeTracker Database - ' + new Date().toISOString().split('T')[0],
        },
        sheets: [
          { properties: { title: 'TimeEntries' } },
          { properties: { title: 'Employees' } },
          { properties: { title: 'JobSites' } },
          { properties: { title: 'AdminSettings' } },
        ],
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;
    console.log('✅ Spreadsheet created! ID:', spreadsheetId);

    // Share with service account
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        type: 'user',
        role: 'writer',
        emailAddress: credentials.client_email,
      },
    });

    console.log('✅ Permissions set for service account');

    // Add headers and initial data
    console.log('\n📝 Adding headers and initial data...');

    const updates = [
      {
        range: 'TimeEntries!A1:K1',
        values: [['employeeId', 'employeeName', 'clockInTime', 'clockOutTime', 'date', 
                  'locationLat', 'locationLng', 'hoursWorked', 'isEdited', 'editedBy', 'notes']]
      },
      {
        range: 'Employees!A1:G1',
        values: [['id', 'name', 'isActive', 'currentStatus', 'lastClockIn', 'lastClockOut', 'totalHoursThisWeek']]
      },
      {
        range: 'Employees!A2:G4',
        values: [
          ['1', 'John Smith', 'true', 'clocked_out', '', '', '0'],
          ['2', 'Jane Doe', 'true', 'clocked_out', '', '', '0'],
          ['3', 'Bob Johnson', 'true', 'clocked_out', '', '', '0'],
        ]
      },
      {
        range: 'JobSites!A1:F1',
        values: [['id', 'name', 'latitude', 'longitude', 'radius', 'address']]
      },
      {
        range: 'JobSites!A2:F2',
        values: [['1', 'Main Office', '41.8781', '-87.6298', '100', '233 S Wacker Dr, Chicago, IL 60606']]
      },
      {
        range: 'AdminSettings!A1:B4',
        values: [
          ['setting', 'value'],
          ['adminPassword', 'admin123'],
          ['companyName', 'TimeTracker Pro'],
          ['defaultJobSiteId', '1']
        ]
      }
    ];

    for (const update of updates) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: update.range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: update.values },
      });
    }

    console.log('✅ Headers and initial data added!');

    // Generate .env.local file
    console.log('\n🔧 Generating environment file...');

    const envContent = `# Google Sheets Configuration
GOOGLE_SHEETS_PRIVATE_KEY="${credentials.private_key.replace(/\n/g, '\\n')}"
GOOGLE_SHEETS_CLIENT_EMAIL="${credentials.client_email}"
SPREADSHEET_ID="${spreadsheetId}"

# Admin Configuration
ADMIN_PASSWORD=admin123

# Default Job Site (Chicago - Willis Tower area)
NEXT_PUBLIC_JOB_SITE_LAT=41.8781
NEXT_PUBLIC_JOB_SITE_LNG=-87.6298
NEXT_PUBLIC_JOB_SITE_RADIUS=100

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;

    fs.writeFileSync(path.join(process.cwd(), '.env.local'), envContent);
    console.log('✅ .env.local file created!');

    console.log('\n🎉 Setup Complete!');
    console.log('================================');
    console.log('📋 Spreadsheet URL:');
    console.log(`https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
    console.log('\n⚠️  IMPORTANT: Keep your .env.local file secure!');
    console.log('\n🚀 You can now run: npm run dev');

  } catch (error) {
    console.error('❌ Error during setup:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    process.exit(1);
  }

  rl.close();
}

setupGoogleSheets().catch(console.error);