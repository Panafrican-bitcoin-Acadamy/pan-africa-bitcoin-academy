# Email Troubleshooting Guide

## 🔍 Step-by-Step Debugging

### Step 1: Check Email Configuration

Visit: `http://localhost:3000/api/test-email`

**Expected Response:**
```json
{
  "emailConfigured": true,
  "fromEmail": "PanAfrican Bitcoin Academy <onboarding@resend.dev>",
  "message": "✅ Email service is configured..."
}
```

**If `emailConfigured: false`:**
- Check `.env.local` file exists
- Verify `RESEND_API_KEY` is set
- Restart dev server after adding API key

---

### Step 2: Test Email Sending with Debug Endpoint

**Visit:** `http://localhost:3000/api/test-email-debug` (GET)

This shows:
- API key present/absent
- API key length
- From email configuration
- Environment details

**Send Test Email:** `POST /api/test-email-debug`
```json
{
  "studentEmail": "your-real-email@example.com",
  "studentName": "Test Student"
}
```

This will show detailed error information.

---

### Step 3: Check Server Logs

When you try to send an email, check your terminal where `npm run dev` is running.

**Look for:**
- `✅ Approval email sent successfully:` - Email was sent
- `❌ Error sending approval email:` - Error occurred
- `⚠️ Email sent but no response ID received:` - Possible issue

**Common Error Messages:**

1. **"Email service not configured"**
   - `RESEND_API_KEY` is missing
   - Solution: Add API key to `.env.local` and restart server

2. **"Invalid email address format"**
   - Email validation failed
   - Solution: Check email format is correct

3. **"Unauthorized" or "Invalid API key"**
   - API key is wrong or expired
   - Solution: Get new API key from Resend dashboard

4. **"Domain not verified"**
   - Using custom domain without verification
   - Solution: Use `onboarding@resend.dev` for testing, or verify domain

---

### Step 4: Check Resend Dashboard

1. Go to: https://resend.com/emails
2. Log in to your account
3. Check the "Emails" tab

**What to look for:**
- ✅ **Sent emails** - Email was sent successfully
- ❌ **Failed emails** - Check error message
- ⏳ **Pending** - Email is queued

**Common Issues in Dashboard:**

1. **No emails showing**
   - Email wasn't sent (check server logs)
   - API key might be wrong

2. **Email shows as "Failed"**
   - Check error message in dashboard
   - Common: Invalid recipient, domain not verified, rate limit

3. **Email shows as "Delivered" but not received**
   - Check spam/junk folder
   - Check email provider filters
   - Verify email address is correct

---

### Step 5: Test with Browser Console

Open browser console (F12) and run:

```javascript
fetch('/api/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    studentEmail: 'your-real-email@example.com',
    studentName: 'Test Student',
    cohortName: 'Cohort 1',
    needsPasswordSetup: true
  })
})
.then(res => res.json())
.then(data => {
  console.log('Full Response:', data);
  if (data.success) {
    console.log('✅ Email sent!');
  } else {
    console.error('❌ Error:', data.error);
    console.error('Details:', data.errorDetails);
  }
})
.catch(err => console.error('Request failed:', err));
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Email service not configured"

**Symptoms:**
- `emailConfigured: false`
- Error: "Email service not configured"

**Solution:**
1. Open `.env.local` file
2. Add: `RESEND_API_KEY=re_your_actual_key_here`
3. Restart dev server (`npm run dev`)

---

### Issue 2: "Unauthorized" Error

**Symptoms:**
- Error: "Unauthorized" or "Invalid API key"
- Email fails to send

**Solution:**
1. Check API key is correct (starts with `re_`)
2. Verify key hasn't been revoked in Resend dashboard
3. Get new API key if needed
4. Update `.env.local` and restart server

---

### Issue 3: Email Not Received

**Symptoms:**
- Email shows as "sent" in logs
- Email shows in Resend dashboard as "delivered"
- But student doesn't receive it

**Solution:**
1. **Check spam/junk folder**
2. **Check Resend dashboard** for bounce messages
3. **Verify email address** is correct
4. **Try different email** provider (Gmail, Outlook, etc.)
5. **Check email provider filters** (might be blocking)

---

### Issue 4: "Domain not verified"

**Symptoms:**
- Error about domain verification
- Using custom domain email

**Solution:**
1. **For testing**: Use `onboarding@resend.dev` (works immediately)
2. **For production**: Verify your domain in Resend dashboard
   - Add SPF, DKIM, DMARC records
   - Wait for DNS propagation

---

### Issue 5: Rate Limit Exceeded

**Symptoms:**
- Error: "Rate limit exceeded"
- Free tier: 100 emails/day

**Solution:**
1. Check Resend dashboard for usage
2. Wait for daily reset
3. Upgrade plan if needed

---

## 🔧 Quick Fixes

### Fix 1: Restart Server After Adding API Key

```bash
# Stop server (Ctrl+C)
# Then restart
npm run dev
```

### Fix 2: Verify API Key Format

API key should:
- Start with `re_`
- Be about 40+ characters long
- No spaces or quotes around it

### Fix 3: Check Environment Variables

```bash
# In PowerShell
$env:RESEND_API_KEY
```

Should show your API key (not empty).

---

## 📊 Diagnostic Checklist

Run through this checklist:

- [ ] `.env.local` file exists
- [ ] `RESEND_API_KEY` is set in `.env.local`
- [ ] API key starts with `re_`
- [ ] No spaces/quotes around API key
- [ ] Dev server restarted after adding key
- [ ] `/api/test-email` (GET) shows `emailConfigured: true`
- [ ] Resend dashboard shows API key is active
- [ ] Test email sent via `/api/test-email` (POST)
- [ ] Check server logs for errors
- [ ] Check Resend dashboard for sent emails
- [ ] Check spam folder if email not received

---

## 🆘 Still Not Working?

### Get Detailed Error Information

1. **Check server logs** - Look for `❌` error messages
2. **Use debug endpoint** - `POST /api/test-email-debug`
3. **Check Resend dashboard** - View error messages
4. **Try direct Resend test** - Use Resend dashboard to send test email

### Common Resend Errors:

- **"Invalid API key"** - Key is wrong or expired
- **"Domain not verified"** - Need to verify domain or use test domain
- **"Rate limit exceeded"** - Too many emails sent
- **"Invalid recipient"** - Email address format is wrong
- **"Unauthorized"** - API key doesn't have permission

---

## 📝 Next Steps

1. Run diagnostic endpoint: `GET /api/test-email-debug`
2. Try sending test email: `POST /api/test-email-debug`
3. Check server logs for detailed error messages
4. Check Resend dashboard for delivery status
5. Verify API key is correct and active

---

**Need More Help?**
- Check Resend documentation: https://resend.com/docs
- Check Resend dashboard: https://resend.com/emails
- Review server logs for detailed error messages
