# Supabase SQL Query Rename Guide

## Queries to Rename

Based on inspection of your SQL Editor, here are all the **8 Untitled Queries** with their current content and suggested names:

### ✅ Already Renamed (3)
| # | Current Name | SQL Content |
|---|---|---|
| 1 | ✅ "Migration 12: Create feedback table" | `CREATE TABLE public.challenge_feedback (...)` |
| 2 | ✅ "Migration 11: Add hint columns" | `ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS hint_level_1...` |
| 3 | ✅ "Check: Challenges table schema" | `SELECT column_name FROM information_schema.columns WHERE table_name = 'challenges'` |

### ⏳ Still Need Renaming (5)

#### Query 1
**Current Name:** "Untitled query"  
**Suggested Name:** "Migration 9: Add hint columns 1-3"  
**Content:**
```sql
-- Add hint columns to challenges table
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS hint_level_1 TEXT;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS hint_level_2 TEXT;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS hint_level_3 TEXT;
```

#### Query 2
**Current Name:** "Untitled query"  
**Suggested Name:** "Query: Check challenges schema"  
**Content:**
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'challenges';
```

#### Query 3
**Current Name:** "Untitled query"  
**Suggested Name:** "Migration 10: Add hint columns 1-2 with defaults"  
**Content:**
```sql
-- Add hint columns to challenges table
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS hint_level_1 TEXT DEFAULT NULL;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS hint_level_2 TEXT DEFAULT NULL;
```

#### Query 4
**Current Name:** "Untitled query"  
**Suggested Name:** "Migration 11: Add hint columns with comments"  
**Content:**
```sql
-- Migration: Add hint columns to challenges table
-- Purpose: Support progressive hints for student feedback system
-- Date: 2026-11-23
-- Add hint_level_1 column if it doesn't exist
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS hint_level_1 TEXT DEFAULT NULL;
```

## How to Rename in Supabase

**Method 1: Right-click in Sidebar**
1. Right-click on "Untitled query" in the left sidebar under PRIVATE section
2. Select "Rename" from context menu
3. Type new name
4. Press Enter

**Method 2: Via More Actions Menu**
1. Click on the query in sidebar to open it
2. Click "More actions" button (⋮) in the top toolbar
3. Click "Rename query"
4. Type new name  
5. Press Enter

**Method 3: Edit in Sidebar**
1. Click on "Untitled query" text in sidebar (not the row, but the text itself)
2. Some UIs allow inline editing - type new name if available

## Naming Convention Recommendation

For consistency with your existing queries, consider these naming patterns:

- **Migrations:** `"Migration #: Description"` (e.g., "Migration 12: Create feedback table")
- **Schema Checks:** `"Check: Description"` (e.g., "Check: Challenges table schema")
- **Troubleshooting:** `"Debug: Description"` 
- **Data Queries:** `"Query: Description"` (e.g., "Query: Get all users")

## Notes

- Queries 4 and 5 appear to be duplicate/alternative versions of the hint columns migration
- Consider cleaning up duplicates if they're not needed
- Once renamed, your Supabase SQL Editor sidebar will be much more organized!

---

**Last Updated:** 2026-11-23 07:55 UTC
