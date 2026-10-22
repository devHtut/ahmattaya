# AhMatTaYa (အမှတ်တရ)

Myanmar-first interactive digital experience creator. Clean foundation rebuild based on `main`. Current feature: `codex/template-library`, branched from the custom music milestone.

## Development

Use Node.js 22.12+ (or a newer supported LTS).

```sh
npm ci
npm run dev
npm run lint
npm test
npm run build
```

## Current scope

- Burmese-first Home page and four occasion entry points.
- Guided Creator Studio with five horizontal stages: opening, card (words/appearance/occasion), pages, music and Cake Studio; Next/Back remains available.
- Six coordinated palettes, four custom color pickers, and independent heading/message font, size, bold, italic and alignment.
- Expandable sticky live preview and keyboard-accessible step navigation.
- Browser photo selection/drop, compression, captions, drag reorder and accessible move controls.
- Up to eight additional blank/lined pages, page ordering/deletion and full multi-page preview.
- Validated browser-local draft recovery and live/static receiver preview.
- React Router routes: `/`, `/templates`, `/projects`, `/create`, `/preview`, and not-found.
- Versioned Zod card schema (v8), v1–v7 draft migration, TypeScript strict mode, shared design tokens.

Drafts save after each edit in this browser and recover on refresh. They are not synced between devices or accounts. Storage failures appear in the editor; invalid or future-version drafts remain untouched until the creator explicitly replaces them. Editing a draft in multiple tabs is not coordinated yet; the last saved edit wins. Private cloud storage, receiver publishing and email accounts are described below. QR tickets, RSVP, interactive candles and AR remain future milestones. Local editing requires no backend configuration. Preview URLs are local previews, not published cards.

## Structure

`src/app` owns routes and session draft state. `src/features` separates Home, Creator and Receiver. `src/shared` contains the card model, occasion defaults and reusable preview. Dependencies are introduced when needed rather than installing the whole proposed stack upfront.

The schema is the initial shared contract; publish-time required fields and occasion-specific configs will be added before persistence. Form controls enforce current length limits. Google Fonts are external requests, with local sans-serif fallbacks.

## Deployment

The host must serve `index.html` for unknown application routes (SPA fallback), so direct visits and reloads on `/create` and `/preview` work.

## Next stages

1. Occasion-specific fields and template selection.
2. Receiver candle blowing with tap fallback, then microphone and AR as separate stages.
3. Supabase migrations/RLS, hybrid authentication, media and publishing.
4. Receiver interactions, followed by 3D/AR as separate milestones.

The earlier audit is retained in `docs/SPRINT-1-AUDIT.md` as historical context; its findings describe the removed prototype.

## Git workflow

Create a `codex/` feature branch for each independently reviewable feature; choose branch boundaries autonomously. Keep each stage small, run relevant checks, and commit working milestones. Do not delete earlier feature branches unless requested.

## Appearance and draft compatibility

The current card model stores four hex colors and separate heading/body typography. V1 text-only drafts load with theme-matched appearance defaults. Loading does not rewrite stored data; the next edit saves the upgraded current-version draft. Future versions or malformed drafts stay protected from automatic replacement. Font choices include Burmese fallbacks; italic can be synthesized for fonts without an italic face.

The wizard currently covers implemented features only. Cake Studio includes recipe foundations, top-surface cream drawing and candle placement. Steps can be revisited freely, and unfinished drafts do not require publish-time fields.

## Responsive editor preview

Laptop/desktop previews stay sticky while the properties panel scrolls with the page. On desktop and tablets, five horizontal stages sit above a two-column editor. On phones, a stage picker replaces the horizontal buttons, and a compact, collapsible preview stays above the controls, capped at 38% of the viewport; long cards scroll inside that preview. The standalone receiver preview retains the full card layout. Verified in the browser at laptop width and in 390px/834px iframe viewports; real-device keyboard and touch testing remains outstanding.

## Photos and pages

All photos currently stay in the local browser draft as compressed raster data URLs; nothing is uploaded to a server. Accepts JPG, PNG and WebP inputs up to 15 MB each. Compression prefers WebP, targets 150 KB and enforces 200 KB per image. Unsupported WebP encoding falls back to the browser canvas format. A card allows five photos total across the cover and up to eight additional pages. Photos have independent position, width, aspect ratio, rotation and shadow settings. Their array order determines which photo is in front. A shared 3:4 page canvas keeps placement proportional across screen sizes. Cropping is not included; images preserve their proportions.

Each additional page has a title, message and blank/lined paper style, inheriting card typography and palette. Removing a page asks for confirmation and removes its photos too. V1/v2/v3 drafts migrate in memory and upgrade to the current model on the next edit. Photos/pages survive reload; browser storage quota failures are surfaced by the existing draft banner. Large photo drafts increase the amount stored per edit; an IndexedDB media adapter is a future improvement.

Verified in the browser: earlier-version recovery, adding/editing a lined page, selecting a PNG, WebP conversion (test photo about 12 KB), caption editing and full preview after reload. File drag/drop uses the same import pipeline; native touch/file-drop behavior still needs real-device testing.

## Free-position photo canvas

On the photos/pages step, select a photo in the preview or layer list. Drag it to move, drag the bottom-right handle to resize, and drag the upper handle to rotate. Keyboard arrows move a focused photo (Shift for larger steps). Arrow keys on handles resize/rotate. The properties panel also exposes position, size, rotation, shadow and front/back actions. Buried photos remain selectable from the layer list.

The page uses a 600×800 coordinate space with proportional typography. Text stays in its own scrollable page layer for long messages; photos may overlap it intentionally. Rotated photo bounds stay on the page. Pointer cancellation restores the pre-gesture appearance, and completed gestures save once. The large native-dialog workspace traps focus and supports Escape; phone previews offer the same full-page editing workspace.

V3 gallery photos get scrapbook placements during in-memory migration. Previous stored data is only upgraded on the next edit. Verified by mouse: move, resize, rotate, overlap, independent shadow, layer order and exact placement after reload. The full-page workspace was also checked at a 390px iframe viewport. Real phone/tablet touch and virtual-keyboard behavior still need device testing.

## Preset music

The music step offers three original, project-generated instrumental sketches plus “no music”. No commercial tracks or third-party recordings are bundled. The procedural source and CC0 dedication are in `scripts/generate-music.py` and `public/music/README.md`. WAV assets total about 3.1 MB, load only on Play (`preload="none"`), and are kept outside the JS bundle and saved card payload.

Cards save an allowlisted preset ID or a local custom audio asset reference, initial volume and repeat preference. Older drafts migrate to no music. The shared native player never autoplays, stops on track changes/unmount, supports native pause/seek controls, and reports media errors. Receiver preview keeps one player across the page stack; reload restores the configuration but requires a new opening/Play action. Mobile devices may use system volume controls.

Verified in-browser: actual playback progression without media errors, switching tracks, silent receiver reload, and saved track/volume/repeat settings. Tests also check every bundled asset for valid PCM, audible signal levels, duration and size. Real-device mobile playback and subjective listening review remain outstanding.

## Opening invitation

A separate creator step configures an envelope or gift-box opening, four colors, bounded title/message/button text, a curated seal emoji, and gentle/sparkles/fade/no animation. Opening appearance is independent of inner-page appearance. Creator preview replays the visual effect without starting audio. Wizard steps use stable IDs so inserting stages does not shift existing editors.

Receiver preview starts sealed, revealing inner pages only after the opening button is activated. If configured, the existing music player starts directly from that click gesture; a recipient checkbox allows opening silently. A rejected play request leaves manual Play available. Replay pauses/resets music and returns to the sealed state. Focus moves into revealed content and back to the opening button on replay. Reduced-motion preference skips the reveal delay and decorative animation.

This is the local receiver preview flow; public publishing/links are still a later milestone. V1–v5 drafts get opening defaults in memory without rewriting storage on load. Verified in-browser: custom text/color/emoji restoration, sealed reload, opening reveal with music, silent reveal, replay audio reset and content focus. Real-device mobile animation/audio testing remains outstanding.

## Cake Studio foundation

Optional JSON cake recipes include vanilla/chocolate/strawberry sponge, one/two/three tiers, cream/accent colors and plain/pearls/berries decoration. Three editable starter designs and a blank recipe are available. Disabling a cake preserves its settings while omitting it from receiver preview. Prior drafts migrate with cake disabled.

The procedural Three.js renderer and OrbitControls load only when an enabled cake is displayed. Creator and receiver share that renderer/recipe. Geometry is replaced and disposed when the recipe changes while the canvas/camera remain stable. Rendering occurs only on changes or resize, with capped pixel ratio, instanced pearls and no perpetual animation loop. WebGL/context/loading failures show a recipe-matched SVG fallback. Geometry, materials, controls, shadow resources, ResizeObserver and canvas are cleaned up on unmount.

Receiver candle blowing, microphone and AR remain future stages. Flavor is represented visually by sponge color. Browser-tested: actual WebGL rendering, 3-tier preset, custom cream color, orbit drag, saved recipe restoration and receiver rendering after the invitation opens; no browser console errors observed. Real-device touch, hardware fallback and performance tests remain outstanding.

The separately loaded CakeScene bundle is currently about 598 KB minified / 151 KB gzip; the build reports its size warning. It does not load for Home, a disabled cake or a sealed receiver preview. Further mobile delivery optimization is reserved for performance testing.

## Cake decoration

Creator-only modes separate Orbit, Cream and Candles. Draw on the topmost cake surface in 3D, or use the shared normalized top-view SVG pad. Brush color/width are selectable; cream Undo/Redo is session-local and a new stroke clears redo. Gesture completion saves once; cancelled strokes are discarded. Drawing samples are capped at 160 points per stroke and 60 strokes per recipe. The current tool decorates only the topmost tier, with proportions retained when tier count changes.

Candles support classic, spiral, heart, star and seven-segment digits 0–9. Tap to add, drag an existing candle to move, or select it from the list to change design/color/digit/location/delete. Keyboard-accessible center-add and position sliders offer an alternative to pointer placement. Up to 12 candles are allowed. Candle/cream positions are validated inside an inset circle, protecting the cake edge. The selected candle has an editor-only ring. Receiver rendering uses the same saved recipe without editing controls. Flame visuals are static in this stage.

V7 base cakes migrate with empty decoration arrays while preserving all existing settings. No model uploads are stored: cream paths and candle records are bounded JSON. Rendered geometry and temporary stroke previews are disposed on replacement/cancel/unmount. Geometry tests cover every candle style and digit, dot/path cream, limits and migrations. Browser-tested: 3D drawing, Undo/Redo, top-pad drawing, adding/moving a candle without duplication, and number candles. Real touch/pointer-cancel/hardware fallback testing is still outstanding.

## Project workspace

Branch `codex/editor-projects` adds a top File/name/local-save/Undo/Redo/Preview/Share toolbar, a horizontal five-stage navigator, and a compact stage picker on phones. Undo/Redo retains the last ten card edits in this session; Cake cream tools also retain their own stroke history. Share explains that public links are not yet available.

`/projects` lists local projects with thumbnails, names and timestamps. Create, rename, duplicate, reopen, move to recoverable trash and restore are supported. The validated version-1 project library stores all projects and the active selection in one localStorage envelope. The previous single draft migrates in memory and is retained untouched as a backup; the first edit or project action writes the new library. Invalid/future library data blocks automatic writes; quota failures retain current state in memory and offer Retry. Trashed projects still consume browser storage. Cloud sync, real-time collaboration, public sharing and collaboration remain separate milestones.

Verified: legacy recovery, project duplication, card edit/Undo, recoverable trash/restore, Share explanation and project persistence after reload. Browser-storage tests cover migration, multiple projects, active selection, invalid/future data, duplicate IDs and quota failures.

## Page background images

Cover backgrounds live in Card → Appearance and are also editable from Pages. Every extra page has an independent background editor. Upload/drop one JPG, PNG or WebP (up to 15 MB); the existing compression pipeline produces a local image up to 200 KB. Position, 100–300% zoom, image opacity, overlay color and overlay opacity update the shared creator/full-canvas/receiver renderer. Paper lines and freely positioned photos remain above the background. Reset and remove are undoable with toolbar history.

Card schema v9 adds nullable cover/page backgrounds. V1–v8 drafts and v8 project libraries migrate without rewriting storage on read. Invalid/future data remains protected. Background image bytes are immutable, content-addressed Blobs in IndexedDB (`ahmattaya.media`); localStorage holds only image IDs and settings. The image transaction completes before attaching its reference to a project. Duplicates share the asset, object URLs are revoked on replacement/unmount, and image-storage failures leave the previous background in place. Existing scrapbook photos retain their previous bounded data-URL storage for now.

Removed/replaced background assets are retained to protect Undo and copied/trashed projects; automatic garbage collection and storage management remain future work. Clearing browser site data removes both projects and media; these are local drafts, not cloud backups. Missing assets show a readable fallback plus an editor replacement option. Native phone file picking/touch and storage eviction still need real-device testing.

Tests cover schema bounds, independent page settings, v8 library migration, shared asset IDs, metadata roundtrip and unsupported/oversized uploads. Browser checks cover image upload/compression, cover/page isolation, position/zoom/overlay edits, remove/Undo and receiver persistence after a full reload.

## Custom music

The Music stage supports one creator-supplied audio file alongside the three preset loops. Pick/drop MP3, M4A, WAV, OGG or WebM (up to 20 MB and 15 minutes); actual format/codec support depends on the browser. File type/size and finite audio duration are checked before storage. Metadata reading has a 15-second timeout and cleans up the temporary audio element/object URL. No audio starts during upload.

Custom bytes live as immutable SHA-256-addressed Blobs in IndexedDB (`ahmattaya.audio`), separate from small project metadata. Files are stored without transcoding; duplicates and Undo share the stored asset. Successful transaction completion precedes updating the project. A failed import preserves the existing selection. Preset/none selections retain the uploaded custom option for reuse; Remove clears the reference and is undoable. Removed/replaced files are retained to protect copied/trashed projects and Undo; garbage collection/storage management remain future work. Clearing browser data removes these local assets.

Card schema v10 migrates v1–v9 cards and project libraries without writing on load, preserving presets, background images, volume and loop. Receivers restore the custom file silently; opening can play it synchronously from the click gesture, with a silent-opening checkbox and manual Play fallback. Replay pauses and rewinds. Loading/missing-file states leave the card readable. Object URLs and audio elements are cleaned up on replacement/unmount; a new upload revision allows retrying the same asset after a missing-file read.

Verified in-browser with a local WAV: import/duration, actual playback progression, failed malformed-WAV replacement preserving the previous file, preset/custom switching, volume/loop, Remove/Undo, reload restoration and opening playback. Unit tests cover limits/metadata validation, supported file checks, v9 migration and shared IDs across project copies. Real-device mobile volume/audio-codec compatibility and long-file playback still need testing. Public upload/sharing and trimming are not implemented.

## Template library

`/templates` offers six editable starters across birthday, anniversary, wedding invitation and wedding wish. Each combines authored Burmese copy, typography/palette, an opening, optional extra blank/lined pages, a preset soundtrack and optional cake recipe. Birthday cakes include editable starter candles. Starters have no private names, external assets or device-local file references. The same CardPreview renders gallery thumbnails, modal previews and actual projects. Cake previews use the lightweight 2D illustration; the 3D renderer remains lazy in the editor.

Occasion filters live in the URL (`?occasion=anniversary` etc.). A native dialog previews the opening, cover, each included page and cake, without playing music or creating a project. Selecting a starter creates a fresh named project, preserving the previous library and keeping storage errors visible. Every factory call produces independent editable objects. A blank-project option remains available and follows the selected occasion. Home occasion links, the main navigation, Projects → New and the editor File → New all lead to the gallery; merely browsing/filtering/previewing does not create drafts.

Tests validate every starter, occasion coverage, identity/reference constraints, independence across edits, unknown IDs and multi-project storage roundtrips. Browser verification covers preview switching/Escape, filters, creating a named template project, reload persistence and retaining earlier projects. Gallery layouts were checked in 390px and 834px iframe viewports; real-device touch and mobile modal testing remain outstanding. Templates are bundled code definitions; template uploads, user-saved templates and a remote marketplace are not part of this stage.

## Vercel hosting

The mobile-testing site is https://ahmattaya.vercel.app (Vercel project `ahmattaya`, scope `devhtutkhaung-7649s-projects`). The first CLI deployment was assigned to production automatically. `vercel.json` selects Vite, builds with `npm run build`, serves `dist`, and rewrites client routes to `index.html` so direct visits/refreshes work. `.vercel` is untracked; deployment ignores local dependencies, generated output, docs/tests and environment files.

Verified on the public URL: direct `/templates`, creating a starter and refreshing `/create` with the project restored. Hosting alone does not sync localhost/mobile drafts. Receiver links now use explicit cloud publishing as described below. Each browser/origin retains its own localStorage and IndexedDB data. Use the stable production domain when testing persistence.

GitHub auto-deployment is not connected: Vercel reported that the account needs a GitHub Login Connection. CLI deployment succeeded independently. Future preview deployments can use `vercel deploy`; update the stable production site with `vercel deploy --prod` after checking the current feature branch.

## Publishing foundation

The latest refined Atelier UI was preserved at `0822734` and all existing local
branches pushed to origin. `codex/publishing-foundation` starts from that checkpoint.
The toolbar now explicitly labels browser-local saving, removes the misleading
`/preview` Copy Link action, and explains that recipient sharing requires cloud
publishing. Preview stays in the current app session so unsaved edits can still
be inspected. The existing UI design is retained.

Supabase client configuration and a Guest connection panel are now implemented.
The owner enabled Anonymous Sign-Ins; real guest creation and server-verified
session restoration after reload have succeeded. Keys stay in ignored `.env.local`; private drafts, media and published receiver links are implemented below. See [Cloud setup](docs/CLOUD-SETUP.md)
for the current verification results and the remaining owner/guest, media, RLS
and publishing stages.

### Private Cloud drafts

Cloud toolbar icon / Projects page → Guest connection → explicit Cloud Save. Owner-only drafts include embedded photos, background images, preset/custom music and cake settings. Background/audio files upload into private owner-only storage before a snapshot is saved, and are verified/cached locally before restore. Missing/corrupt files or partial uploads never produce a successful backup. A cloud restore creates a new local working copy and never replaces an existing browser draft. Updates protect against stale revisions. Guests can now link an unused email to retain their ownership and sign in on another device with an email code. Unlinked guest access remains tied to this browser session. Receiver links use a separate published snapshot, described below. See [Cloud setup](docs/CLOUD-SETUP.md) for the applied SQL migration and validation.

### Receiver Publish / Share

Cloud/Share → Guest connection → Publish saves a private draft, copies referenced
media to a separate private bucket and activates a read-only snapshot at
`https://ahmattaya.vercel.app/r/<UUID>`. Anyone with the link can view it without an
account. Later draft edits do not appear until republished. Republish keeps the
same URL; the owner can disable the link. Previously downloaded copies cannot be
recalled. This is a receiver link, not a collaboration invitation.

Public routes never initialize the editor workspace or use local drafts/media as
a fallback. Recipient media is verified and loaded into memory without signing
into an owner session. Direct receiver URLs work through the Vercel SPA rewrite.
See [Cloud setup](docs/CLOUD-SETUP.md) for migrations and live verification.

### Email accounts

Cloud/Share → Account → Email code. An existing guest upgrades in place after
email confirmation, retaining its owner ID, cloud drafts, media and share URLs.
Signed-out browsers can create/sign into an email account without a password and
restore cloud cards on another device. Local drafts are not uploaded automatically.
Sign-out affects this device, with an explicit reminder that browser copies remain.
The app blocks guest sign-out and never silently merges two existing identities.

Configure the three OTP email templates and manual linking using
[Account setup](docs/ACCOUNT-SETUP.md). No schema migration or secret server key is
required. Unit tests cover identity preservation, code/email validation, stale
identity rejection, local sign-out and friendly errors.
