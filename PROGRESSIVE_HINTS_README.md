# Progressive Hints Feature

## Overview

Progressive Hints is an educational enhancement that provides students with increasingly helpful feedback when they answer multiple-choice questions incorrectly. Instead of just showing "Good try," the system reveals more specific guidance after each wrong attempt, promoting critical thinking and learning.

## How It Works

### For Teachers

When creating a multiple-choice challenge, teachers see a **"Progressive Hints (Optional)"** section in the form:

```
Progressive Hints (Optional)
Students see these hints after each wrong answer. Leave blank for auto-generated hints.

Hint 1 (after 1st wrong answer)
[Text field: General guidance to point them in the right direction]

Hint 2 (after 2nd wrong answer)
[Text field: More specific guidance]

Hint 3 (after 3rd wrong answer)
[Text field: Nearly gives away the answer]
```

Each hint has a 200-character limit. Teachers can:
- Provide all 3 custom hints
- Provide some custom hints and use auto-generated for others
- Leave all blank for auto-generated hints (default)

### For Students

When answering a multiple-choice question:

1. **First Wrong Answer** → "Good try! Here's a hint: [Hint 1]"
   - Shows general guidance to point in the right direction
   
2. **Second Wrong Answer** → "Getting closer! Here's another hint: [Hint 2]"
   - Shows more specific guidance
   
3. **Third Wrong Answer** → "One more try! Final hint: [Hint 3]"
   - Shows nearly-gives-away hint

**Auto-Generated Fallback** (if teacher didn't provide hints):
- Hint 1: "Good try. Think about the question again and look for clues."
- Hint 2: "Keep thinking! Look at all the choices carefully."
- Hint 3: "You've got this! Look for the most logical answer."

## Technical Details

### Database Schema

Progressive hints are stored in three optional columns on the `challenges` table:

```sql
ALTER TABLE challenges ADD COLUMN hint_level_1 text;
ALTER TABLE challenges ADD COLUMN hint_level_2 text;
ALTER TABLE challenges ADD COLUMN hint_level_3 text;
```

**Migration**: Run `supabase/11_progressive_hints.sql` in Supabase SQL editor after the base schema.

### Frontend Implementation

- **State**: Wrong attempts tracked per session in `wrongAttempts` state
- **Logic**: `getProgressiveHint()` function retrieves correct hint based on attempt count
- **Display**: Integrated into answer feedback system in `App.tsx`
- **Fallback**: Auto-generated hints ensure feature works even without custom hints

### Component Files

- `src/components/ChallengeForm.tsx` - Hint input fields in teacher interface
- `src/App.tsx` - Hint display logic and attempt tracking
- `src/lib/types.ts` - Challenge interface with hint fields
- `src/App.css` - Styling for hints section

## Example Use Cases

### Math Challenge
- **Question**: "What is 7 + 5?"
- **Hint 1**: "Think about how many 5 more than 7"
- **Hint 2**: "7 + 5 = 7 + (3 + 2)"
- **Hint 3**: "Start at 7 and count up 5 more: 8, 9, 10, 11, 12"

### Science Challenge
- **Question**: "Which of these is a renewable energy source?"
- **Hint 1**: "It comes from something that naturally replaces itself"
- **Hint 2**: "It's not coal or oil. Think about sun, wind, water..."
- **Hint 3**: "The answer is SOLAR energy - it uses the sun!"

## Best Practices for Teachers

1. **Progression**: Make hints progressively more specific
   - Level 1: Point direction without giving too much away
   - Level 2: Add more context and clues
   - Level 3: Nearly give away the answer (but not quite)

2. **Learning**: Use hints to reinforce learning, not just to get the right answer
   - Encourage students to think deeper
   - Connect to concepts learned in class

3. **Length**: Keep hints concise (200 chars max)
   - Focus on one key idea per hint
   - Avoid overwhelming text

4. **Inclusivity**: Consider different learning styles
   - Some students may need very explicit hints
   - Others benefit from more open-ended guidance

5. **Alternative**: Leave blank for auto-generated hints
   - System provides reasonable fallback hints
   - Good for quick challenge creation

## Deployment

### Prerequisites
- Application code (already updated)
- Supabase project (database connection required)

### Steps

1. **Deploy Application**
   ```bash
   git push origin dev-arun
   # Then merge to main for production deployment
   ```

2. **Apply Database Migration** (in Supabase console)
   - Go to SQL Editor
   - Run `supabase/11_progressive_hints.sql`
   - Confirm all statements succeed

3. **Test**
   - Create a multiple-choice challenge with custom hints
   - As a student, answer wrong 3 times
   - Verify hints appear after each attempt

## Troubleshooting

### "Could not find 'hint_level_1' column" error
- **Cause**: Database migration hasn't been applied yet
- **Solution**: Run `11_progressive_hints.sql` in Supabase SQL editor

### Hints not appearing for students
- **Check 1**: Make sure hints were saved when creating the challenge
- **Check 2**: Make sure challenge is published
- **Check 3**: Verify student is answering wrong (not right)

### Hints not saving for teachers
- **Cause**: Database schema doesn't have columns yet
- **Solution**: Apply migration (`11_progressive_hints.sql`)

## Future Enhancements

Potential improvements for future versions:

- **Analytics Dashboard**: Show which hints are most helpful
- **Hint Templates**: Pre-written hints for common question types
- **Localization**: Hints in multiple languages
- **Question Bank**: Reusable hints across multiple questions
- **Student Tracking**: Persist attempt data for teacher dashboard
- **Hint Customization**: Different hint strategies per question type

## References

- **Migration Guide**: `PROGRESSIVE_HINTS_MIGRATION.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`
- **Database Schema**: `supabase/01_schema.sql`
- **Security Policies**: `supabase/02_security.sql`

## Support

For questions or issues with progressive hints:

1. Check the troubleshooting section above
2. Review `PROGRESSIVE_HINTS_MIGRATION.md` for setup issues
3. Check `IMPLEMENTATION_SUMMARY.md` for technical details
4. Review commit history: `feat: Add progressive hints...`

---

**Status**: ✅ Ready to Deploy  
**Last Updated**: 2024  
**Version**: 1.0
