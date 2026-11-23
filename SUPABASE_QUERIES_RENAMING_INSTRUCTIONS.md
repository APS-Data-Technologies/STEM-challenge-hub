# Supabase SQL Editor - Query Renaming Instructions

## Overview
You have **7 total queries** in your SQL Editor:
- **3 Already Renamed** ✅
  1. "Migration 12: Create feedback table"
  2. "Migration 11: Add hint columns"
  3. "Check: Challenges table schema"

- **4 Need Renaming** ⏳

## Complete Query Reference

### Query #1 - "Untitled query"
**Suggested Name:** `Migration 9: Add hint columns (1-3)`

**SQL Content:**
```sql
-- Add hint columns to challenges table
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS hint_level_1 TEXT;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS hint_level_2 TEXT;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS hint_level_3 TEXT;
```

---

### Query #2 - "Untitled query"
**Suggested Name:** `Check: Challenges table schema`

**SQL Content:**
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'challenges';
```

---

### Query #3 - "Untitled query"
**Suggested Name:** `Migration 10: Add hint columns (1-2 with DEFAULT NULL)`

**SQL Content:**
```sql
-- Add hint columns to challenges table
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS hint_level_1 TEXT DEFAULT NULL;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS hint_level_2 TEXT DEFAULT NULL;
```

---

### Query #4 - "Untitled query"
**Suggested Name:** `Migration 11: Add hint columns with comments`

**SQL Content:**
```sql
-- Migration: Add hint columns to challenges table
-- Purpose: Support progressive hints for student feedback system
-- Date: 2026-11-23
-- Add hint_level_1 column if it doesn't exist
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS hint_level_1 TEXT DEFAULT NULL;
```

---

## How to Rename in Supabase SQL Editor

### Method 1: Using the Tab at the Top (Recommended)
1. Click on the query tab at the top to select it
2. Look for a **three-dot menu (⋮)** button in the tab bar
3. Click "More actions" or similar menu option
4. Look for "Rename query" option
5. Type the new name
6. Press Enter

### Method 2: Right-Click on Query Name in Sidebar
1. Find the "Untitled query" in the left sidebar under **PRIVATE (7)**
2. Right-click directly on the query name
3. If a context menu appears, look for "Rename" option
4. Type the new name
5. Press Enter

### Method 3: Double-Click in Sidebar
1. Find the query in the left sidebar
2. Double-click on the query name text (not the row, but the actual text)
3. Some UIs allow inline editing - if the name becomes editable, type the new name
4. Press Enter to confirm

### Method 4: Tab Rename (Alternative)
1. Right-click on the query tab at the top (not the sidebar)
2. Look for "Rename" in the context menu
3. Type new name
4. Press Enter

---

## Renaming Order (Recommended)

Rename them in this order to avoid confusion:

1. First "Untitled query" → `Migration 9: Add hint columns (1-3)`
2. Second "Untitled query" → `Check: Challenges table schema`
3. Third "Untitled query" → `Migration 10: Add hint columns (1-2 with DEFAULT NULL)`
4. Fourth "Untitled query" → `Migration 11: Add hint columns with comments`

---

## Note About Duplicates

You currently have **multiple similar queries** for adding hint columns:
- Query 1: Adds hint_level_1, 2, 3 (no DEFAULT)
- Query 3: Adds hint_level_1, 2 (with DEFAULT NULL)
- Query 4: Adds hint_level_1 only (with DEFAULT NULL and comments)

**Consider:** Do you need all 3 versions? You might want to:
- Delete the duplicate/unnecessary ones
- Keep the most complete version
- Or keep them if they serve different migration stages

---

## If Rename Option Isn't Visible

If you can't find the rename option in Supabase's UI:

1. **Alternative: Recreate the query**
   - Create new query with desired name
   - Copy/paste the SQL content from old query
   - Delete the old "Untitled query"

2. **Check Supabase Documentation**
   - Visit https://supabase.com/docs/guides/database/sql-editor
   - Look for query management section

3. **Use Supabase CLI**
   - If you have Supabase CLI installed, you might be able to export/rename queries programmatically
   - Run: `supabase db push` after updates

---

## Saving Your Changes

Once you rename queries:
- Changes should auto-save in Supabase
- You'll see a "Saved" indicator in the UI
- No manual save required (they're stored server-side)

---

**Last Updated:** 2026-11-23  
**Status:** Ready for renaming
