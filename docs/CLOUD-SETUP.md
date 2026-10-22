# Private cloud drafts and publishing setup

Current branch: `codex/private-cloud-media`, based on the completed receiver UI at `0a2f3b7`.

## Completed

- Public Supabase configuration lives in ignored `.env.local` and Vercel's Production/Preview environment settings. `.env.example` documents names only. Secret/service-role keys are rejected by frontend configuration validation.
- Guest sign-in remains explicit. Restored sessions are checked with `getUser()`; no guest account is created during page loads.
- The owner ran `supabase/migrations/202610220001_private_drafts.sql` in the project's SQL Editor. This migration creates private drafts with RLS and column-level grants. Auth guests use the authenticated role; only their own rows are visible/editable. Unauthenticated visitors have no table access. No delete grant is provided.
- The Cloud toolbar icon, Share panel and Projects page expose manual Save and the current Guest's paginated draft list. Browser saving remains separate and automatic. Saving does not publish anything.
- Complete snapshots contain text, opening, appearance, embedded compressed photos, pages, preset/custom music and cake configuration. Background images and uploaded audio are copied into the private `draft-media` bucket before a snapshot is committed. The owner ran `202610220002_private_draft_media.sql`; old media-free drafts remain compatible.
- Updating uses owner/project/revision filters with server-controlled revision increments and timestamps. Stale saves fail rather than replacing newer content. The client never uses an unconditional upsert. A failed or uncertain write preserves the local draft and requires reading the newer cloud snapshot before retrying an outdated revision.
- Successful receipts are persisted with the local project; receipt updates preserve edits made while the upload is in flight. Cloud imports create a new local working copy linked to the source cloud revision, preserving every existing local project. Saving that working copy updates its source cloud draft. File → Duplicate creates an independent unlinked project.
- Requests time out after 20 seconds and can be retried. Only server-confirmed saves show a success message. No background autosave or misleading “all changes saved to cloud” status is used.

## Verification

- 74 automated tests, lint and production build pass. Embedded PostgreSQL tests apply the actual migration and verify owner/other/anon access, immutable identity/revisions, conflicting updates, payload limits and invalid JSON shape.
- `scripts/verify-cloud-drafts.mjs` is an opt-in live check using two isolated test guests. It passed against the configured Supabase project: insert/read/update, stale-save rejection, unrelated-guest read/update isolation, forged-owner insert denial, immutable ownership, and unauthenticated denial. One harmless private verification fixture remains under the temporary test guest; existing user drafts were not read or changed by that script.
- Browser verification uses a separate “Cloud Save စမ်းသပ်ကတ်” project made from the golden birthday template. Save, reload/restore and update pass through the real app UI. A stale phone-width browser view also receives the expected conflict instead of overwriting a newer revision. The 390×844 iframe viewport was reviewed for dialog layout; physical devices remain untested.
- The pre-existing large CakeScene build warning remains.

## Limits and next stages

Guest access is tied to the saved session on this browser/origin. Another device or preview URL creates a different Guest; losing the session can lose access to its cloud drafts. Account linking/recovery is not implemented yet, so this UI does not claim cross-device sign-in. Local trash does not delete remote drafts.

Cloud storage is private. `/preview` still reads the local workspace, including in-memory edits, and is not a recipient URL. Share Link stays disabled until publishing is implemented.

Next: published snapshots and recipient routes; then account linking/recovery, unpublish/delete, quotas/cleanup and QR tickets. Collaboration/RSVP/AR remain later work.

For a new environment, run the checked-in migration once in that project's SQL Editor; do not rerun it on an already-initialized table. No database password or privileged key belongs in frontend variables or Git.

References: [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security), [anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous), [public versus secret API keys](https://supabase.com/docs/guides/api/api-keys).

## Private media storage

- Bucket `draft-media` is private, with a 20 MiB object cap and an image/audio MIME allow-list. Authenticated owners can insert/read only `owner UUID/image-or-audio/SHA-256` paths. Restrictive policies protect this bucket even if another bucket has a broad policy. Clients cannot overwrite, rename or delete files, including their own. Existing buckets keep their policies.
- Per-draft manifests contain only kind, content identity, byte count and canonical MIME. The SQL constraint requires the exact deduplicated background/audio references in the card, bounded count, kind-specific sizes and matching custom-audio bytes. No remote URL or signed URL is persisted.
- Each background is at most 200 KiB after compression; custom audio is at most 20 MiB and 15 minutes, preserving existing selection limits. All local dependencies pass SHA-256/type/size checks before uploading. A missing local file stops the save and never silently drops a background or song.
- All files must upload successfully before the draft insert/revision update. Existing immutable paths are reused only after confirmed upload or verified download; confirmations are kept in memory per SDK client. Retries after reload download and verify existing bytes. A failed upload or stale revision never commits a partial snapshot. Successful files from a failed attempt may remain as private orphans; no automatic cleanup runs because files may be shared by other drafts. Quotas and reference-aware cleanup remain future work.
- Restore validates the complete manifest, verifies downloaded bytes and writes the original content identities into IndexedDB before returning the working copy. Verified cached files are reused; corrupted local files are repaired from verified remote bytes. Download/storage failure leaves the existing editor project untouched. Upload/download progress reports completed files, not an invented network percentage. Storage requests time out after two minutes; draft writes retain their 20-second timeout.
- Cloud draft code is loaded only after connecting, keeping the main bundle below 500 kB. The existing CakeScene chunk warning remains.
- `scripts/verify-cloud-media.mjs` passed against the live project using two isolated guests, one private fixture draft, a tiny PNG and the app's original WAV. It verifies fresh-cache downloads, duplicate reuse after a new SDK session, other-Guest/unsigned/public URL denial, forbidden foreign paths/overwrites, and rejection of incomplete manifests. Test data stays private and no existing user files are changed.
- Browser QA imports a generated gradient PNG and the app's original melody through the actual file pickers, then saves/restores a separate test card. No credentials or browser storage are extracted for verification.
