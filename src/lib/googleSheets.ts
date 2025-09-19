import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export const SPREADSHEET_ID = process.env.SPREADSHEET_ID!;

export interface TimeEntry {
  employeeId: string;
  employeeName: string;
  clockInTime: string;
  clockOutTime: string;
  date: string;
  locationLat: number;
  locationLng: number;
  hoursWorked: number;
  isEdited: boolean;
  editedBy: string;
  notes: string;
}

/*
 * GOOGLE SHEETS SCHEMA DOCUMENTATION
 * 
 * Employees Sheet Columns (A-I):
 * A: id (string) - employee ID (e.g., "john-smith")
 * B: name (string) - full name (e.g., "John Smith") 
 * C: isActive (string) - "true"/"false" 
 * D: currentStatus (string) - "clocked_in"/"clocked_out"
 * E: lastClockIn (string) - ISO timestamp or empty
 * F: lastClockOut (string) - ISO timestamp or empty
 * G: totalHoursThisWeek (string) - number as string (e.g., "40.5")
 * H: password (string) - bcrypt hash for authentication
 * I: displayPassword (string) - plain text for admin viewing
 */

export interface Employee {
  id: string;
  name: string;
  isActive: boolean;
  currentStatus: 'clocked_in' | 'clocked_out';
  lastClockIn: string;
  lastClockOut: string;
  totalHoursThisWeek: number;
  password?: string; // For admin viewing (displayPassword from sheet)
}

export interface JobSite {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  address: string;
}

export async function getSheetData(sheetName: string) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    const headers = rows[0];
    return rows.slice(1).map(row => {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
  } catch (error: any) {
    console.error(`Error reading sheet ${sheetName}:`, error);
    throw error;
  }
}

export async function appendToSheet(sheetName: string, values: any[][]) {
  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error appending to sheet ${sheetName}:`, error);
    throw error;
  }
}

export async function updateSheet(sheetName: string, range: string, values: any[][]) {
  try {
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!${range}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating sheet ${sheetName}:`, error);
    throw error;
  }
}

export async function findRowByColumn(sheetName: string, columnName: string, value: string): Promise<number> {
  const data = await getSheetData(sheetName);
  const index = data.findIndex((row: any) => row[columnName] === value);
  return index >= 0 ? index + 2 : -1; // +2 because of header row and 1-based indexing
}

export async function getAllEmployees(): Promise<Employee[]> {
  const data = await getSheetData('Employees');
  return data.map((row: any) => ({
    id: row.id,
    name: row.name,
    isActive: row.isActive?.toLowerCase() === 'true',
    currentStatus: row.currentStatus as 'clocked_in' | 'clocked_out',
    lastClockIn: row.lastClockIn || '',
    lastClockOut: row.lastClockOut || '',
    totalHoursThisWeek: parseFloat(row.totalHoursThisWeek) || 0,
    password: row.displayPassword || 'password123', // Include display password for admin
  }));
}

export async function getEmployeeByName(name: string): Promise<Employee | null> {
  const employees = await getAllEmployees();
  return employees.find(emp => emp.name.toLowerCase() === name.toLowerCase()) || null;
}

export async function updateEmployeeStatus(
  employeeId: string,
  status: 'clocked_in' | 'clocked_out',
  timestamp: string
) {
  const rowNumber = await findRowByColumn('Employees', 'id', employeeId);
  if (rowNumber === -1) throw new Error('Employee not found');
  
  // Update currentStatus (column D)
  await updateSheet('Employees', `D${rowNumber}`, [[status]]);
  
  // Update the appropriate timestamp column (E for lastClockIn, F for lastClockOut)
  const timestampColumn = status === 'clocked_in' ? 'E' : 'F';
  await updateSheet('Employees', `${timestampColumn}${rowNumber}`, [[timestamp]]);
}

export async function addTimeEntry(entry: Partial<TimeEntry>) {
  const values = [[
    entry.employeeId || '',
    entry.employeeName || '',
    entry.clockInTime || '',
    entry.clockOutTime || '',
    entry.date || '',
    entry.locationLat || 0,
    entry.locationLng || 0,
    entry.hoursWorked || 0,
    entry.isEdited ? 'true' : 'false',
    entry.editedBy || '',
    entry.notes || '',
  ]];
  
  return await appendToSheet('TimeEntries', values);
}

export async function getTimeEntriesByEmployee(employeeId: string): Promise<TimeEntry[]> {
  const data = await getSheetData('TimeEntries');
  return data
    .filter((row: any) => row.employeeId === employeeId)
    .map((row: any) => ({
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      clockInTime: row.clockInTime,
      clockOutTime: row.clockOutTime,
      date: row.date,
      locationLat: parseFloat(row.locationLat) || 0,
      locationLng: parseFloat(row.locationLng) || 0,
      hoursWorked: parseFloat(row.hoursWorked) || 0,
      isEdited: row.isEdited === 'true',
      editedBy: row.editedBy || '',
      notes: row.notes || '',
    }));
}

export async function getActiveTimeEntry(employeeId: string): Promise<TimeEntry | null> {
  const entries = await getTimeEntriesByEmployee(employeeId);
  return entries.find(entry => !entry.clockOutTime) || null;
}

export async function updateTimeEntry(employeeId: string, clockInTime: string, updates: Partial<TimeEntry>) {
  const data = await getSheetData('TimeEntries');
  const rowIndex = data.findIndex((row: any) => 
    row.employeeId === employeeId && row.clockInTime === clockInTime
  );
  
  if (rowIndex === -1) throw new Error('Time entry not found');
  
  const rowNumber = rowIndex + 2;
  const existingRow = data[rowIndex];
  const updatedRow = { ...existingRow, ...updates };
  
  const values = [[
    updatedRow.employeeId,
    updatedRow.employeeName,
    updatedRow.clockInTime,
    updatedRow.clockOutTime || '',
    updatedRow.date,
    updatedRow.locationLat,
    updatedRow.locationLng,
    updatedRow.hoursWorked || '',
    updatedRow.isEdited ? 'true' : 'false',
    updatedRow.editedBy || '',
    updatedRow.notes || '',
  ]];
  
  return await updateSheet('TimeEntries', `A${rowNumber}:K${rowNumber}`, values);
}

export async function getAllJobSites(): Promise<JobSite[]> {
  const data = await getSheetData('JobSites');
  return data.map((row: any) => ({
    id: row.id,
    name: row.name,
    latitude: parseFloat(row.latitude) || 0,
    longitude: parseFloat(row.longitude) || 0,
    radius: parseFloat(row.radius) || 100,
    address: row.address || '',
  }));
}

export async function getDefaultJobSite(): Promise<JobSite | null> {
  const settings = await getSheetData('AdminSettings');
  const defaultId = settings.find((row: any) => row.setting === 'defaultJobSiteId')?.value;
  
  if (!defaultId) return null;
  
  const jobSites = await getAllJobSites();
  return jobSites.find(site => site.id === defaultId) || null;
}

export async function getAllowedNetworks(): Promise<any[]> {
  try {
    const data = await getSheetData('AllowedNetworks');
    return data.filter((row: any) => row.isActive?.toLowerCase() === 'true');
  } catch (error) {
    // Sheet might not exist yet, try to create it
    console.log('AllowedNetworks sheet does not exist, creating...');
    try {
      await createAllowedNetworksSheet();
      return []; // Return empty array for first time
    } catch (createError) {
      console.error('Failed to create AllowedNetworks sheet:', createError);
      return [];
    }
  }
}

async function createAllowedNetworksSheet() {
  // Create the sheet
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        addSheet: {
          properties: {
            title: 'AllowedNetworks'
          }
        }
      }]
    }
  });
  
  // Add headers
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'AllowedNetworks!A1:E1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [['id', 'name', 'ipAddress', 'isActive', 'notes']]
    }
  });
}

export async function isIPAllowed(ipAddress: string): Promise<boolean> {
  const networks = await getAllowedNetworks();
  return networks.some(network => network.ipAddress === ipAddress);
}

export async function getAdminPassword(): Promise<string> {
  try {
    const settings = await getSheetData('Settings');
    const passwordRow = settings.find((row: any) => row.setting === 'adminPassword');
    return passwordRow?.value || 'admin123';
  } catch (error) {
    console.error('Settings sheet not found, creating with default admin password');
    
    // Create Settings sheet if it doesn't exist
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{
            addSheet: {
              properties: { title: 'Settings' }
            }
          }]
        }
      });

      // Add headers and admin password
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Settings!A1:B2',
        valueInputOption: 'RAW',
        requestBody: {
          values: [
            ['setting', 'value'],
            ['adminPassword', 'admin123']
          ]
        }
      });

      console.log('Settings sheet created with admin password');
      return 'admin123';
    } catch (createError) {
      console.error('Failed to create Settings sheet:', createError);
      return 'admin123'; // Fallback default
    }
  }
}

export async function getAllTimeEntries(): Promise<TimeEntry[]> {
  const data = await getSheetData('TimeEntries');
  return data.map((row: any) => ({
    employeeId: row.employeeId,
    employeeName: row.employeeName,
    clockInTime: row.clockInTime,
    clockOutTime: row.clockOutTime || '',
    date: row.date,
    locationLat: parseFloat(row.locationLat) || 0,
    locationLng: parseFloat(row.locationLng) || 0,
    hoursWorked: parseFloat(row.hoursWorked) || 0,
    isEdited: row.isEdited === 'true',
    editedBy: row.editedBy || '',
    notes: row.notes || '',
  }));
}

export interface AuditLogEntry {
  timestamp: string;
  adminUser: string;
  action: string;
  employeeId: string;
  employeeName: string;
  details: string;
  originalData?: string;
  newData?: string;
}

export async function addAuditLogEntry(entry: Omit<AuditLogEntry, 'timestamp'>) {
  try {
    const timestamp = new Date().toISOString();
    const values = [[
      timestamp,
      entry.adminUser,
      entry.action,
      entry.employeeId,
      entry.employeeName,
      entry.details,
      entry.originalData || '',
      entry.newData || ''
    ]];

    return await appendToSheet('AuditLog', values);
  } catch (error) {
    // If AuditLog sheet doesn't exist, create it
    console.log('AuditLog sheet does not exist, creating...');
    try {
      await createAuditLogSheet();
      // Retry adding the entry
      const timestamp = new Date().toISOString();
      const values = [[
        timestamp,
        entry.adminUser,
        entry.action,
        entry.employeeId,
        entry.employeeName,
        entry.details,
        entry.originalData || '',
        entry.newData || ''
      ]];
      return await appendToSheet('AuditLog', values);
    } catch (createError) {
      console.error('Failed to create AuditLog sheet:', createError);
      throw createError;
    }
  }
}

async function createAuditLogSheet() {
  // Create the sheet
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        addSheet: {
          properties: {
            title: 'AuditLog'
          }
        }
      }]
    }
  });

  // Add headers
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'AuditLog!A1:H1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [['timestamp', 'adminUser', 'action', 'employeeId', 'employeeName', 'details', 'originalData', 'newData']]
    }
  });
}

export async function getAuditLog(): Promise<AuditLogEntry[]> {
  try {
    const data = await getSheetData('AuditLog');
    return data.map((row: any) => ({
      timestamp: row.timestamp,
      adminUser: row.adminUser,
      action: row.action,
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      details: row.details,
      originalData: row.originalData || '',
      newData: row.newData || ''
    }));
  } catch (error) {
    console.log('AuditLog sheet does not exist yet');
    return [];
  }
}