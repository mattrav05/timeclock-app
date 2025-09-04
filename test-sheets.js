// Test what sheets exist and if admin password works
const { google } = require('googleapis');

async function testSheets() {
  console.log('🔧 Testing Google Sheets access...');
  
  // Try to use same auth as the app
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: 'timetracker-service@timetracker-abc123.iam.gserviceaccount.com',
      private_key: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC6VqL8zK1mN5Jp
x7QwR9YvX2sF8bL3nP2yA8oH5jM1cK0dVeTx4yU9mB2lK3pJ5qR7nN1wT8pF9fQ2
rK4yH7hT0vL6wT5nQ8lF1rT9kR2nH3wL0zG5pK8yB6jT2rL5wV8nQ5lF4rT7kR9n
H6wL3zG8pK1yB9jT5rL8wV1nQ2lF7rT0kR4nH1wL6zG3pKdyB5jT8rL1wV4nQ9l
F0rT6kR7nH4wL2zG1pK4yB8jT1rL4wV7nQ6lF3rT9kR0nH7wL5zG6pK7yB2jT4r
L7wV0nQ3lF6rT2kR5nH0wL8zG9pK0yB1jT7rL0wV3nQ6lF9rT5kR8nH3wL1zG2p
KdAgMBAAECggEAJZw7yJ2Hm8oL9qN4rK1vF2pE7bW3nT5xR8nG6jP1cQ0dVeXx
L4yU9lB2hK3pJ5qR7nN1wT8pF9fQ2rK4yH7hT0vL6wT5nQ8lF1rT9kR2nH3wL0z
G5pK8yB6jT2rL5wV8nQ5lF4rT7kR9nH6wL3zG8pK1yB9jT5rL8wV1nQ2lF7rT0k
R4nH1wL6zG3pKdyB5jT8rL1wV4nQ9lF0rT6kR7nH4wL2zG1pK4yB8jT1rL4wV7n
Q6lF3rT9kR0nH7wL5zG6pK7yB2jT4rL7wV0nQ3lF6rT2kR5nH0wL8zG9pK0yB1j
T7rL0wV3nQ6lF9rT5kR8nH3wL1zG2pK3yB4jT0rL3wV6nQ9lF2rT8kR1nH6wL4z
G5pKdyB7jT4rL7wV0nQ3lF6rT2kR5nH0wL8zG9pK0yB1jT7rL0wV3nQ6lF9rT5k
R8nH3wL1zG2pK3yB4jT0rL3wV6nQ9lF2rT8kR1nH6wL4zG5pKdyB7jT4rL7wV0n
Q3lF6rT2kR5nH0wL8zG9pK0yB1jT7rL0wV3nQ6lF9rT5kR8nH3wL1zG2pK3yB4j
T0rL3wV6nQ9lF2rT8kR1nH6wL4zG5pKdyB7jT4rL7wV0nQ3lF6rT2kR5nH0wL8z
G9pK0yB1jT7rL0wV3nQ6lF9rT5kR8nH3wL1zG2pK3yB4jT0rL3wV6nQ9lF2rT8k
R1nH6wL4zG5pKdyB7jT4rL7wV0nQ3lF6rT2kR5nH0wL8zG9pK0yB1jT7rL0wV3n
Q6lF9rT5kR8nH3wL1zG2pK3yB4jT0rL3wV6nQ9lF2rT8kR1nH6wL4zG5pKdyB7j
T4rL7wV0nQ3lF6rT2kR5nH0wL8zG9pK0yB1jT7rL0wV3nQ6lF9rT5kR8nH3wL1z
G2pK3yB4jT0rL3wV6nQ9lF2rT8kR1nH6wL4zG5pKdyB7jT4rL7wV0nQ3lF6rT2k
R5nH0wL8zG9pK0yB1jT7rL0wV3nQ6lF9rT5kR8nH3wL1zG2pK3yB4jT0rL3wV6n
Q9lF2rT8kR1nH6wL4zG5pKdyB7jT4rL7wV0nQ3lF6rT2kR5nH0wL8zG9pK0yB1j
T7rL0wV3nQ6lF9rT5kR8nH3wL1zG2pK3yB4jT0rL3wV6nQ9lF2rT8kR1nH6wL4z
G5pKdyB7j
-----END PRIVATE KEY-----`
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = '1ZEJtLrG3wsMIi3DCoV0QRj55IgAxo6RbjTxA3Ue9H4M';

  try {
    // First, list all sheets
    console.log('📋 Listing all sheets...');
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId
    });
    
    console.log('Available sheets:');
    spreadsheet.data.sheets.forEach(sheet => {
      console.log(`  - ${sheet.properties.title}`);
    });
    
    // Check AdminSettings
    console.log('\n🔍 Checking AdminSettings sheet...');
    try {
      const adminSettings = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'AdminSettings!A:B',
      });
      
      console.log('AdminSettings data:', adminSettings.data.values);
      
      if (adminSettings.data.values) {
        const adminRow = adminSettings.data.values.find(row => row[0] === 'adminPassword');
        if (adminRow) {
          console.log(`✅ Found admin password: ${adminRow[1]}`);
        } else {
          console.log('❌ No adminPassword setting found');
        }
      }
    } catch (error) {
      console.log('❌ AdminSettings sheet not found:', error.message);
    }
    
    // Check Settings
    console.log('\n🔍 Checking Settings sheet...');
    try {
      const settings = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Settings!A:B',
      });
      
      console.log('Settings data:', settings.data.values);
      
      if (settings.data.values) {
        const adminRow = settings.data.values.find(row => row[0] === 'adminPassword');
        if (adminRow) {
          console.log(`✅ Found admin password: ${adminRow[1]}`);
        } else {
          console.log('❌ No adminPassword setting found');
        }
      }
    } catch (error) {
      console.log('❌ Settings sheet not found:', error.message);
    }

  } catch (error) {
    console.error('❌ Failed to connect:', error.message);
    
    // Try to determine the real issue
    if (error.message.includes('DECODER')) {
      console.log('\n🔧 The private key format is wrong. This usually means:');
      console.log('1. The key needs proper newline formatting');
      console.log('2. The key might be incomplete or corrupted');
    }
  }
}

testSheets().catch(console.error);