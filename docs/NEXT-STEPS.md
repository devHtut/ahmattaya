# Remaining product work

Agreed scope (2026-10-22): finish the remaining requirements incrementally.
Real-time collaborative editing and WebAR are deliberately deferred.

1. **Email accounts — unpaused & verified** — SMTP sender configured and
   tested by owner. Guest upgrades and fresh-browser OTP sign-ins are active.
2. **QR invitation / ticket — implemented** — active published URLs generate
   downloadable invitation/QR PNGs. Actual downloaded files decode correctly;
   unpublished draft edits are excluded and disabled links cannot be exported.
3. **Receiver cake interactions — implemented** — individual candle extinguishing,
   celebratory wish banner, replay and confetti burst.
4. **Receiver animation polish — implemented** — staggered text/page reveals,
   floating celebration emojis, interactive tap reactions, reduced-motion compliance.
5. **Occasion-specific content** — wedding date/time/location/Maps, private owner
   RSVP/guest list, and anniversary timeline. Define data migration and access
   rules before adding new public inputs.
6. **Mobile and accessibility QA** — real phone/tablet keyboard behavior, photo
   gestures, cream/candle placement, audio/3D performance and keyboard navigation.
   Replace position-based completion checks with genuine per-step completion.
7. **Storage management** — usage/quota visibility, retention and safe cleanup of
   unreferenced media without deleting files used by other drafts/publications.

Use focused `codex/` branches at sensible feature boundaries, preserve existing
UI work, verify changes, and commit/push each completed stage. Do not conflate
browser-only saving, private cloud saving and receiver publishing.
