# Production Deployment Checklist

## Pre-Deployment

### 1. Database Setup ✅
- [ ] Run `supabase/schema.sql` in Supabase SQL Editor
- [ ] Run `supabase/add-password-hash-migration.sql` (if password_hash column doesn't exist)
- [ ] Run `supabase/add-password-reset-columns.sql` (for password reset functionality)
- [ ] Verify all tables are created
- [ ] Verify Row Level Security (RLS) policies are enabled
- [ ] Test database connections

### 2. Environment Variables
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` in Vercel
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` in Vercel (for admin operations)
- [ ] Set `NEXT_PUBLIC_SITE_URL` in Vercel (e.g., `https://panafricanbitcoin.com`)
- [ ] Verify all environment variables are set for Production, Preview, and Development

### 3. Supabase Storage Setup
- [ ] Create `profile_img` bucket in Supabase Storage
- [ ] Set bucket to public (or configure proper RLS policies)
- [ ] Test image upload functionality

### 4. Code Review
- [ ] Remove console.log statements (especially password reset links in production)
- [ ] Remove development-only code
- [ ] Verify error messages don't expose sensitive information
- [ ] Check all API routes have proper error handling
- [ ] Verify authentication is working correctly

### 5. Build & Test
- [ ] Run `npm run build` locally - verify no errors
- [ ] Run `npm run lint` - fix any linting errors
- [ ] Test all authentication flows:
  - [ ] User registration
  - [ ] User login
  - [ ] Password change
  - [ ] Password reset (forgot password)
  - [ ] Profile update
  - [ ] Profile image upload
  - [ ] Logout
- [ ] Test on different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices

## Deployment Steps

### 1. GitHub
- [ ] Commit all changes
- [ ] Push to main branch
- [ ] Verify GitHub repository is connected to Vercel

### 2. Vercel Deployment
- [ ] Go to Vercel Dashboard
- [ ] Verify project is linked to GitHub repository
- [ ] Check deployment settings:
  - [ ] Framework: Next.js
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `.next`
  - [ ] Install Command: `npm install`
- [ ] Trigger deployment (or wait for auto-deploy on push)
- [ ] Monitor deployment logs for errors

### 3. Post-Deployment Verification
- [ ] Visit production URL
- [ ] Test homepage loads correctly
- [ ] Test user registration
- [ ] Test user login
- [ ] Test password reset flow
- [ ] Test profile update
- [ ] Test image upload
- [ ] Test protected routes (dashboard)
- [ ] Check browser console for errors
- [ ] Check Vercel function logs for API errors

### 4. Domain Configuration
- [ ] Verify custom domain is configured (panafricanbitcoin.com)
- [ ] Check SSL certificate is active
- [ ] Test domain redirects correctly
- [ ] Verify HTTPS is working

## Security Checklist

- [ ] All passwords are hashed with bcrypt
- [ ] Password reset tokens expire after 1 hour
- [ ] API routes validate input data
- [ ] Error messages don't reveal sensitive information
- [ ] Environment variables are not exposed to client
- [ ] Supabase RLS policies are configured correctly
- [ ] Rate limiting considered (for production, add rate limiting)

## Performance Checklist

- [ ] Images are optimized
- [ ] API responses are cached where appropriate
- [ ] Database queries are optimized
- [ ] No unnecessary API calls
- [ ] Static pages are pre-rendered

## Monitoring Setup

- [ ] Set up Vercel Analytics (optional)
- [ ] Set up error tracking (Sentry, etc.) (optional)
- [ ] Monitor Supabase usage and limits
- [ ] Set up uptime monitoring (optional)

## Email Service Integration (For Password Reset)

Currently, password reset generates a token but doesn't send emails. For production:

- [ ] Choose email service (SendGrid, Resend, AWS SES, etc.)
- [ ] Set up email service account
- [ ] Add email service API key to Vercel environment variables
- [ ] Update `/api/profile/forgot-password` to send emails
- [ ] Test email delivery
- [ ] Design email templates

### Recommended Email Services:
1. **Resend** - Modern, developer-friendly (recommended)
2. **SendGrid** - Popular, reliable
3. **AWS SES** - Cost-effective for high volume
4. **Mailgun** - Good API

## Post-Deployment Tasks

- [ ] Update documentation with production URLs
- [ ] Test all features in production environment
- [ ] Monitor for errors in first 24 hours
- [ ] Set up backup strategy for database
- [ ] Document any production-specific configurations

## Rollback Plan

If issues occur:
1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"
4. Investigate and fix issues
5. Redeploy when ready

## Support & Maintenance

- [ ] Document common issues and solutions
- [ ] Set up monitoring alerts
- [ ] Plan regular security updates
- [ ] Schedule database backups
- [ ] Document deployment process for team

---

## Quick Deploy Command

If using Vercel CLI:
```bash
vercel --prod
```

## Environment Variables Template

Add these to Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_SITE_URL=https://panafricanbitcoin.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

**Last Updated:** After authentication improvements
**Status:** Ready for deployment after completing checklist items

