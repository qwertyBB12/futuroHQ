# Codebase Concerns

**Analysis Date:** 2026-03-07

## Tech Debt

**Duplicated GOVERNED_TYPES constant:**
- Issue: `GOVERNED_TYPES` is defined identically in two files and must be kept in sync manually.
- Files: `sanity.config.ts` (line 37), `deskStructure.ts` (line 21)
- Impact: If one is updated without the other, badges/actions will be out of sync with desk structure view tabs. Easy to miss during schema additions.
- Fix approach: Extract `GOVERNED_TYPES` and `BILINGUAL_TYPES` into a shared `constants.ts` and import in both files.

**Dual tag system (legacy string tags + reference tags):**
- Issue: Multiple schemas maintain both a `tags` field (string array) and a `tags_ref` or `tags` (reference to `tag` document) field. The legacy string tags are still present alongside the newer reference-based tags.
- Files: `schemaTypes/video.ts` (lines 177, 304), `schemaTypes/essay.ts` (line 117), `schemaTypes/opEd.ts` (line 78), `schemaTypes/curatedPost.ts` (lines 75, 86), `schemaTypes/socialPost.ts` (lines 146, 152), `schemaTypes/keynote.ts` (line 123), `schemaTypes/news.ts` (line 162), `schemaTypes/podcastEpisode.ts` (line 62)
- Impact: Confusing for editors (two places to add tags), frontends must query both, data is fragmented. Some schemas have migrated fully, others have not.
- Fix approach: Complete migration to reference-based tags for all schemas. Run a migration script to move legacy string tags to references. Then hide or remove legacy fields.

**Legacy `vlog` type retained but hidden:**
- Issue: The `vlog` document type is registered in the schema but hidden from the desk. Its data has been migrated to `video` type. The schema and migration scripts remain.
- Files: `schemaTypes/vlog.ts`, `schemaTypes/index.ts` (line 101), `deskStructure.ts` (line 46), `scripts/migrate-legacy-vlog-to-video.js`, `scripts/import-youtube-vlogs.ts`
- Impact: Increases schema surface area. Registered type still appears in GROQ queries unless explicitly filtered. Migration scripts (557+ lines) add maintenance burden.
- Fix approach: Verify zero documents of type `vlog` remain in production dataset. If confirmed, remove schema registration but keep file archived. Clean up or archive migration scripts.

**`alumniContinuum` type pending decision:**
- Issue: The `alumniContinuum` type is registered but hidden from the desk, with its own description noting "Status: pending review. May be kept or removed." It overlaps with `alumniDream` functionality.
- Files: `schemaTypes/alumniContinuum.ts`, `schemaTypes/index.ts` (line 102), `deskStructure.ts` (line 46)
- Impact: Dead code if unused. Schema bloat with 33+ document types already.
- Fix approach: Query production for documents of type `alumniContinuum`. If zero exist, remove. If used, consolidate with `alumniDream` or formalize its role.

**Inconsistent env var naming for AI endpoints:**
- Issue: Two separate AI features use different env var naming conventions. SEO generator uses `AI_SEO_GENERATOR_ENDPOINT` (no `SANITY_STUDIO_` prefix), while AI derivatives uses `SANITY_STUDIO_AI_ENDPOINT`. The `SANITY_STUDIO_` prefix is required for Sanity Studio to expose vars to the browser bundle.
- Files: `components/utils/fetchSeoSuggestion.ts` (line 14), `components/inputs/SeoGeneratorInput.tsx` (line 16), `components/actions/GenerateAIDerivativesAction.ts` (line 23)
- Impact: `AI_SEO_GENERATOR_ENDPOINT` without the `SANITY_STUDIO_` prefix will NOT be available in the browser at runtime. The SEO generator feature is likely broken in production builds.
- Fix approach: Rename `AI_SEO_GENERATOR_ENDPOINT` to `SANITY_STUDIO_AI_SEO_GENERATOR_ENDPOINT` in `fetchSeoSuggestion.ts`, `SeoGeneratorInput.tsx`, and `.env.local`.

**Arkah entity missing from governance fields:**
- Issue: The `governanceFields` block defines `narrativeOwner` options but does not include "Arkah" as a choice. However, Arkah appears in the dashboard health widget, ecosystem sites widget, and the `decision` schema's own entity list.
- Files: `schemaTypes/blocks/governanceBlock.ts` (line 48 — missing Arkah), `components/dashboard/EcosystemHealthWidget.tsx` (line 21 — has Arkah), `components/dashboard/EcosystemSitesWidget.tsx` (line 20 — has Arkah), `schemaTypes/decision.ts` (line 45 — has Arkah)
- Impact: Content cannot be assigned `narrativeOwner: 'arkah'` through the governance block, creating an inconsistency with the dashboard which tracks Arkah documents.
- Fix approach: Add `{title: 'Arkah (Built Environment)', value: 'arkah'}` to the `narrativeOwner` options in `schemaTypes/blocks/governanceBlock.ts`.

**Accumulated migration scripts:**
- Issue: 26 scripts in `scripts/` directory, many for one-time migrations that have already run (e.g., `migrate-legacy-vlog-to-video.js`, `migrate-opEd-vlog-to-essay-video.js`, `migrate-all-dotted-ids.ts`, `cleanup-dotted.ts`).
- Files: `scripts/` directory (26 files)
- Impact: Maintenance noise. New contributors may accidentally run completed migrations. Some scripts use hardcoded API keys/tokens via env vars.
- Fix approach: Move completed migration scripts to a `scripts/archive/` directory. Add a README documenting which have been run and when.

## Known Bugs

**SEO Generator likely broken in production:**
- Symptoms: "Generate" button is always disabled in deployed studio because `AI_SEO_GENERATOR_ENDPOINT` is not exposed to the browser bundle.
- Files: `components/utils/fetchSeoSuggestion.ts` (line 14), `components/inputs/SeoGeneratorInput.tsx` (line 16)
- Trigger: Deploy the studio and try to use the SEO generator. The `hasEndpoint` check on line 16 of `SeoGeneratorInput.tsx` will always be `false`.
- Workaround: Rename env var to use `SANITY_STUDIO_` prefix.

## Security Considerations

**Silent failure on webhook actions:**
- Risk: All webhook-based actions (deploy, social distribute, AI derivatives) silently catch and discard errors. If a webhook URL is misconfigured, the user gets no feedback.
- Files: `components/actions/TriggerDeployAction.ts` (line 28), `components/actions/SocialDistributeAction.ts` (line 57), `components/actions/GenerateAIDerivativesAction.ts` (line 65)
- Current mitigation: None. Errors are swallowed.
- Recommendations: Add toast notifications on failure using Sanity's `useToast` hook. At minimum log errors to console.

**Webhook URLs accessible in client bundle:**
- Risk: `SANITY_STUDIO_NETLIFY_BUILD_HOOK_URL` and `SANITY_STUDIO_SOCIAL_WEBHOOK_URL` are exposed in the browser bundle. Anyone with studio access can extract these URLs.
- Files: `components/actions/TriggerDeployAction.ts` (line 14), `components/actions/SocialDistributeAction.ts` (line 23)
- Current mitigation: Studio is behind Sanity authentication. Only authorized users can access.
- Recommendations: Acceptable risk for an admin tool. If webhook abuse becomes a concern, proxy through a server-side function with rate limiting.

**Full document sent to external AI endpoints:**
- Risk: `fetchSeoSuggestion` sends the entire `SanityDocument` object to the external endpoint, which may include governance fields, internal notes, or other sensitive metadata.
- Files: `components/utils/fetchSeoSuggestion.ts` (line 24)
- Current mitigation: None.
- Recommendations: Send only the fields needed for SEO generation (title, body, excerpt, description) rather than the full document.

## Performance Bottlenecks

**EcosystemHealthWidget makes 16 sequential GROQ queries:**
- Problem: Fetches entity counts with 14 individual `count()` queries (2 per entity) plus 2 global counts, all inside a single `Promise.all`. While parallel, this is 16 round trips to the content lake on every dashboard load.
- Files: `components/dashboard/EcosystemHealthWidget.tsx` (lines 31-56)
- Cause: Each entity count is a separate GROQ fetch rather than a single aggregation query.
- Improvement path: Combine into a single GROQ query using projections: `{"hector": count(*[narrativeOwner == "hector" && ...]), "benext": count(*[...]), ...}`. This reduces 16 queries to 1.

**LivePreview component is 828 lines with a massive switch statement:**
- Problem: A single component handles preview rendering for all 25+ document types via a ~500-line `useMemo` switch statement. Each schema addition requires modifying this file.
- Files: `components/previews/LivePreview.tsx`
- Cause: Monolithic preview approach rather than per-schema preview components.
- Improvement path: Extract each `case` block into a separate component (e.g., `EssayPreview.tsx`, `VideoPreview.tsx`). Use a registry pattern: `const PreviewComponents: Record<string, ComponentType> = {...}`.

**No caching or debouncing on dashboard GROQ queries:**
- Problem: Dashboard widgets (`EcosystemHealthWidget`, `RecentActivityWidget`, `SeoHealthWidget`, `MyDraftsWidget`, `PendingTasksWidget`) all fire GROQ queries on mount with no caching, stale-while-revalidate, or debouncing.
- Files: `components/dashboard/EcosystemHealthWidget.tsx`, `components/dashboard/RecentActivityWidget.tsx`, `components/dashboard/SeoHealthWidget.tsx`, `components/dashboard/MyDraftsWidget.tsx`, `components/dashboard/PendingTasksWidget.tsx`
- Cause: Each widget uses raw `useEffect` + `client.fetch` with no shared data layer.
- Improvement path: Implement a simple cache layer or use React Query / SWR for data fetching in dashboard widgets.

## Fragile Areas

**StudioHead favicon enforcement via MutationObserver:**
- Files: `components/StudioHead.tsx` (lines 45-78)
- Why fragile: Uses a `MutationObserver` watching `document.head` to intercept and remove Sanity's internally injected favicon links. This fights against the framework rather than working with it. Sanity SDK updates could change injection timing or method, breaking this workaround.
- Safe modification: Do not change the observer logic without testing against the specific Sanity version. The `FAVICON_VERSION` query parameter is used for cache-busting.
- Test coverage: None.

**Desk structure ungrouped fallback using internal API:**
- Files: `deskStructure.ts` (lines 86-98)
- Why fragile: Accesses `(listItem as any).getTypeNames()` which is an internal/undocumented Sanity API. This could break on any Sanity upgrade.
- Safe modification: If upgrading Sanity, test the "All Documents (Ungrouped)" section in the desk structure to verify it still works.
- Test coverage: None.

**`postbuild.js` removes Sanity core bridge script:**
- Files: `scripts/postbuild.js`
- Why fragile: Uses a regex to remove a `<script>` tag from the built `index.html`. If Sanity changes the bridge URL pattern or adds additional scripts, this will silently stop working or remove the wrong thing.
- Safe modification: After any Sanity version upgrade, verify the production build works correctly and check if the bridge script pattern has changed.
- Test coverage: None.

## Scaling Limits

**33 document types with shared governance block:**
- Current capacity: 33 registered document types, 20+ with governance fields.
- Limit: Adding more types increases the `GOVERNED_TYPES` set maintenance burden, the `LivePreview` switch statement, and the desk structure complexity.
- Scaling path: Consider a schema registry pattern where document types self-declare their capabilities (governance, preview, SEO) rather than maintaining central sets.

## Dependencies at Risk

**None critical.** Dependencies are standard Sanity ecosystem packages. Key observations:
- `sanity` at `^5.13.0` — major framework dependency, well maintained.
- `styled-components` at `^6.1.18` — required by Sanity UI, not directly used in custom code.
- `rss-parser` at `^3.13.0` — used only in podcast import scripts, not in the studio runtime.

## Missing Critical Features

**Zero test coverage:**
- Problem: No test files exist anywhere in the codebase. No test framework is configured. No `jest.config.*`, `vitest.config.*`, or test scripts in `package.json`.
- Blocks: Cannot verify schema changes don't break existing functionality. Cannot regression-test badge logic, action behavior, or dashboard widget rendering.

**No error feedback to users on action failures:**
- Problem: All custom document actions (Deploy, AI Derivatives, Social Distribute, Archive) catch errors silently. Users have no way to know if an action succeeded or failed.
- Blocks: Users may think content was deployed or distributed when it was not.

**No input validation on webhook payloads:**
- Problem: `SocialDistributeAction` sends document data to an external webhook without validating the response or confirming the payload structure matches what the automation expects.
- Files: `components/actions/SocialDistributeAction.ts` (lines 39-55)
- Blocks: Silent data loss if the webhook schema changes.

## Test Coverage Gaps

**Entire codebase untested:**
- What's not tested: All 33 schema definitions, all 4 document actions, all 4 document badges, all 7 dashboard widgets, all custom components, desk structure, theme configuration.
- Files: Every `.ts` and `.tsx` file in the project.
- Risk: Schema field renames or removals could silently break frontends consuming this data. Badge logic changes could go unverified. Action webhook integrations have no contract tests.
- Priority: High — schema definitions are the most critical to test since they affect all 7 frontend sites in the ecosystem.

**Recommended test priorities:**
1. Schema snapshot tests — verify field names, types, and validation rules don't change unexpectedly.
2. Badge component tests — verify correct badge labels and tones for each `narrativeOwner` / `platformTier` value.
3. Action integration tests — verify webhook payloads match expected contracts.
4. Dashboard widget tests — verify GROQ queries return expected shapes.

---

*Concerns audit: 2026-03-07*
