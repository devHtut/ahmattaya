# Downloadable QR invitations

Share → Publish (if needed) → QR invitation opens an export preview. The sender
can download either a 1080×1440 invitation PNG or a standalone 630×630 QR PNG.
The invitation includes the published receiver name, title, sender name and accent
color. Long text wraps at grapheme boundaries and is ellipsized to fit the layout.

Only active publications expose QR controls. Preparing the preview reads the
actual public snapshot, never the local draft. Every download rechecks the public
snapshot: unavailable/disabled links fail closed; a changed revision refreshes the
preview and asks for another download click. Republish retains the receiver URL,
so existing QR codes continue to point to the updated published card. Unpublishing
disables the receiver route; downloaded PNG copies themselves cannot be recalled.

The QR library loads only when the sender opens QR export. Encoding/rendering
happens locally; no third-party QR service receives the card URL or personal text.
Exports use black square modules with a four-module white quiet zone. Color and
branding do not overlap the QR. Myanmar fonts finish loading before rendering;
preview object URLs are revoked when closed/replaced.

This exports invitation links, not admission credentials or guest check-in codes.
No database migration, SMTP or account linking is required; existing guest owners
can use it. Account email verification remains paused at the user's request until
the Brevo sender is validated. Collaboration and WebAR remain deferred.

Verification:

- Unit tests decode the actual renderer's pixels and validate the canonical URL,
  quiet zone, invalid identities and bounded Myanmar/emoji text wrapping.
- Browser-generated invitation and QR PNGs were downloaded and decoded back to the
  exact receiver URL. The invitation was visually checked for Myanmar rendering.
- Changing the local draft title without publishing produced a byte-identical
  exported invitation. The draft title was restored after this isolated test.
- Disabling the test publication in a second tab prevented downloading from an
  already-open QR preview. Republish restored the same URL.

To verify downloaded files independently:

```sh
node --experimental-strip-types scripts/verify-qr-download.mjs <share-uuid> <invitation.png> <qr.png>
```
- The export dialog was visually checked in a 390px iframe viewport; both PNG
  actions fit without horizontal scrolling. Physical phone download/scan testing
  remains part of the later real-device QA stage.
- All 86 unit/database tests, lint and the production build pass.
