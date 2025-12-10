# Notion Integration Setup Guide

## Overview
This project is integrated with Notion to store application submissions and cohort data.

## Environment Variables Required

Create a `.env.local` file in the root directory with the following variables:

```env
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_APPLICATIONS_DB_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_COHORTS_DB_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Setup Steps

### 1. Create Notion Integration
1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Name it (e.g., "Pan-Africa Bitcoin Academy")
4. Copy the "Internal Integration Token" (starts with `secret_`)
5. Add it to `.env.local` as `NOTION_API_KEY`

### 2. Create Applications Database
1. Create a new database in Notion
2. Add the following properties:
   - **Name** (Title)
   - **Email** (Email)
   - **Phone** (Phone number)
   - **Country** (Text)
   - **City** (Text)
   - **Experience Level** (Select: Beginner, Intermediate, Advanced)
   - **Preferred Cohort** (Text)
3. Share the database with your integration (Settings → Connections → Add connections)
4. Copy the database ID from the URL (the part after the last `/` and before `?`)
5. Add it to `.env.local` as `NOTION_APPLICATIONS_DB_ID`

### 3. Create Cohorts Database (Optional)
1. Create a new database in Notion
2. Add the following properties:
   - **Name** (Title)
   - **Start Date** (Date)
   - **End Date** (Date)
   - **Seats** (Number)
   - **Available** (Number)
   - **Level** (Select)
   - **Duration** (Text)
3. Share the database with your integration
4. Copy the database ID and add it to `.env.local` as `NOTION_COHORTS_DB_ID`

## API Routes

### `/api/notion/test`
- **Method:** GET
- **Purpose:** Test Notion connection
- **Response:** Connection status and database info

### `/api/notion/submit-application`
- **Method:** POST
- **Purpose:** Submit application form data to Notion
- **Body:** Application form data (firstName, lastName, email, phone, country, city, experienceLevel, preferredCohort)
- **Response:** Success status and page ID

### `/api/notion/cohorts`
- **Method:** GET
- **Purpose:** Fetch cohorts from Notion database
- **Response:** Array of cohort objects

## Testing

1. Start the dev server: `npm run dev`
2. Test the connection: Visit `http://localhost:3000/api/notion/test`
3. Test form submission: Fill out the application form at `/apply`
4. Check your Notion database to verify the submission was created

## Troubleshooting

### 404 Errors
- Ensure API routes are in `src/app/api/notion/*/route.ts`
- Restart the dev server after creating new routes
- Clear `.next` cache: `rm -rf .next` (or `Remove-Item -Recurse -Force .next` on Windows)

### TypeScript Errors
- All type errors have been fixed
- If you see new errors, check the Notion API client version compatibility

### Connection Errors
- Verify `NOTION_API_KEY` is correct and starts with `secret_`
- Ensure databases are shared with your integration
- Check that database IDs are correct (32 characters, alphanumeric)

## Files Structure

```
src/
├── lib/
│   └── notion.ts              # Notion client and helper functions
├── app/
│   ├── api/
│   │   └── notion/
│   │       ├── test/
│   │       │   └── route.ts   # Test connection endpoint
│   │       ├── submit-application/
│   │       │   └── route.ts   # Submit form endpoint
│   │       └── cohorts/
│   │           └── route.ts   # Fetch cohorts endpoint
│   └── apply/
│       └── page.tsx            # Application form page
```

## Testing Your Connection

### Step 1: Test the Connection Endpoint

Open your browser and go to:
**http://localhost:3000/api/notion/test**

You should see one of these responses:

#### ✅ Success Response:
```json
{
  "success": true,
  "message": "Successfully connected to Notion!",
  "database": {
    "id": "...",
    "title": "Your Database Name"
  }
}
```

#### ⚠️ Partial Success (API key works, but database not shared):
```json
{
  "success": true,
  "message": "API key is valid, but database ID not found or not shared with integration",
  "error": "..."
}
```

#### ❌ Error Response:
```json
{
  "error": "Failed to connect to Notion",
  "details": "...",
  "code": "..."
}
```

### Step 2: Test Form Submission

1. Go to: **http://localhost:3000/apply**
2. Fill out the application form
3. Submit it
4. Check your Notion database - you should see a new entry!

## Next Steps

1. Set up your Notion databases
2. Add environment variables to `.env.local`
3. Test the connection using `/api/notion/test`
4. Test form submission on the `/apply` page
5. Customize the database properties if needed
