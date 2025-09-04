# TimeTracker - Location-Based Time Tracking System

A complete time tracking web application with location verification, built with Next.js and Google Sheets as the database.

## Features

### Employee Features
- Simple name-based login
- Location-based clock in/out (must be within configured radius)
- Real-time elapsed time display
- Personal timecard view with daily and weekly hours
- Recent time entries history
- Mobile-optimized interface

### Admin Features
- Password-protected admin dashboard
- Real-time overview of who's clocked in
- Employee hours summary (daily/weekly)
- Complete timesheet management
- CSV export in Paychex-compatible format
- Employee and job site management

## Quick Start

### Prerequisites
- Node.js 18+ installed
- Google account
- Google Cloud Console access

### Setup Instructions

1. **Clone and Install**
```bash
cd timeclock
npm install
```

2. **Set up Google Sheets Database**
```bash
npm run setup
```
This interactive script will guide you through:
- Creating a Google Cloud project
- Enabling required APIs
- Creating a service account
- Setting up the spreadsheet
- Generating your `.env.local` file

3. **Start Development Server**
```bash
npm run dev
```

4. **Access the Application**
- Employee Portal: http://localhost:3000
- Admin Portal: http://localhost:3000/admin
- Default admin password: `admin123`

## Google Cloud Setup (Manual)

If you prefer to set up manually:

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project
   - Note the project ID

2. **Enable APIs**
   - Enable Google Sheets API
   - Enable Google Drive API

3. **Create Service Account**
   - Go to APIs & Services > Credentials
   - Create Service Account
   - Download JSON key file

4. **Create Spreadsheet**
   - Create a new Google Spreadsheet
   - Share it with your service account email
   - Add these sheets with exact headers:

   **TimeEntries Sheet:**
   - employeeId | employeeName | clockInTime | clockOutTime | date | locationLat | locationLng | hoursWorked | isEdited | editedBy | notes

   **Employees Sheet:**
   - id | name | isActive | currentStatus | lastClockIn | lastClockOut | totalHoursThisWeek

   **JobSites Sheet:**
   - id | name | latitude | longitude | radius | address

   **AdminSettings Sheet:**
   - setting | value

5. **Configure Environment**
   - Copy `.env.local.example` to `.env.local`
   - Fill in your credentials

## Environment Variables

```env
# Google Sheets Configuration
GOOGLE_SHEETS_PRIVATE_KEY="your_private_key"
GOOGLE_SHEETS_CLIENT_EMAIL="your_service_account_email"
SPREADSHEET_ID="your_spreadsheet_id"

# Admin Configuration
ADMIN_PASSWORD=admin123

# Default Job Site
NEXT_PUBLIC_JOB_SITE_LAT=41.8781
NEXT_PUBLIC_JOB_SITE_LNG=-87.6298
NEXT_PUBLIC_JOB_SITE_RADIUS=100
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

```bash
npm run build
```

## API Endpoints

### Employee APIs
- `POST /api/clockin` - Clock in with location verification
- `POST /api/clockout` - Clock out
- `GET /api/timesheet/[employeeId]` - Get employee timesheet

### Admin APIs
- `POST /api/admin/auth` - Admin authentication
- `GET /api/admin/dashboard` - Dashboard data
- `GET /api/admin/export-csv` - Export timesheet as CSV

## Location Verification

The system uses the Haversine formula to calculate distance between user location and job site. Employees must be within the configured radius (default 100 meters) to clock in/out.

## CSV Export Format

The CSV export follows Paychex-compatible format:
```
Employee Name,Date,Clock In,Clock Out,Hours Worked,Pay Code
John Doe,01/15/2024,09:00,17:30,8.50,REG
```

## Security Considerations

- Admin password should be changed from default
- Service account credentials should be kept secure
- Use HTTPS in production
- Enable proper CORS settings
- Regular backups of Google Sheets data

## Troubleshooting

### Location Permission Denied
- Check browser settings
- Ensure HTTPS in production
- Try different browser

### Google Sheets API Errors
- Verify service account permissions
- Check spreadsheet sharing settings
- Confirm API quotas

### Clock In/Out Issues
- Verify location services enabled
- Check job site radius configuration
- Ensure employee exists in database

## License

MIT

## Support

For issues or questions, please create an issue in the GitHub repository.