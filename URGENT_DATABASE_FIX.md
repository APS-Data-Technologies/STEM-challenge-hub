# URGENT FIX - Database Migrations Not Applied

## Problem
Custom hints (hint_level_1, hint_level_2, hint_level_3) are NOT stored in database.
App shows default messages instead of teacher-created hints.

## Proof
- Student submitting wrong answer
- Shows default: "Good try. Think about the question again and look for clues."
- Does NOT show custom hints from teacher

## Root Cause
Database columns missing:
- ❌ hint_level_1 column
- ❌ hint_level_2 column  
- ❌ hint_level_3 column
- ❌ feedback_enabled column

## IMMEDIATE FIX (5 Minutes)

### STEP 1: Stop Dev Server
In VS Code terminal:
- Press: Ctrl+C
- Wait for server to stop

### STEP 2: Open Supabase Project
Link: https://app.supabase.com/projects

### STEP 3: Select Your Project
Click on your STEM Challenge Hub project

### STEP 4: Go to SQL Editor
- Left sidebar: Click "SQL Editor"
- Click: "New Query"

### STEP 5: Copy This SQL

```sql
-- Add hint columns to challenges table
ALTER TABLE public.challenges
ADD COLUMN IF NOT EXISTS hint_level_1 TEXT;

ALTER TABLE public.challenges
ADD COLUMN IF NOT EXISTS hint_level_2 TEXT;

ALTER TABLE public.challenges
ADD COLUMN IF NOT EXISTS hint_level_3 TEXT;

ALTER TABLE public.challenges
ADD COLUMN IF NOT EXISTS feedback_enabled BOOLEAN DEFAULT TRUE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_challenges_feedback_enabled 
ON public.challenges(id, feedback_enabled);
```

### STEP 6: Paste in SQL Editor
1. Click in SQL editor
2. Select all (Ctrl+A)
3. Delete
4. Paste the SQL above (Ctrl+V)

### STEP 7: RUN
- Click: Run ▶️ button
- Wait: See "Success" message

### STEP 8: Close Supabase
You can close the tab

### STEP 9: Back in VS Code
Press Ctrl+Shift+Delete to clear browser cache

### STEP 10: Restart Dev Server
Terminal:
```bash
npm run dev
```

### STEP 11: Refresh Page
- F5 or Ctrl+R
- Clear cache if needed

### STEP 12: TEST
1. Create NEW challenge with hints
2. Add custom hints:
   - Hint 1: "First hint"
   - Hint 2: "Second hint"
   - Hint 3: "Third hint"
3. Publish
4. As student, submit wrong answer
5. Should see: "Good try! Here's a hint: First hint" ✅

---

## Alternative Quick Method

If the above doesn't work, use this direct link approach:

1. Open: https://app.supabase.com
2. Find your project
3. Right-click → "Open in new tab"
4. Go to: SQL Editor
5. Copy-paste SQL above
6. Run immediately

---

## ✅ Verification After

Run this in SQL Editor:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'challenges'
ORDER BY column_name;
```

Should include:
- hint_level_1 ✅
- hint_level_2 ✅
- hint_level_3 ✅
- feedback_enabled ✅

---

**Time**: 5 minutes  
**Difficulty**: Very Easy  
**Risk**: None

After this, custom hints will work! 🎉
