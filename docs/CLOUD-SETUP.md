# Cloud publishing setup — next stage

The UI checkpoint is preserved at `0822734` on `claude/unique-ui-redesign`.
Work continues on `codex/publishing-foundation`. All pre-existing local branches
were pushed to origin without force updates.

## Current behavior

Projects, photos, backgrounds and music remain local to this browser/origin.
`/preview` reads the current editor workspace, including unsaved in-memory edits;
it is not a recipient URL. The Share dialog explains this and does not offer a
Copy Link action. Vercel hosting alone does not publish individual projects.

## New Supabase project required

The owner confirmed that a new Supabase project is needed. Before live backend
implementation, create/select that project in the owner's Supabase account and
provide its project URL and public publishable key (or legacy anon key). Database
passwords and service-role/secret keys must not be placed in frontend variables
or committed. Choose the project region and plan in the account before creating
billable resources. No Supabase project or database has been created by this
change, and no cloud requests are made by this frontend yet.

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
