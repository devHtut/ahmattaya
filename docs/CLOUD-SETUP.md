# Cloud publishing setup — next stage

The UI checkpoint is preserved at `0822734` on `claude/unique-ui-redesign`.
Work continues on `codex/publishing-foundation`. All pre-existing local branches
were pushed to origin without force updates.

## Current behavior

Projects, photos, backgrounds and music remain local to this browser/origin.
`/preview` reads the current editor workspace, including unsaved in-memory edits;
it is not a recipient URL. The Share dialog explains this and does not offer a
Copy Link action. Vercel hosting alone does not publish individual projects.

## Project configuration received

The owner supplied the new project URL and legacy public `anon` key. They are
stored only in ignored `.env.local`; `.env.example` documents the variable names.
Both `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_ANON_KEY` are supported.
Configuration validation rejects secret/service-role keys, insecure URLs and
legacy keys for a different Supabase project. This is a configuration guard, not
server-side authentication validation. The official SDK is dynamically imported
only when the Share dialog's cloud panel is opened.

The public Auth settings endpoint responded successfully. The first guest sign-in
attempt returned `anonymous_provider_disabled`; the owner then enabled Anonymous
Sign-Ins. A real browser guest sign-in and server-verified restoration after reload
both succeeded. The public key cannot change administrative project settings. No database
schema, media bucket or cloud draft has been created by this change.

The Share dialog exposes an explicit Guest connection action; it never creates
anonymous users during page loads. Existing sessions are restored and checked
with `getUser()` instead of being treated as verified solely from local storage.
The SDK persists and refreshes the session, while the UI continues to identify
projects as browser-local. Closing/reopening the panel rechecks the session.
Provider-disabled, CAPTCHA and rate-limit errors receive readable messages.
Guest creation and reload restoration are verified. Private-draft/RLS migrations
are the next stage.

Database passwords and service-role/secret keys must not be placed in frontend
variables or committed. Do not confuse a connected guest session with a completed
cloud save or a published recipient link. Vercel public environment configuration is managed separately from Git. Production and Preview public variables are configured. The production deployment
is ready at https://ahmattaya.vercel.app; guest sign-in and server-verified session
restoration after reload both passed on the hosted site.

## Implementation sequence

1. Enable guest (anonymous) authentication and establish owner identity. Guests
   must be able to later register/claim their cards. Anonymous sign-in requires
   the provider to be enabled and abuse protection to be configured.
2. Add reviewed database migrations and RLS for private drafts, ownership/access,
   media records and published snapshots. Keep public card content separated from
   private editing credentials. Verify policies using owner, unrelated user and
   unauthenticated requests before deployment.
3. Upload compressed images and bounded audio into storage, replacing device-local
   references in published snapshots. Validate type/size and limit access to media
   associated with a published snapshot. Preserve local projects during migration.
4. Publish a validated snapshot and return a unique recipient URL only after the
   server confirms success. Recipient routes must fetch by the public card ID;
   they must never fall back to the visitor's local editor project.
5. Implement owner edit/unpublish/delete, then QR tickets and optional account
   sign-up/claim. Track quotas and clean abandoned/expired media without removing
   assets still referenced by drafts or published snapshots.

Guest ownership, storage policies and the public/private boundary are prerequisites
for a usable Publish button. Collaborative editing, RSVP and AR remain later stages.

References: [Supabase anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous),
[public versus secret API keys](https://supabase.com/docs/guides/api/api-keys).
