# Quick Reference - Q&A Cards for Presentation

## Security & Privacy
**Q: How do you ensure students can't see each other's work?**
A: Row-Level Security (RLS). Database policies automatically filter queries - students see only their own submissions and feedback. It's enforced at the database level, not the app.

**Q: Is data encrypted?**
A: Yes - in transit (HTTPS) and at rest (Supabase encryption). JWTs secure authentication.

**Q: Where's the data stored?**
A: Supabase Cloud (managed PostgreSQL). Located in [region]. Backups automatic.

---

## Features
**Q: Why progressive hints?**
A: Research shows hints help learning without enabling cheating. Students think through problems step-by-step.

**Q: Can students retake challenges?**
A: Yes. Latest submission replaces the previous one. Teachers see update history.

**Q: What if a student is struggling?**
A: Teachers see this in analytics. Can offer office hours, pair programming, or prerequisite challenges.

**Q: Can feedback be negative?**
A: Absolutely. "Struggled" feedback is valuable - it tells teachers what to reteach.

---

## Technical
**Q: What happens if Vercel goes down?**
A: Frontend would be offline but Supabase backend stays up. Users can't access, but data is safe.

**Q: Can you scale this to 10,000 students?**
A: Yes. Supabase and Vercel both auto-scale. Database optimized with indexes and RLS policies.

**Q: What's the cost?**
A: Vercel free tier for hobby projects, Supabase free tier for <1GB data. Paid plans ~$25-50/month for school use.

**Q: How often do you back up data?**
A: Supabase backs up continuously. Point-in-time recovery available.

---

## Adoption
**Q: Is teacher training needed?**
A: Minimal. UI is intuitive. 15-minute walkthrough covers all features.

**Q: Can we integrate with our existing LMS?**
A: Not yet, but it's on the roadmap. Currently standalone - teachers can manually add challenges.

**Q: What if a teacher leaves?**
A: Classes and data remain. New teacher can be added to manage. No data loss.

**Q: How do students get accounts?**
A: Teacher creates class, shares signup link. Students sign up with email.

---

## Analytics
**Q: What do you do with feedback data?**
A: Teachers use it to:
1. Adjust challenge difficulty
2. Improve problem clarity
3. Identify struggling students
4. Plan reteaching

**Q: Can data be exported?**
A: Yes - CSV format for Excel analysis.

**Q: How is performance tracked?**
A: Submissions + hints used + feedback. Combined into progress score.

---

## Comparison
**Q: How's this different from [LMS]?**
A: We're specialized for coding challenges. Better hint system, cleaner feedback, focus on formative assessment.

**Q: Why not just use GitHub?**
A: GitHub is powerful but not designed for teachers. We add:
- Automatic hint progression
- Structured feedback
- Teacher dashboards
- Student-friendly UI

---

## Implementation
**Q: How long to set up for a class?**
A: ~30 minutes:
- Create class
- Add students (bulk import available)
- Create 2-3 challenges
- Done - ready to assign

**Q: Can we start small?**
A: Yes. Create one challenge, see if students like it, scale up.

**Q: Is there a free tier?**
A: Yes! Supabase free tier supports small classes. Upgrade when you grow.

---

## Troubleshooting (keep handy!)
**Q: Student can't see a challenge**
A: Check enrollment - is student in the class? Is challenge enabled?

**Q: Feedback not saving**
A: Try refreshing. Check network. Contact support if persists.

**Q: Teacher can't see student feedback**
A: Teacher must be enrolled as 'teacher' role in the class. Check enrollments table.

**Q: Submission showing old code**
A: Browser cache. Try hard refresh (Ctrl+Shift+R).

---

## Demo Shortcuts
- **Quick win**: Log in as teacher, show one chart
- **Full demo**: Student submits → uses hints → gives feedback → teacher views analytics
- **Data story**: Point out "30% found it hard" and explain how you'd reteach
- **Tech story**: Show Supabase schema → explain RLS policies → data isolation

---

## Closing Lines
"This platform puts power in teachers' hands - real-time data about what works and what doesn't. Progressive hints keep students engaged without giving away answers. And it's built on proven tech - React, PostgreSQL, industry standards."

"Questions?"
