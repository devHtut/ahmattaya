# Private cloud drafts and publishing setup

Current branch: `codex/private-cloud-drafts`, based on the completed receiver UI at `0a2f3b7`.

## Completed

- Public Supabase configuration lives in ignored `.env.local` and Vercel's Production/Preview environment settings. `.env.example` documents names only. Secret/service-role keys are rejected by frontend configuration validation.
- Guest sign-in remains explicit. Restored sessions are checked with `getUser()`; no guest account is created during page loads.
- The owner ran `supabase/migrations/202610220001_private_drafts.sql` in the project's SQL Editor. This migration creates private drafts with RLS and column-level grants. Auth guests use the authenticated role; only their own rows are visible/editable. Unauthenticated visitors have no table access. No delete grant is provided.
- The Cloud toolbar icon, Share panel and Projects page expose manual Save and the current Guest's paginated draft list. Browser saving remains separate and automatic. Saving does not publish anything.
- Complete snapshots currently contain text, opening, appearance, embedded compressed photos, pages, preset music and cake configuration. Background images and custom music use IndexedDB-only assets and explicitly block Cloud Save until media upload is implemented; they are never silently omitted. Payload size is bounded on client and database.
- Updating uses owner/project/revision filters with server-controlled revision increments and timestamps. Stale saves fail rather than replacing newer content. The client never uses an unconditional upsert. A failed or uncertain write preserves the local draft and requires reading the newer cloud snapshot before retrying an outdated revision.
- Successful receipts are persisted with the local project; receipt updates preserve edits made while the upload is in flight. Cloud imports create a new local working copy linked to the source cloud revision, preserving every existing local project. Saving that working copy updates its source cloud draft. File → Duplicate creates an independent unlinked project.
- Requests time out after 20 seconds and can be retried. Only server-confirmed saves show a success message. No background autosave or misleading “all changes saved to cloud” status is used.

## Verification

- 67 automated tests, lint and production build pass. Embedded PostgreSQL tests apply the actual migration and verify owner/other/anon access, immutable identity/revisions, conflicting updates, payload limits and invalid JSON shape.
- `scripts/verify-cloud-drafts.mjs` is an opt-in live check using two isolated test guests. It passed against the configured Supabase project: insert/read/update, stale-save rejection, unrelated-guest read/update isolation, forged-owner insert denial, immutable ownership, and unauthenticated denial. One harmless private verification fixture remains under the temporary test guest; existing user drafts were not read or changed by that script.
- Browser verification uses a separate “Cloud Save စမ်းသပ်ကတ်” project made from the golden birthday template. Save, reload/restore and update pass through the real app UI. A stale phone-width browser view also receives the expected conflict instead of overwriting a newer revision. The 390×844 iframe viewport was reviewed for dialog layout; physical devices remain untested.
- The pre-existing large CakeScene build warning remains.

## Limits and next stages

Guest access is tied to the saved session on this browser/origin. Another device or preview URL creates a different Guest; losing the session can lose access to its cloud drafts. Account linking/recovery is not implemented yet, so this UI does not claim cross-device sign-in. Local trash does not delete remote drafts.

Cloud storage is private. `/preview` still reads the local workspace, including in-memory edits, and is not a recipient URL. Share Link stays disabled until publishing is implemented.

Next: private media storage/uploads and media reference validation; then published snapshots and recipient routes; then account linking/recovery, unpublish/delete, quotas/cleanup and QR tickets. Collaboration/RSVP/AR remain later work.

For a new environment, run the checked-in migration once in that project's SQL Editor; do not rerun it on an already-initialized table. No database password or privileged key belongs in frontend variables or Git.

References: [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security), [anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous), [public versus secret API keys](https://supabase.com/docs/guides/api/api-keys).
