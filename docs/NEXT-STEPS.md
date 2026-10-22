# Remaining product work

Agreed scope (2026-10-22): finish the remaining requirements incrementally.
Real-time collaborative editing is deliberately deferred. WebAR is implemented as a trial feature on `gemini/webar-cake`.

1. **Email accounts — unpaused & verified** — SMTP sender configured and
   tested by owner. Guest upgrades and fresh-browser OTP sign-ins are active.
2. **QR invitation / ticket — implemented** — active published URLs generate
   downloadable invitation/QR PNGs. Actual downloaded files decode correctly;
   unpublished draft edits are excluded and disabled links cannot be exported.
3. **Receiver cake interactions — implemented** — individual candle extinguishing,
   celebratory wish banner, replay and confetti burst.
4. **Receiver animation polish — implemented** — staggered text/page reveals,
   floating celebration emojis, interactive tap reactions, reduced-motion compliance.
5. **Occasion-specific content — implemented** — wedding date/time/location/venue,
   direct Google Maps navigation, guest RSVP submission, creator RSVP dashboard
   with Burmese CSV export and copy-to-clipboard, and anniversary milestone timeline.
6. **Mobile and accessibility QA** — real phone/tablet keyboard behavior, photo
   gestures, cream/candle placement, audio/3D performance and keyboard navigation.
   Replace position-based completion checks with genuine per-step completion.
7. **Storage management — implemented** — browser storage estimate & quota usage gauge,
   asset breakdown (photos, audio tracks, projects), and safe retention garbage
   collection that removes unreferenced media without deleting files used by active
   or trashed projects.
8. **WebAR 3D Cake (Trial) — implemented** — dynamic USDZ export for native iOS
   Quick Look (AR on iPhone Safari/Chrome), binary GLTF (.glb) export for Android /
   universal 3D viewers, cross-device QR code modal, and AR triggers in both receiver
   story and creator cake editor.

Use focused `codex/` branches at sensible feature boundaries, preserve existing
UI work, verify changes, and commit/push each completed stage. Do not conflate
browser-only saving, private cloud saving and receiver publishing.
