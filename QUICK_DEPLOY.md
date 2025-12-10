# Quick Deployment Guide

## 🚀 Fast Track to Production

### Step 1: Database Setup (5 minutes)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Run these migrations in order:

```sql
-- 1. Add password_hash column (if not exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 2. Add password reset columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP WITH TIME ZONE;

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_reset_token ON profiles(reset_token) WHERE reset_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_reset_token_expiry ON profiles(reset_token_expiry) WHERE reset_token_expiry IS NOT NULL;
```

Or run the migration files:
- `supabase/add-password-hash-migration.sql`
- `supabase/add-password-reset-columns.sql`

### Step 2: Supabase Storage Setup (2 minutes)

1. In Supabase Dashboard → **Storage**
2. Click **New bucket**
3. Name: `profile_img`
4. Set to **Public** (or configure RLS policies)
5. Click **Create bucket**

### Step 3: Environment Variables in Vercel (3 minutes)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `pan-africa-bitcoin-academy`
3. Go to **Settings** → **Environment Variables**
4. Add/Verify these variables:

```
NEXT_PUBLIC_SITE_URL=https://panafricanbitcoin.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

5. Make sure they're set for **Production**, **Preview**, and **Development**

### Step 4: Deploy to GitHub (2 minutes)

```bash
# Commit all changes
git add .
git commit -m "Add authentication improvements, password reset, and profile features"

# Push to GitHub
git push origin main
```

### Step 5: Vercel Auto-Deploy (Automatic)

- Vercel will automatically detect the push
- Deployment will start automatically
- Monitor at: https://vercel.com/dashboard

### Step 6: Verify Deployment (5 minutes)

1. Visit your production URL
2. Test these features:
   - ✅ User registration
   - ✅ User login
   - ✅ Profile update
   - ✅ Image upload
   - ✅ Password change
   - ✅ Logout

## ⚠️ Important Notes

### Email Service (Optional but Recommended)

Password reset currently works but doesn't send emails. For production:

1. **Quick Option**: Use [Resend](https://resend.com) (free tier available)
2. Add `RESEND_API_KEY` to Vercel environment variables
3. Update `/api/profile/forgot-password` to send emails

**Or** manually send reset links from console logs (development only).

### Custom Domain

If you have a custom domain:
1. Go to Vercel → Project → Settings → Domains
2. Add your domain: `panafricanbitcoin.com`
3. Follow DNS instructions
4. Wait for SSL certificate (usually < 5 minutes)

## 🎉 You're Done!

Once deployed, your application will have:
- ✅ Secure authentication
- ✅ Password reset functionality
- ✅ Profile management
- ✅ Image uploads
- ✅ All features working

## 📞 Need Help?

Check these files:
- `DEPLOYMENT_CHECKLIST.md` - Detailed checklist
- `FEATURES_IMPLEMENTED.md` - All features overview
- `AUTHENTICATION_IMPROVEMENTS.md` - Auth system details

---

**Estimated Total Time**: ~15 minutes
**Status**: Ready to deploy! 🚀

