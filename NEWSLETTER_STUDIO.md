# BBB Newsletter Studio

## Visitor and editor views

Anonymous visitors can read **published** issues only. Approved editors signed in to the site can browse all issues, including **draft** and **in review**; these are labeled **HIDDEN**. September 2026 remains a private draft and retains its original crossing-design image. Publishing a draft reveals it to public visitors; saving a published issue as a draft hides it again.

## Signing in

The newsletter editor supports username/password login through the Supabase Edge Function `newsletter-login`. The username `bbb_admin` maps privately to an existing verified, editor-approved Supabase Auth user. Usernames are stored in `public.newsletter_login_aliases` (RLS/no public access); the actual permanent password is handled by **Supabase Auth**, never saved in GitHub.

For a first-time editor account, an administrator may generate a **strong, random, one-time temporary setup credential** and store its SHA-256 digest in `public.newsletter_setup_tokens`. The token expires automatically and can only be consumed once. When entered at the newsletter sign-in form, the temporary credential does **not** grant a session: the editor must first choose a permanent password (at least 12 characters), which is saved through Supabase Auth Admin API. The site then signs the user in normally.

After logging in, `Change editor password` updates the permanent password through `supabase.auth.updateUser`. The app never stores passwords in GitHub or localStorage. Do not use a guessable temporary password such as `admin`. Only issue new one-time credentials from the privileged Supabase backend, and never commit or share active credentials publicly.

## Media and previews

Editors can attach JPG, PNG, WebP and GIF images (up to 8 MB) or MP4 and WebM videos (up to 30 MB) to each content section. YouTube and Vimeo video links can be embedded. Photos and videos support alt text and captions, and they render in the live preview.

Uploaded media lives in the **private** Supabase Storage bucket `newsletter-media`, not in the website repository. Row-level security permits viewers to read media associated with a published issue; only approved editors can read a draft's media or upload new media. Preview uses temporary signed URLs. Removing an attachment from the article does not immediately delete the stored file.

## Publishing

Editor tools support **Save draft**, **Send for review**, and **Publish issue**. These actions write to Supabase directly without rebuilding GitHub Pages. Publication requires a headline, introduction and complete main sections. An editor password and RLS authorization are required to make changes.
