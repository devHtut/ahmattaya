# AhMatTaYa (အမှတ်တရ)

Myanmar-first interactive digital experience creator. Clean foundation rebuild on `codex/foundation-rebuild`, based on `main`.

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
- Responsive Creator Studio shell with text and theme editing.
- Validated browser-local draft recovery and live/static receiver preview.
- React Router routes: `/`, `/create`, `/preview`, and not-found.
- Versioned Zod card schema, TypeScript strict mode, shared design tokens.

Drafts save after each edit in this browser and recover on refresh. They are not synced between devices or accounts. Storage failures appear in the editor; invalid or future-version drafts remain untouched until the creator explicitly replaces them. Editing a draft in multiple tabs is not coordinated yet; the last saved edit wins. Publishing, authentication, uploads, QR tickets, RSVP, music, 3D and AR are future milestones. No backend credentials are required. Do not present preview URLs as published cards.

## Structure

`src/app` owns routes and session draft state. `src/features` separates Home, Creator and Receiver. `src/shared` contains the card model, occasion defaults and reusable preview. Dependencies are introduced when needed rather than installing the whole proposed stack upfront.

The schema is the initial shared contract; publish-time required fields and occasion-specific configs will be added before persistence. Form controls enforce current length limits. Google Fonts are external requests, with local sans-serif fallbacks.

## Deployment

The host must serve `index.html` for unknown application routes (SPA fallback), so direct visits and reloads on `/create` and `/preview` work.

## Next stages

1. Occasion-specific schema and template-driven editing.
2. Full template/theme editors and responsive preview controls.
3. Supabase migrations/RLS, hybrid authentication, media and publishing.
4. Receiver interactions, followed by 3D/AR as separate milestones.

The earlier audit is retained in `docs/SPRINT-1-AUDIT.md` as historical context; its findings describe the removed prototype.
