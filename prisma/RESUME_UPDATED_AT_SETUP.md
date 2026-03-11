# Resume last updated (resumeUpdatedAt) – setup

The schema already includes `resumeUpdatedAt` on `JobSeekerProfile`. Apply it to your database and regenerate the client:

```bash
# Apply schema changes to the database (adds resumeUpdatedAt column)
npx prisma db push

# Or, if you use migrations:
npx prisma migrate dev --name add_resume_updated_at

# Regenerate Prisma client
npx prisma generate
```

After this, “last updated CV” will show on:
- Candidate profile page (next to “View Resume”)
- Job application page (in the CV section)
- Employer candidate details page (under “View / Download Resume”)
