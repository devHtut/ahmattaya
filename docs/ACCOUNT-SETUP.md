# Email account setup

This stage uses email one-time codes. No password is collected or stored by the
app. The owner must configure these settings using the Supabase Dashboard;
public project keys cannot change them. No database migration is required.

## Dashboard steps

1. Authentication → Sign In / Providers: keep Email enabled and email confirmation
   enabled. Enable **Allow manual linking** (under Authentication settings / user
   sign-up settings) so anonymous guests can attach an email identity. Keep
   anonymous sign-ins enabled. Do not disable secure email-change confirmation.
2. Authentication → Email Templates / Emails → Templates: paste the entire
   `supabase/email-templates/account-code.html` into the message body for all three:
   **Confirm signup**, **Magic Link**, **Change Email Address**. Suggested subject:
   `AhMatTaYa account verification code`. The `{{ .Token }}` variable must remain
   exactly as written. Save each template. The app consumes a code in the original
   tab, so these templates intentionally contain no redirect link.
3. Authentication → URL Configuration: Site URL `https://ahmattaya.vercel.app`.
4. Supabase's default email sender is restricted and rate limited. For general
   users configure Custom SMTP with your own sender/provider. Do not paste SMTP
   credentials into chat or commit them. During setup the project owner's
   authorized email may be used for a controlled test.

Official references:
- https://supabase.com/docs/guides/auth/auth-anonymous
- https://supabase.com/docs/guides/auth/auth-email-passwordless
- https://supabase.com/docs/guides/auth/auth-email-templates

## Behavior

- Signed-out browsers can sign in or create an account using an email code.
- A verified guest uses `updateUser({ email })`, then `verifyOtp` with
  `type: email_change`. Its immutable user ID is retained. Existing private cloud
  drafts, immutable media paths, published URLs and edit ownership stay intact.
- Existing accounts sign in on another device with `signInWithOtp` and
  `verifyOtp` with `type: email`. Cloud cards can then be restored as independent
  local working copies, edited and saved with the existing revision check.
- Browser-only drafts are not uploaded automatically. Cloud Save/Publish remain
  explicit. Signing out is local to this device and does not erase browser drafts;
  shared-device users must manage those local copies separately.
- Anonymous guests cannot sign out through this UI before linking, which avoids
  accidentally discarding their only cloud access. A guest email conflict is
  shown without signing into a different account. Merging two already-existing
  identities is not part of this stage; use an unused email to upgrade the guest.
- Auth changes update mounted Cloud panels. Owner changes remount cloud lists and
  publishing controls; receiver routes continue using their separate unsigned,
  non-persistent client.

Never log codes, sessions, JWTs or email API request bodies. OTPs are entered in
the app by the user; they do not need to be sent through chat.

## Brevo connection

In Supabase Custom SMTP, use the values from Brevo → SMTP & API → SMTP:

- Host: `smtp-relay.brevo.com`
- Port: `587`
- Username: the SMTP login shown by Brevo (it may differ from your account email)
- Password: a Brevo **SMTP key**, not an API key
- Sender email: an address verified/authorized in Brevo
- Sender name: `AhMatTaYa`

The SMTP key belongs only in Supabase's SMTP settings, never in frontend env vars.
After saving, update the three email templates above and test one guest upgrade,
then one fresh-browser sign-in. Enter the codes directly in the app.

Reference: https://developers.brevo.com/docs/supabase-smtp-integration

Implementation validation: 84 unit/database tests pass, lint/build pass. The local
browser renders the account form beside existing private cloud cards and active
published links. The owner configured Brevo SMTP, enabled manual linking and updated all three
OTP templates. The account UI is deployed to production. The server accepted
the initial code request and one user-requested resend. Email receipt, guest
conversion and fresh-browser sign-in still await the owner's code verification;
request acceptance alone does not establish delivery or a completed account.
