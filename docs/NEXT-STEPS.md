# Remaining product work

Agreed scope (2026-10-22): finish the remaining requirements incrementally.
Real-time collaborative editing and WebAR are deliberately deferred.

1. **Email accounts — paused by request** — code is deployed, but Brevo rejected
   the unverified sender. Resume after sender validation, then verify guest upgrade
   and fresh-browser sign-in. Do not retry email codes while this is deferred.
2. **QR invitation / ticket — implemented** — active published URLs generate
   downloadable invitation/QR PNGs. Actual downloaded files decode correctly;
   unpublished draft edits are excluded and disabled links cannot be exported.
3. **Receiver cake interactions** — individual click/touch/keyboard candle
   extinguishing, optional microphone blow detection, wish/confetti, replay and
   microphone cleanup. Then extend cream decoration to selectable tiers/sides.
4. **Receiver animation polish** — staggered text/page reveals, floating emojis
   and music interaction; preserve reduced-motion settings and reading usability.
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
