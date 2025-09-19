import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    clientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    privateKeyLength: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.length,
    privateKeyStart: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.substring(0, 100),
    privateKeyEnd: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.substring(-100),
    spreadsheetId: process.env.SPREADSHEET_ID,
    hasNewlines: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.includes('\\n'),
    actualNewlines: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.includes('\n'),
  });
}