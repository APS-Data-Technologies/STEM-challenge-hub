# Database Schema Fix - Add Missing Hint Columns

## 🔴 Error Found
```
Could not find the 'hint_level_1' column of 'challenges' in the schema cache
```

## ✅ Solution

The database is missing the hint columns (`hint_level_1`, `hint_level_2`, `hint_level_3`) and feedback_enabled column that the feedback system needs.

---

## 🛠️ How to Fix (Choose One Method)

### **METHOD 1: Use Supabase SQL Editor (Recommended)**

#### Step 1: Open Supabase Dashboard
1. Go to: https://app.supabase.com
2. Log in with your credentials
3. Select your project: **STEM Challenge Hub**

#### Step 2: Open SQL Editor
1. In the left sidebar, click **SQL Editor**
2. Click **New Query**
3. Copy and paste this SQL:

```sql
-- Add hint columns to challenges table
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS hint_level_1 TEXT DEFAULT NULL;

ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS hint_level_2 TEXT DEFAULT NULL;

ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS hint_level_3 TEXT DEFAULT NULL;

ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS feedback_enabled BOOLEAN DEFAULT TRUE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_challenges_feedback_enabled 
ON challenges(id, feedback_enabled);
```

#### Step 3: Run the Query
1. Click the **Run** button (▶️) or press **Cmd+Enter** (Mac) / **Ctrl+Enter** (Windows)
2. Wait for success message
3. ✅ Columns added!

#### Step 4: Verify
1. Click **Table Editor** in the left sidebar
2. Click on **challenges** table
3. Scroll right to see the new columns:
   - `hint_level_1` ✅
   - `hint_level_2` ✅
   - `hint_level_3` ✅
   - `feedback_enabled` ✅

---

### **METHOD 2: Use SQL File (Alternative)**

#### Step 1: Create SQL File
✅ Already created at: `D:\STEM\supabase_migration.sql`

#### Step 2: Copy SQL Content
1. Open `D:\STEM\supabase_migration.sql`
2. Select all and copy (Ctrl+A, Ctrl+C)

#### Step 3: Run in Supabase
1. Go to Supabase Dashboard
2. Click **SQL Editor** → **New Query**
3. Paste the SQL
4. Click **Run**
5. ✅ Done!

---

### **METHOD 3: Use Supabase CLI (For Developers)**

#### If you have Supabase CLI installed:

```bash
# Navigate to project
cd D:\STEM

# Apply migration
supabase db push

# Or manually:
supabase sql D:\STEM\supabase_migration.sql
```

---

## 📋 What Gets Added

| Column | Type | Purpose | Default |
|--------|------|---------|---------|
| `hint_level_1` | TEXT | First hint (1st wrong attempt) | NULL |
| `hint_level_2` | TEXT | Second hint (2nd wrong attempt) | NULL |
| `hint_level_3` | TEXT | Third hint (3rd+ wrong attempts) | NULL |
| `feedback_enabled` | BOOLEAN | Allow/disallow feedback collection | TRUE |

---

## 🧪 Test After Migration

### Step 1: Create New Challenge
1. Log in as teacher
2. Create a new challenge
3. Add hints in the form:
   - Hint Level 1: "It keeps animals hydrated"
   - Hint Level 2: "Every living thing needs this"
   - Hint Level 3: "Without this, animals get thirsty"
4. Publish challenge

### Step 2: Test as Student
1. Switch to student account
2. Take the challenge
3. Submit wrong answer
4. ✅ Should see: "Good try! Here's a hint: It keeps animals hydrated"
5. Submit wrong answer again
6. ✅ Should see: "Getting closer! Here's another hint: Every living thing needs this"
7. Submit correct answer
8. ✅ Should see: "Correct! Your curiosity paid off."

---

## ✅ Verification Checklist

After running the migration:

- [ ] No SQL errors in Supabase
- [ ] New columns appear in Table Editor
- [ ] Can create challenge with hints
- [ ] Can submit answers
- [ ] Can see progressive hints
- [ ] No "hint_level_1 column not found" errors
- [ ] Feedback system working ✅

---

## 🚀 After Fix

Once migration is complete:
1. Refresh your browser (F5)
2. All feedback features will work ✅
3. Students will see progressive hints ✅
4. Teachers can enable/disable feedback ✅

---

## 📞 If You Need Help

**Error still persists?**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Refresh page (F5)
3. Check Supabase > Authentications > API Tokens
4. Make sure you have correct permissions

**Migration failed?**
1. Check Supabase > Database > Logs
2. Verify you're in correct project
3. Try running columns one at a time
4. Contact Supabase support if needed

---

## 📁 Files

- **Migration SQL**: `D:\STEM\supabase_migration.sql`
- **This Guide**: This document
- **Code that needs it**: `src/App.tsx`, `src/components/ChallengeForm.tsx`

---

**Status**: Ready to apply ✅  
**Time Required**: < 1 minute  
**Risk Level**: Low (adds columns, doesn't modify existing data)

