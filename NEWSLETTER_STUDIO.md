# Newsletter studio

The public Newsletter page reads only `status = 'published'` issues from Supabase. September 2026 is stored as a **draft** and is not exposed to public visitors. October 2026 is published.

## Editing and publishing

Open **Newsletter → Newsletter editor** and sign in with a magic link. Only approved editors can create, modify, review, or publish issues. The UI supports three starter templates: club update, project spotlight, and announcement.

Drafts and issues marked `in_review` are private. **Publish issue** makes the newsletter public. Saving a published issue as a draft unpublishes it.

## Approving editors

There are intentionally no pre-approved editor email addresses. Add the club leader's verified login email through the Supabase SQL editor:

```sql
insert into public.newsletter_staff (email)
values (lower('EDITOR_EMAIL_HERE'))
on conflict (email) do nothing;
```

Only a Supabase project administrator should perform this step. Do not add a public registration form or expose a service-role key.

Supabase Authentication must allow email magic-link sign-in and the GitHub Pages site URL must be included in the allowed Auth redirect URLs. The project is deployed at `https://alexpombhs.github.io/build-a-better-bedford/`.

The `newsletter_staff` membership is enforced by Postgres row-level security, not just by hiding editor buttons. The `newsletters` RLS policy gives visitors read access only to published issues; an editor's authenticated session is required for all writes.

## Database

Migration applied to the connected BBB Supabase project: `newsletter_studio`. The migration creates `newsletter_staff` and `newsletters` with row-level security and seeds the current October issue as published and the September issue as a private draft.

### Content model

Each newsletter contains an issue month (YYYY-MM), number, headline, introduction, an ordered story-section array, optional longer detail sections, credits, and a publication status.

### Notes

- Newsletter editing and publishing update Supabase directly; they do not require a GitHub code deployment.
- Avoid putting private student information in published issues.
- Drafts are not available to anonymous browsers, including via guessed issue URLs.
