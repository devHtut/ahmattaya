# AhMatTaYa (အမှတ်တရ)

Myanmar-first interactive digital experience creator. Clean foundation rebuild based on `main`. Current feature: `codex/freeform-photo-canvas`, branched from the photos/pages milestone.

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
- Guided Creator Studio with Next/Back: occasion, words, appearance, photos/pages and review.
- Six coordinated palettes, four custom color pickers, and independent heading/message font, size, bold, italic and alignment.
- Expandable sticky live preview and keyboard-accessible step navigation.
- Browser photo selection/drop, compression, captions, drag reorder and accessible move controls.
- Up to eight additional blank/lined pages, page ordering/deletion and full multi-page preview.
- Validated browser-local draft recovery and live/static receiver preview.
- React Router routes: `/`, `/create`, `/preview`, and not-found.
- Versioned Zod card schema (v4), v1/v2/v3 draft migration, TypeScript strict mode, shared design tokens.

Drafts save after each edit in this browser and recover on refresh. They are not synced between devices or accounts. Storage failures appear in the editor; invalid or future-version drafts remain untouched until the creator explicitly replaces them. Editing a draft in multiple tabs is not coordinated yet; the last saved edit wins. Publishing, authentication, cloud storage, QR tickets, RSVP, music, 3D and AR are future milestones. No backend credentials are required. Do not present preview URLs as published cards.

## Structure

`src/app` owns routes and session draft state. `src/features` separates Home, Creator and Receiver. `src/shared` contains the card model, occasion defaults and reusable preview. Dependencies are introduced when needed rather than installing the whole proposed stack upfront.

The schema is the initial shared contract; publish-time required fields and occasion-specific configs will be added before persistence. Form controls enforce current length limits. Google Fonts are external requests, with local sans-serif fallbacks.

## Deployment

The host must serve `index.html` for unknown application routes (SPA fallback), so direct visits and reloads on `/create` and `/preview` work.

## Next stages

1. Occasion-specific fields and template selection.
2. A separate Cake Studio step, followed by preset music.
3. Supabase migrations/RLS, hybrid authentication, media and publishing.
4. Receiver interactions, followed by 3D/AR as separate milestones.

The earlier audit is retained in `docs/SPRINT-1-AUDIT.md` as historical context; its findings describe the removed prototype.

## Git workflow

Create a `codex/` feature branch for each independently reviewable feature; choose branch boundaries autonomously. Keep each stage small, run relevant checks, and commit working milestones. Do not delete earlier feature branches unless requested.

## Appearance and draft compatibility

The current card model stores four hex colors and separate heading/body typography. V1 text-only drafts load with theme-matched appearance defaults. Loading does not rewrite stored data; the next edit saves the upgraded current-version draft. Future versions or malformed drafts stay protected from automatic replacement. Font choices include Burmese fallbacks; italic can be synthesized for fonts without an italic face.

The wizard currently covers implemented features only. Music and the separate Cake Studio step will be added incrementally. Steps can be revisited freely, and unfinished drafts do not require publish-time fields.

## Responsive editor preview

Laptop/desktop previews stay sticky while the properties panel scrolls with the page. At tablet widths (761–1100px), steps form a full-width row above a two-column editor. On phones, a compact, collapsible preview stays above the controls, capped at 38% of the viewport; long cards scroll inside that preview. The standalone receiver preview retains the full card layout. Verified in the browser at laptop width and in 390px/834px iframe viewports; real-device keyboard and touch testing remains outstanding.

## Photos and pages

All photos currently stay in the local browser draft as compressed raster data URLs; nothing is uploaded to a server. Accepts JPG, PNG and WebP inputs up to 15 MB each. Compression prefers WebP, targets 150 KB and enforces 200 KB per image. Unsupported WebP encoding falls back to the browser canvas format. A card allows five photos total across the cover and up to eight additional pages. Photos have independent position, width, aspect ratio, rotation and shadow settings. Their array order determines which photo is in front. A shared 3:4 page canvas keeps placement proportional across screen sizes. Cropping is not included; images preserve their proportions.

Each additional page has a title, message and blank/lined paper style, inheriting card typography and palette. Removing a page asks for confirmation and removes its photos too. V1/v2/v3 drafts migrate in memory and upgrade to v4 on the next edit. Photos/pages survive reload; browser storage quota failures are surfaced by the existing draft banner. Large photo drafts increase the amount stored per edit; an IndexedDB media adapter is a future improvement.

Verified in the browser: earlier-version recovery, adding/editing a lined page, selecting a PNG, WebP conversion (test photo about 12 KB), caption editing and full preview after reload. File drag/drop uses the same import pipeline; native touch/file-drop behavior still needs real-device testing.

## Free-position photo canvas

On the photos/pages step, select a photo in the preview or layer list. Drag it to move, drag the bottom-right handle to resize, and drag the upper handle to rotate. Keyboard arrows move a focused photo (Shift for larger steps). Arrow keys on handles resize/rotate. The properties panel also exposes position, size, rotation, shadow and front/back actions. Buried photos remain selectable from the layer list.

The page uses a 600×800 coordinate space with proportional typography. Text stays in its own scrollable page layer for long messages; photos may overlap it intentionally. Rotated photo bounds stay on the page. Pointer cancellation restores the pre-gesture appearance, and completed gestures save once. The large native-dialog workspace traps focus and supports Escape; phone previews offer the same full-page editing workspace.

V3 gallery photos get scrapbook placements during in-memory migration. Previous stored data is only upgraded on the next edit. Verified by mouse: move, resize, rotate, overlap, independent shadow, layer order and exact placement after reload. The full-page workspace was also checked at a 390px iframe viewport. Real phone/tablet touch and virtual-keyboard behavior still need device testing.
