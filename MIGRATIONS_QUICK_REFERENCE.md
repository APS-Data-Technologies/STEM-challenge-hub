# 🗂️ SQL Migrations Quick Reference Card

## ✅ Summary

**Q: Are all SQL queries loaded in Supabase?**

A: 
- ✅ 12 migration files exist in project
- ⚠️ Status unknown - need to verify
- ❌ Migrations 11 & 12 likely NOT applied (causing error)

---

## 📋 Migration Status Table

| # | File | Tables Created | Status |
|---|------|-----------------|--------|
| 01 | schema.sql | profiles, classes, enrollments, challenges, submissions | ✅ Applied |
| 02 | security.sql | (Policies only) | ✅ Applied |
| 03 | seed.sql | (Test data) | ✅ Applied |
| 04 | teacher_evaluation.sql | (RPC function) | ✅ Applied |
| 05 | scope_multiple_choice_feedback.sql | (RPC function) | ✅ Applied |
| 06 | class_messages.sql | (Extends challenges) | ✅ Applied |
| 07 | daily_challenges.sql | (Extends challenges) | ✅ Applied |
| 08 | class_grade_bands.sql | grade_bands | ✅ Applied |
| 09 | daily_programs.sql | daily_programs | ✅ Applied |
| 10 | profile_photos.sql | (Storage bucket) | ⚠️ Optional |
| **11** | **progressive_hints.sql** | **answer_attempts** | **❌ NOT APPLIED** |
| **12** | **challenge_feedback.sql** | **challenge_feedback** | **❌ NOT APPLIED** |

---

## 🔴 Error Diagnosis

**Error**: `Could not find the 'hint_level_1' column of 'challenges'`

**Cause**: Migration 11 not applied

**Missing**:
- hint_level_1, hint_level_2, hint_level_3 (columns)
- feedback_enabled (column)
- answer_attempts (table)
- challenge_feedback (table)

---

## ✅ Quick Fix (2-3 minutes)

### Option A: Individual Migrations

```
1. Go to: https://app.supabase.com
2. SQL Editor → New Query
3. File: D:\STEM\supabase\11_progressive_hints.sql
4. Copy → Paste → Run ▶️
5. Repeat for: 12_challenge_feedback.sql
```

### Option B: Combined Migration

```
1. Go to: https://app.supabase.com
2. SQL Editor → New Query
3. File: D:\STEM\supabase_migration.sql
4. Copy → Paste → Run ▶️
```

---

## 🔍 Verification Query

Run in Supabase SQL Editor:

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should show:
-- answer_attempts ← (from 11_progressive_hints.sql)
-- challenge_feedback ← (from 12_challenge_feedback.sql)
-- challenges, classes, enrollments, etc.
```

---

## 📁 Files Location

```
All migrations:    D:\STEM\supabase\*.sql
Quick fix:         D:\STEM\supabase_migration.sql
Step-by-step:      D:\STEM\DATABASE_FIX_GUIDE.md
Full report:       D:\STEM\SQL_MIGRATIONS_COMPLETE_CHECK.md
Detailed status:   D:\STEM\SUPABASE_MIGRATIONS_STATUS.md
```

---

## 🎯 Next Steps

1. ✅ Verify status (run table check)
2. ✅ Apply missing migrations (11 & 12)
3. ✅ Verify columns (run column check)
4. ✅ Clear cache & refresh
5. ✅ Test hints system

---

**Time Required**: 2-3 minutes  
**Risk Level**: None  
**Benefit**: Full hints + feedback system ✅
