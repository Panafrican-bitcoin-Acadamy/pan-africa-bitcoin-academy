# Email Testing Guide

This guide helps you test the student approval and email sending functionality.

## Prerequisites

1. ✅ Resend API key is configured (`RESEND_FROM_EMAIL` and `RESEND_API_KEY` in `.env.local`)
2. ✅ Development server is running (`npm run dev`)
3. ✅ You have a test email address to receive emails

---

## Method 1: Test Email Endpoint (Recommended for Quick Testing)

### Step 1: Check Email Configuration

```bash
curl http://localhost:3000/api/test-email
```

Or open in browser: `http://localhost:3000/api/test-email`

Expected response:
```json
{
  "emailConfigured": true,
  "fromEmail": "PanAfrican Bitcoin Academy <your-email@domain.com>",
  "siteUrl": "https://panafricanbitcoin.com",
  "environment": "development",
  "message": "✅ Email service is configured. Use POST to send a test email."
}
```

### Step 2: Send a Test Email

**Using curl:**
```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "studentEmail": "your-test-email@example.com",
    "studentName": "John Doe",
    "cohortName": "Cohort 1",
    "needsPasswordSetup": true
  }'
```

**Using Browser Console:**
1. Open `http://localhost:3000`
2. Press `F12` to open Developer Tools
3. Go to Console tab
4. Paste and run:

```javascript
fetch('/api/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    studentEmail: 'your-test-email@example.com',
    studentName: 'John Doe',
    cohortName: 'Cohort 1',
    needsPasswordSetup: true
  })
})
.then(res => res.json())
.then(data => {
  console.log('✅ Email Test Result:', data);
  if (data.success) {
    alert('Test email sent! Check your inbox at ' + data.details.to);
  } else {
    alert('Error: ' + data.error);
  }
})
.catch(err => console.error('Error:', err));
```

**Using Postman/Insomnia:**
- **Method:** POST
- **URL:** `http://localhost:3000/api/test-email`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "studentEmail": "your-test-email@example.com",
  "studentName": "John Doe",
  "cohortName": "Cohort 1",
  "needsPasswordSetup": true
}
```

---

## Method 2: Test Full Approval Flow (End-to-End)

### Step 1: Create a Test Application

1. Go to `http://localhost:3000/apply`
2. Fill out the application form with a test email
3. Submit the application
4. Note the application ID from the database or admin dashboard

### Step 2: Get Application ID

**Option A: From Admin Dashboard**
1. Log in to admin dashboard (`/admin`)
2. Go to Applications section
3. Find your test application
4. Copy the application ID

**Option B: From Database**
```sql
SELECT id, email, first_name, last_name, status 
FROM applications 
WHERE email = 'your-test-email@example.com'
ORDER BY created_at DESC 
LIMIT 1;
```

### Step 3: Approve the Application

**Using Admin Dashboard:**
1. Go to `/admin`
2. Find your test application
3. Click "Approve"
4. Check the console/logs for email sending status

**Using API:**
```bash
curl -X POST http://localhost:3000/api/applications/approve \
  -H "Content-Type: application/json" \
  -H "Cookie: your-admin-session-cookie" \
  -d '{
    "applicationId": "application-uuid-here"
  }'
```

**Using Browser Console (while logged in as admin):**
```javascript
fetch('/api/applications/approve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    applicationId: 'application-uuid-here'
  })
})
.then(res => res.json())
.then(data => {
  console.log('✅ Approval Result:', data);
  if (data.success) {
    alert('Application approved! Email sent: ' + data.emailSent);
    if (data.emailError) {
      console.warn('Email error:', data.emailError);
    }
  } else {
    alert('Error: ' + data.error);
  }
})
.catch(err => console.error('Error:', err));
```

---

## Method 3: Check Email Delivery

### Check Resend Dashboard

1. Go to https://resend.com/emails
2. Log in to your Resend account
3. You should see all sent emails with:
   - ✅ Delivery status
   - ✅ Recipient email
   - ✅ Subject line
   - ✅ Sent timestamp
   - ✅ Any bounce/error messages

### Check Your Email Inbox

1. Check the inbox of the test email address
2. Check spam/junk folder (emails might go there initially)
3. Verify the email contains:
   - ✅ Correct student name
   - ✅ Cohort name (if assigned)
   - ✅ Password setup link (if `needsPasswordSetup: true`)
   - ✅ Proper formatting and styling

---

## Troubleshooting

### Email Not Sending

1. **Check API Key:**
   ```bash
   # Verify RESEND_API_KEY is set
   echo $RESEND_API_KEY  # Linux/Mac
   echo %RESEND_API_KEY%  # Windows CMD
   ```

2. **Check Environment Variables:**
   - Ensure `.env.local` has `RESEND_API_KEY` and `RESEND_FROM_EMAIL`
   - Restart dev server after adding env vars

3. **Check Resend Dashboard:**
   - Verify API key is valid
   - Check if domain is verified (for production)
   - Check for any rate limits or errors

4. **Check Server Logs:**
   - Look for email-related console logs
   - Check for error messages in terminal where `npm run dev` is running

### Email Going to Spam

1. **Domain Verification:**
   - Verify your domain in Resend dashboard
   - Add SPF, DKIM, and DMARC records

2. **From Email:**
   - Use a verified domain email address
   - Format: `Name <email@verified-domain.com>`

### Email Template Issues

1. **Check Email Content:**
   - Verify student name is correct
   - Check cohort name is included (if assigned)
   - Ensure password setup URL is correct

2. **Test Different Scenarios:**
   - Test with `needsPasswordSetup: true`
   - Test with `needsPasswordSetup: false`
   - Test with cohort name
   - Test without cohort name

---

## Expected Email Content

When a student is approved, they should receive an email with:

1. **Subject:** `🎉 Welcome to PanAfrican Bitcoin Academy - Your Application Has Been Approved!`

2. **Content:**
   - Personalized greeting with student name
   - Approval confirmation message
   - Cohort information (if assigned)
   - Password setup button/link (if new account)
   - Login button/link (if existing account)
   - "What's Next?" section with next steps
   - Footer with academy information

3. **Links:**
   - Password setup: `https://panafricanbitcoin.com/setup-password?email=student@example.com`
   - Login: `https://panafricanbitcoin.com/profile/login`

---

## Quick Test Checklist

- [ ] Email configuration check returns `emailConfigured: true`
- [ ] Test email endpoint sends email successfully
- [ ] Email is received in inbox (check spam too)
- [ ] Email content is correct (name, cohort, links)
- [ ] Password setup link works (if applicable)
- [ ] Full approval flow sends email automatically
- [ ] Email appears in Resend dashboard
- [ ] No errors in server logs

---

## Next Steps After Testing

1. ✅ Verify email template looks good
2. ✅ Test with real student applications
3. ✅ Monitor Resend dashboard for delivery rates
4. ✅ Set up domain verification for production
5. ✅ Configure email templates in Resend (optional)

---

## Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Check Resend dashboard for delivery status
3. Verify environment variables are set correctly
4. Ensure domain is verified (for production emails)
