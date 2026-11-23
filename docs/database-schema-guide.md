# Database Schema Guide

## Overview
This guide documents important schema details to prevent common query errors when working with the STEM Challenge Hub database.

## Critical: Enrollments Table Structure

### ⚠️ Important
The `enrollments` table has **NO `id` column**. It uses a composite primary key instead.

### Table Structure
```sql
CREATE TABLE public.enrollments (
  class_id    UUID NOT NULL (references classes.id),
  student_id  UUID NOT NULL (references profiles.id),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (class_id, student_id)
);
```

### Why This Matters
- **Never** select `id` from enrollments: `SELECT id FROM enrollments` ❌ → ERROR
- **Always** use `student_id` or `class_id` when counting or aggregating
- The composite primary key ensures no duplicate enrollments per class

### Correct Query Patterns

#### ✅ Get all students in a class
```sql
SELECT student_id 
FROM enrollments 
WHERE class_id = $1;
```

#### ✅ Count students in a class
```sql
SELECT COUNT(DISTINCT student_id) 
FROM enrollments 
WHERE class_id = $1;
```

#### ✅ Check if a student is enrolled
```sql
SELECT 1 
FROM enrollments 
WHERE class_id = $1 AND student_id = $2;
```

#### ✅ Using the helper function (recommended)
```sql
SELECT public.count_class_enrollments($1); -- pass class_id
```

### ❌ Common Mistakes to Avoid
```sql
-- Wrong: id doesn't exist
SELECT id FROM enrollments;              -- ERROR
SELECT COUNT(id) FROM enrollments;       -- ERROR
SELECT * FROM enrollments WHERE id = $1; -- ERROR

-- Wrong: Can't select() on non-existent column in Supabase
supabase.from('enrollments').select('id') -- ERROR in client

-- Right: Select only valid columns
supabase.from('enrollments').select('student_id, class_id')
```

## Related TypeScript/JavaScript Query Examples

### Using Supabase Client

```typescript
// ✅ Correct: Fetch student IDs in a class
const { data: enrollments, error } = await supabase
  .from('enrollments')
  .select('student_id')
  .eq('class_id', classId);

// ✅ Correct: Count using the helper function
const { data, error } = await supabase
  .rpc('count_class_enrollments', { p_class_id: classId });

// ❌ Wrong: This will error
const { data, error } = await supabase
  .from('enrollments')
  .select('id')  // ERROR: id doesn't exist
  .eq('class_id', classId);
```

## Testing Your Queries

Before deploying any new enrollment queries:
1. Test locally with `supabase start`
2. Verify you're only selecting `class_id`, `student_id`, or `joined_at`
3. Check Supabase logs for any "column does not exist" errors
4. If counting, use `COUNT(DISTINCT student_id)` or the helper function

## Helper Functions

### count_class_enrollments(p_class_id UUID) → INTEGER
Returns the count of distinct students enrolled in a class.

```sql
SELECT public.count_class_enrollments('class-uuid-here'::uuid);
```

## See Also
- [Supabase Query Guide](https://supabase.com/docs/guides/database/json)
- [Schema Definition](../supabase/01_schema.sql)
- [Security Policies](../supabase/02_security.sql)
