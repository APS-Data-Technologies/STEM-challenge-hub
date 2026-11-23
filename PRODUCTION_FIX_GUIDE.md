# 🔴 Production Site Fix Guide

**Problem**: Production site (https://abm-lemon.vercel.app/) shows "Invalid login credentials" error

**Root Cause**: Demo accounts do not exist in Supabase Auth

## ✅ Solution: Create Demo Accounts in Supabase

You need to create two demo accounts manually in Supabase:

### Account 1: Student Demo Account
- **Email**: `student@demo.com`
- **Password**: `password`
- **Role**: Student
- **Purpose**: Demo student account for presentations

### Account 2: Teacher Demo Account
- **Email**: `teacher@demo.com`
- **Password**: `password`
- **Role**: Teacher
- **Purpose**: Demo teacher account for presentations

## 📝 Steps to Create Accounts (Manual via Supabase Dashboard)

### Method 1: Using Supabase Auth Dashboard (Recommended - 5 minutes)

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/ktfvekxearaiepcqlhao/auth/users

2. **Click "Add user" button** (green button in top right)

3. **Select "Create new user"** from dropdown

4. **Fill in the form for Student Account**:
   - Email: `student@demo.com`
   - Password: `password`
   - Check: "Auto confirm user?" ✓
   - Click: "Create user"

5. **Repeat for Teacher Account**:
   - Email: `teacher@demo.com`
   - Password: `password`
   - Check: "Auto confirm user?" ✓
   - Click: "Create user"

### Method 2: Using SQL (Advanced)

Run this SQL in SQL Editor (https://supabase.com/dashboard/project/ktfvekxearaiepcqlhao/sql):

```sql
-- Create student demo account
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  'student@demo.com',
  crypt('password', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create teacher demo account
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  'teacher@demo.com',
  crypt('password', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;
```

**Note**: This requires the `pgcrypto` extension which should already be enabled.

## ✅ Verification

After creating the accounts:

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Go to production**: https://abm-lemon.vercel.app/
3. **Try logging in**:
   - Email: `student@demo.com`
   - Password: `password`
4. **Should see**: Challenge list page (instead of login error)

## 🌐 Expected Results After Fix

### For Student Login
- ✅ View assigned challenges
- ✅ See challenge difficulty ratings
- ✅ Submit feedback forms
- ✅ Use progressive hints
- ✅ View challenge clarity ratings
- ✅ Comment on challenges

### For Teacher Login
- ✅ See student feedback dashboard
- ✅ View analytics (difficulty, clarity, enjoyment)
- ✅ See student progress
- ✅ View all submitted feedback
- ✅ Access class reports

## 🔗 Useful Links

- **Supabase Auth Users**: https://supabase.com/dashboard/project/ktfvekxearaiepcqlhao/auth/users
- **Supabase SQL Editor**: https://supabase.com/dashboard/project/ktfvekxearaiepcqlhao/sql
- **Production Site**: https://abm-lemon.vercel.app/
- **Local Dev**: http://localhost:5173/

## ⏱️ Timing

- Creating 2 demo accounts: **5 minutes**
- Verification: **2 minutes**
- **Total**: ~7 minutes to fix production

## 📊 Summary

| Component | Status | Action |
|-----------|--------|--------|
| Production URL | ✅ Live | None needed |
| Environment Variables | ✅ Set | None needed |
| Code Deployment | ✅ Deployed | None needed |
| Demo Accounts | ❌ Missing | **CREATE NOW** |
| Login | ❌ Failing | Will work after demo accounts created |

## 🎯 Next Steps

1. Create the two demo accounts in Supabase (follow Method 1 above)
2. Clear browser cache
3. Test login on production site
4. If successful, load test data for presentation
5. Present with confidence!

---

**Last Updated**: 2026-11-23 11:38 AM
**Status**: READY FOR QUICK FIX
