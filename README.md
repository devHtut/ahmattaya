# AhMatTaYa (အမှတ်တရ)

Myanmar-first interactive digital experience creator. Clean foundation rebuild based on `main`. Current feature: `codex/creator-customization`, branched from the completed foundation milestone.

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
- Guided Creator Studio with Next/Back: occasion, words, appearance and review.
- Six coordinated palettes, four custom color pickers, and independent heading/message font, size, bold, italic and alignment.
- Expandable live preview and keyboard-accessible step navigation.
- Validated browser-local draft recovery and live/static receiver preview.
- React Router routes: `/`, `/create`, `/preview`, and not-found.
- Versioned Zod card schema (v2), v1 draft migration, TypeScript strict mode, shared design tokens.

Drafts save after each edit in this browser and recover on refresh. They are not synced between devices or accounts. Storage failures appear in the editor; invalid or future-version drafts remain untouched until the creator explicitly replaces them. Editing a draft in multiple tabs is not coordinated yet; the last saved edit wins. Publishing, authentication, uploads, QR tickets, RSVP, music, 3D and AR are future milestones. No backend credentials are required. Do not present preview URLs as published cards.

## Structure

`src/app` owns routes and session draft state. `src/features` separates Home, Creator and Receiver. `src/shared` contains the card model, occasion defaults and reusable preview. Dependencies are introduced when needed rather than installing the whole proposed stack upfront.

The schema is the initial shared contract; publish-time required fields and occasion-specific configs will be added before persistence. Form controls enforce current length limits. Google Fonts are external requests, with local sans-serif fallbacks.

## Deployment

The host must serve `index.html` for unknown application routes (SPA fallback), so direct visits and reloads on `/create` and `/preview` work.

## Next stages

1. Photo drag-and-drop/compression and multiple pages with blank/lined layouts.
2. Occasion-specific fields, template selection and a separate Cake Studio step.
3. Supabase migrations/RLS, hybrid authentication, media and publishing.
4. Receiver interactions, followed by 3D/AR as separate milestones.

The earlier audit is retained in `docs/SPRINT-1-AUDIT.md` as historical context; its findings describe the removed prototype.

## Git workflow

Create a `codex/` feature branch for each independently reviewable feature; choose branch boundaries autonomously. Keep each stage small, run relevant checks, and commit working milestones. Do not delete earlier feature branches unless requested.

## Appearance and draft compatibility

The v2 card model stores four hex colors and separate heading/body typography. V1 text-only drafts load with theme-matched appearance defaults. Loading does not rewrite stored data; the next edit saves the upgraded v2 draft. Future versions or malformed drafts stay protected from automatic replacement. Font choices include Burmese fallbacks; italic can be synthesized for fonts without an italic face.

The wizard currently covers implemented features only. Photo/pages, music and the separate Cake Studio step will be added incrementally. Steps can be revisited freely, and unfinished drafts do not require publish-time fields.
