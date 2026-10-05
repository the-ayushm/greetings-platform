# Templates

A template = code (React scenes + CSS + schema + defaults) **plus** a database row
(`templates`, `template_versions`). Code and content schema ship together through a migration.

## Changing the scrapbook template

- **Look/behaviour:** edit `src/templates/scrapbook/*`. Do not edit `scrapbook.css` lines that came
  from the legacy file unless the change is intentional; add new rules in the "additions" block.
- Run `npx playwright test --project visual`. Any change in the 100 legacy screenshots or the 7
  motion timelines fails the build. `legacy/` stays frozen even for intentional design changes:
  record the decision and adjust the affected assertion (e.g. mask that region) in the same
  change, so reviewers see exactly what departs from the original.
- **Content fields:** edit `schema.ts` and `defaults.ts`.
  - Backward-compatible (new optional field with a default): fine as is.
  - Breaking: bump `SCHEMA_VERSION`, add a migration function for stored content, add a new
    `template_versions` row via `scripts/gen-template-migration.ts`, keep the old renderer path
    until existing sites are migrated. Published snapshots store their `schema_version`.
- Regenerate the seed after changing defaults: `npx tsx scripts/gen-template-migration.ts`
  (write it to a **new** migration file for an already-deployed database).

## Adding a new template

1. `src/templates/<key>/` with `Experience.tsx`, `schema.ts` (draft + publish), `defaults.ts`,
   CSS, and `referencedAssets()`.
2. Register it where the renderer and editor choose a template by `site.template_key`
   (today they import scrapbook directly — add a small registry map when the second template lands).
3. Migration inserting `templates`, `template_versions` (`is_current = true`) and a `products` row.
4. Visual baseline for the new template (its own reference screenshots) and add it to CI.
5. All artwork must be original or properly licensed; fonts must allow commercial embedding.

## Assets & licences

The scrapbook artwork is CSS/SVG written for this project. Fonts (Caveat, Fraunces, Nunito,
Pixelify Sans) are SIL OFL 1.1, self-hosted from `public/fonts/` (stylesheet: `src/templates/scrapbook/fonts/fonts.css`; licence texts in `public/fonts/licenses/`). The music-box
melody is the project's own sequence (owner to confirm originality — see RELEASE_CHECKLIST.md).
No Pinterest or third-party images are used.
